import { AppForbiddenException, type Paginated } from '@taskflow/share'
import { Role, type IUserService, type RoleType } from '@taskflow/user'

import {
  type CreateTaskInput,
  type ITaskRepository,
  type ITaskService,
  type Task,
  type TaskFilterParams,
  type UpdateTaskInput,
} from '../../domain'

export interface TaskServiceCallbacks {
  onTaskAssigned?: (task: Task) => Promise<void>
}

export class TaskService implements ITaskService {
  private readonly callbacks: TaskServiceCallbacks

  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly userService: IUserService,
    callbacks?: TaskServiceCallbacks
  ) {
    this.callbacks = callbacks ?? {}
  }

  async create(data: CreateTaskInput): Promise<Task> {
    if (data.assigneeId) {
      await this.userService.findById(data.assigneeId)
    }
    return this.taskRepo.create(data)
  }

  async findById(id: number, userId: number, userRole: RoleType): Promise<Task> {
    const task = await this.taskRepo.findById(id)
    if (userRole !== Role.ADMIN && task.assigneeId !== userId) {
      throw new AppForbiddenException('You can only view tasks assigned to you')
    }
    return task
  }

  async findAll(userId: number, userRole: RoleType, params: TaskFilterParams): Promise<Paginated<Task>> {
    if (userRole === Role.ADMIN) {
      return this.taskRepo.findAll(params)
    }
    return this.taskRepo.findAll({ ...params, assigneeId: userId })
  }

  async update(id: number, data: UpdateTaskInput, userId: number, userRole: RoleType): Promise<Task> {
    const task = await this.taskRepo.findById(id)

    if (userRole !== Role.ADMIN) {
      if (task.assigneeId !== userId) {
        throw new AppForbiddenException('You can only update tasks assigned to you')
      }
      // Workers can only change status
      const workerUpdate: UpdateTaskInput = {}
      if (data.status) workerUpdate.status = data.status
      return this.taskRepo.update(id, workerUpdate)
    }

    return this.taskRepo.update(id, data)
  }

  async delete(id: number): Promise<void> {
    return this.taskRepo.delete(id)
  }

  async assign(id: number, assigneeId: number): Promise<Task> {
    await this.userService.findById(assigneeId)
    const task = await this.taskRepo.assign(id, assigneeId)

    if (this.callbacks.onTaskAssigned) {
      // Fire-and-forget: don't block the response
      this.callbacks.onTaskAssigned(task).catch(() => {})
    }

    return task
  }
}
