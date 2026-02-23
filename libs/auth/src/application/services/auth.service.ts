import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { CustomConfigService } from '@taskflow/custom-config'
import { generateToken } from '@taskflow/share'
import { Role, USER_SERVICE, type IUserService, type User } from '@taskflow/user'

import * as bcrypt from 'bcryptjs'

import {
  type IAuthService,
  type IJwtTokenService,
  type ISessionStoreService,
  type LoginInput,
  type LoginResult,
  type RegisterInput,
} from '../../domain'
import { JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE } from '../../infras/di'

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: IUserService,
    @Inject(JWT_TOKEN_SERVICE) private readonly jwtTokenService: IJwtTokenService,
    @Inject(SESSION_STORE_SERVICE) private readonly sessionStore: ISessionStoreService,
    private readonly configService: CustomConfigService
  ) {}

  async register(input: RegisterInput): Promise<User> {
    try {
      await this.userService.findByEmail(input.email)
      throw new ConflictException('Email already registered')
    } catch (error) {
      if (error instanceof ConflictException) throw error
      if (!(error instanceof NotFoundException)) throw error
    }

    const hashedPassword = await bcrypt.hash(input.password, this.configService.auth.bcryptRounds)

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
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
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
    await this.sessionStore.save(user.id, subToken, signature, this.configService.auth.sessionTtlSeconds)

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
