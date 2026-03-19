import { AppForbiddenException, type Paginated, type PaginationRequest } from '@taskflow/share'

import { type IUserRepository, type IUserService, type RoleType, type User, type UserWithPassword } from '../../domain'

export class UserService implements IUserService {
  constructor(private readonly userRepo: IUserRepository) {}

  async findByEmail(email: string): Promise<UserWithPassword> {
    return this.userRepo.findByEmail(email)
  }

  async findById(id: number): Promise<User> {
    return this.userRepo.findById(id)
  }

  async create(data: { email: string; password: string; name: string; role: RoleType }): Promise<User> {
    return this.userRepo.create(data)
  }

  async findAll(query: PaginationRequest): Promise<Paginated<User>> {
    return this.userRepo.findAll(query)
  }

  async updateRole(id: number, role: RoleType, requesterId: number): Promise<User> {
    if (requesterId === id) {
      throw new AppForbiddenException('Cannot change your own role')
    }
    return this.userRepo.updateRole(id, role)
  }
}
