import { Inject, Injectable } from '@nestjs/common'

import { type IUserRepository, type IUserService, type User, type UserWithPassword } from '../../domain'
import { USER_REPOSITORY } from '../../infras/di'

@Injectable()
export class UserService implements IUserService {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository) {}

  async findByEmail(email: string): Promise<UserWithPassword> {
    return this.userRepo.findByEmail(email)
  }

  async findById(id: number): Promise<User> {
    return this.userRepo.findById(id)
  }

  async create(data: { email: string; password: string; name: string; role: string }): Promise<User> {
    return this.userRepo.create(data)
  }
}
