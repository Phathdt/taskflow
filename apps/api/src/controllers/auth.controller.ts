import { Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AUTH_SERVICE,
  CurrentUser,
  LoginDto,
  LoginResponseSchema,
  LogoutResponseSchema,
  MeResponseSchema,
  Public,
  RegisterDto,
  RegisterResponseSchema,
  type IAuthService,
  type JwtPayload,
} from '@taskflow/auth'
import { SnakeToCamelInterceptor, TransformedBody, UseResponseSchema } from '@taskflow/share'

import { AuthGuard, RolesGuard } from '../guards'

@Controller('/auth')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(SnakeToCamelInterceptor)
export class AuthController {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: IAuthService) {}

  @Post('/register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UseResponseSchema('Register', 'Creates a new user account', RegisterResponseSchema, {
    status: HttpStatus.CREATED,
    auth: false,
  })
  async register(@TransformedBody() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UseResponseSchema('Login', 'Authenticates user and returns access token', LoginResponseSchema, { auth: false })
  async login(@TransformedBody() dto: LoginDto) {
    const result = await this.authService.login(dto)
    return {
      access_token: result.accessToken,
      user: result.user,
    }
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @UseResponseSchema('Logout', 'Invalidates the current session', LogoutResponseSchema)
  async logout(@CurrentUser() user: JwtPayload) {
    await this.authService.logout(user.userId, user.subToken)
    return { message: 'Logged out successfully' }
  }

  @Get('/me')
  @UseResponseSchema('Get current user', 'Returns the authenticated user profile', MeResponseSchema)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user.userId)
  }
}
