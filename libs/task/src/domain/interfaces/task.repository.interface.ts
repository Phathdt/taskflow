import { type Paginated, type PaginationRequest } from '@taskflow/share'

import { type PriorityType } from '../entities/priority.enum'
import { type TaskStatusType } from '../entities/task-status.enum'
import { type Task } from '../entities/task.entity'

export interface TaskFilterParams extends PaginationRequest {
  status?: TaskStatusType
  priority?: PriorityType
  assigneeId?: number
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority: PriorityType
  dueDate?: Date | null
  createdById: number
  assigneeId?: number | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatusType
  priority?: PriorityType
  dueDate?: Date | null
}

export interface ITaskRepository {
  create(data: CreateTaskInput): Promise<Task>
  findById(id: number): Promise<Task>
  findAll(params: TaskFilterParams): Promise<Paginated<Task>>
  findAllByAssignee(assigneeId: number, params: PaginationRequest): Promise<Paginated<Task>>
  update(id: number, data: UpdateTaskInput): Promise<Task>
  delete(id: number): Promise<void>
  assign(id: number, assigneeId: number): Promise<Task>
}
