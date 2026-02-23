import { type User } from '@taskflow/user'

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  accessToken: string
  user: User
}

export interface IAuthService {
  register(input: RegisterInput): Promise<User>
  login(input: LoginInput): Promise<LoginResult>
  logout(userId: number, subToken: string): Promise<void>
  me(userId: number): Promise<User>
}
