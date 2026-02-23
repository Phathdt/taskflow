import { type Paginated } from '@taskflow/share'
import { type RoleType } from '@taskflow/user'

import { type CreateTaskInput, type TaskFilterParams, type UpdateTaskInput } from './task.repository.interface'

import { type Task } from '../entities'

export interface ITaskService {
  create(data: CreateTaskInput): Promise<Task>
  findById(id: number, userId: number, userRole: RoleType): Promise<Task>
  findAll(userId: number, userRole: RoleType, params: TaskFilterParams): Promise<Paginated<Task>>
  update(id: number, data: UpdateTaskInput, userId: number, userRole: RoleType): Promise<Task>
  delete(id: number): Promise<void>
  assign(id: number, assigneeId: number): Promise<Task>
}
