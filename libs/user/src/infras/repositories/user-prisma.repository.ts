import { Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService, User as UserPrisma } from '@taskflow/database'

import { type IUserRepository, type User, type UserWithPassword } from '../../domain'

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<UserWithPassword> {
    const user = await this.db.user.findUnique({ where: { email } })
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`)
    }
    return this._toUserWithPassword(user)
  }

  async findById(id: number): Promise<User> {
    const user = await this.db.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return this._toUser(user)
  }

  async create(data: { email: string; password: string; name: string; role: string }): Promise<User> {
    const user = await this.db.user.create({ data })
    return this._toUser(user)
  }

  private _toUser(data: UserPrisma): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }

  private _toUserWithPassword(data: UserPrisma): UserWithPassword {
    return {
      ...this._toUser(data),
      password: data.password,
    }
  }
}
