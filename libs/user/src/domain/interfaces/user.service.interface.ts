import { type User, type UserWithPassword } from '../entities'

export interface IUserService {
  findByEmail(email: string): Promise<UserWithPassword>
  findById(id: number): Promise<User>
  create(data: { email: string; password: string; name: string; role: string }): Promise<User>
}
