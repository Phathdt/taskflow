import { ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { type Paginated, type PaginationRequest } from '@taskflow/share'
import { Role, USER_SERVICE, type IUserService, type RoleType } from '@taskflow/user'

import {
  type CreateTaskInput,
  type ITaskRepository,
  type ITaskService,
  type Task,
  type TaskFilterParams,
  type UpdateTaskInput,
} from '../../domain'
import { TASK_REPOSITORY } from '../../infras'

@Injectable()
export class TaskService implements ITaskService {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: ITaskRepository,
    @Inject(USER_SERVICE) private readonly userService: IUserService
  ) {}

  async create(data: CreateTaskInput): Promise<Task> {
    if (data.assigneeId) {
      await this.userService.findById(data.assigneeId)
    }
    return this.taskRepo.create(data)
  }

  async findById(id: number, userId: number, userRole: RoleType): Promise<Task> {
    const task = await this.taskRepo.findById(id)
    if (userRole !== Role.ADMIN && task.assigneeId !== userId) {
      throw new ForbiddenException('You can only view tasks assigned to you')
    }
    return task
  }

  async findAll(userId: number, userRole: RoleType, params: TaskFilterParams): Promise<Paginated<Task>> {
    if (userRole === Role.ADMIN) {
      return this.taskRepo.findAll(params)
    }
    return this.taskRepo.findAllByAssignee(userId, params as PaginationRequest)
  }

  async update(id: number, data: UpdateTaskInput, userId: number, userRole: RoleType): Promise<Task> {
    const task = await this.taskRepo.findById(id)

    if (userRole !== Role.ADMIN) {
      if (task.assigneeId !== userId) {
        throw new ForbiddenException('You can only update tasks assigned to you')
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
    return this.taskRepo.assign(id, assigneeId)
  }
}
