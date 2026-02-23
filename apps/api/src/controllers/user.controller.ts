import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { CurrentUser, Roles, type JwtPayload } from '@taskflow/auth'
import { SnakeToCamelInterceptor, TransformedBody, TransformedQuery, UseResponseSchema } from '@taskflow/share'
import {
  ChangeRoleDto,
  ListUsersDto,
  Role,
  USER_SERVICE,
  UserListResponseSchema,
  UserResponseSchema,
  type IUserService,
} from '@taskflow/user'

import { AuthGuard, RolesGuard } from '../guards'

@Controller('/users')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(SnakeToCamelInterceptor)
export class UserController {
  constructor(@Inject(USER_SERVICE) private readonly userService: IUserService) {}

  @Get()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseResponseSchema('List users', 'Returns paginated list of users', UserListResponseSchema)
  async list(@TransformedQuery() query: ListUsersDto) {
    return this.userService.findAll(query)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseResponseSchema('Get user', 'Returns a single user by ID', UserResponseSchema)
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    if (user.role !== Role.ADMIN && user.userId !== id) {
      throw new ForbiddenException('You can only view your own profile')
    }
    return this.userService.findById(id)
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseResponseSchema('Change user role', 'Updates the role of a user', UserResponseSchema)
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @TransformedBody() dto: ChangeRoleDto,
    @CurrentUser() user: JwtPayload
  ) {
    if (user.userId === id) {
      throw new ForbiddenException('Cannot change your own role')
    }
    return this.userService.updateRole(id, dto.role)
  }
}
