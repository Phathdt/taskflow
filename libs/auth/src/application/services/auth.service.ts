import { AppConflictException, AppNotFoundException, AppUnauthorizedException, generateToken } from '@taskflow/share'
import { Role, type IUserService, type User } from '@taskflow/user'

import * as bcrypt from 'bcryptjs'

import {
  type IAuthService,
  type IJwtTokenService,
  type ISessionStoreService,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
} from '../../domain'

export interface AuthServiceConfig {
  bcryptRounds: number
  sessionTtlSeconds: number
}

export class AuthService implements IAuthService {
  constructor(
    private readonly userService: IUserService,
    private readonly jwtTokenService: IJwtTokenService,
    private readonly sessionStore: ISessionStoreService,
    private readonly config: AuthServiceConfig
  ) {}

  async register(input: RegisterInput): Promise<User> {
    try {
      await this.userService.findByEmail(input.email)
      throw new AppConflictException('Email already registered')
    } catch (error) {
      if (error instanceof AppConflictException) throw error
      if (!(error instanceof AppNotFoundException)) throw error
    }

    const hashedPassword = await bcrypt.hash(input.password, this.config.bcryptRounds)

    return this.userService.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      role: Role.WORKER,
    })
  }

  async login(input: LoginInput): Promise<LoginResult> {
    let user
    try {
      user = await this.userService.findByEmail(input.email)
    } catch {
      throw new AppUnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password)
    if (!isPasswordValid) {
      throw new AppUnauthorizedException('Invalid credentials')
    }

    const subToken = generateToken()

    const token = this.jwtTokenService.sign({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subToken,
    })

    // Store JWT signature in Redis for whitelist validation
    const parts = token.split('.')
    const signature = parts[2]
    await this.sessionStore.save(user.id, subToken, signature, this.config.sessionTtlSeconds)

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }

  async logout(userId: number, _subToken: string): Promise<void> {
    await this.sessionStore.removeAllForUser(userId)
  }

  async me(userId: number): Promise<User> {
    return this.userService.findById(userId)
  }
}
