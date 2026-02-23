import { type Paginated, type PaginationRequest } from '@taskflow/share'

import { type RoleType, type User, type UserWithPassword } from '../entities'

export interface IUserService {
  findByEmail(email: string): Promise<UserWithPassword>
  findById(id: number): Promise<User>
  create(data: { email: string; password: string; name: string; role: RoleType }): Promise<User>
  findAll(query: PaginationRequest): Promise<Paginated<User>>
  updateRole(id: number, role: RoleType, requesterId: number): Promise<User>
}
