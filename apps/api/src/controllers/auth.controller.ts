import { Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AUTH_SERVICE,
  CurrentUser,
  LoginDto,
  Public,
  RegisterDto,
  type IAuthService,
  type JwtPayload,
} from '@taskflow/auth'
import { SnakeToCamelInterceptor, TransformedBody } from '@taskflow/share'

import { AuthGuard, RolesGuard } from '../guards'

@Controller('/auth')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(SnakeToCamelInterceptor)
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: IAuthService) {}

  @Post('/register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@TransformedBody() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@TransformedBody() dto: LoginDto) {
    const result = await this.authService.login(dto)
    return {
      access_token: result.accessToken,
      user: result.user,
    }
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.userId, user.subToken)
    return { message: 'Logged out successfully' }
  }

  @Get('/me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.userId)
  }
}
