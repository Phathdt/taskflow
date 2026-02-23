import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService, Task as TaskPrisma } from '@taskflow/database'
import { createPaginationResponse, type Paginated } from '@taskflow/share'

import {
  type CreateTaskInput,
  type ITaskRepository,
  type PriorityType,
  type Task,
  type TaskFilterParams,
  type TaskStatusType,
  type UpdateTaskInput,
} from '../../domain'

@Injectable()
export class TaskPrismaRepository implements ITaskRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateTaskInput): Promise<Task> {
    const task = await this.db.task.create({ data })
    return this._toTask(task)
  }

  async findById(id: number): Promise<Task> {
    const task = await this.db.task.findFirst({ where: { id } })
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`)
    return this._toTask(task)
  }

  async findAll(params: TaskFilterParams): Promise<Paginated<Task>> {
    const { page, limit, status, priority, assigneeId } = params
    const skip = (page - 1) * limit
    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
    }

    const [tasks, total] = await Promise.all([
      this.db.task.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.db.task.count({ where }),
    ])

    return {
      data: tasks.map((t) => this._toTask(t)),
      paging: createPaginationResponse(total, page, limit),
    }
  }

  async update(id: number, data: UpdateTaskInput): Promise<Task> {
    await this.findById(id)
    const task = await this.db.task.update({ where: { id }, data })
    return this._toTask(task)
  }

  async delete(id: number): Promise<void> {
    await this.findById(id)
    await this.db.task.delete({ where: { id } })
  }

  async assign(id: number, assigneeId: number): Promise<Task> {
    await this.findById(id)
    const task = await this.db.task.update({ where: { id }, data: { assigneeId } })
    return this._toTask(task)
  }

  private _toTask(data: TaskPrisma): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status as TaskStatusType,
      priority: data.priority as PriorityType,
      dueDate: data.dueDate,
      createdById: data.createdById,
      assigneeId: data.assigneeId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}
