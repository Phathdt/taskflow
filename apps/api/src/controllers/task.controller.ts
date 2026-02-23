import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { CurrentUser, Roles, type JwtPayload } from '@taskflow/auth'
import { SnakeToCamelInterceptor, TransformedBody, TransformedQuery } from '@taskflow/share'
import {
  AssignTaskDto,
  CreateTaskDto,
  ListTasksDto,
  TASK_SERVICE,
  UpdateTaskDto,
  type ITaskService,
} from '@taskflow/task'
import { Role } from '@taskflow/user'

import { AuthGuard, RolesGuard } from '../guards'

@Controller('/tasks')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(SnakeToCamelInterceptor)
export class TaskController {
  constructor(@Inject(TASK_SERVICE) private readonly taskService: ITaskService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@TransformedBody() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.taskService.create({
      title: dto.title,
      description: dto.description ?? null,
      priority: dto.priority ?? 'medium',
      dueDate: dto.dueDate ?? null,
      createdById: user.userId,
      assigneeId: dto.assigneeId ?? null,
    })
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@TransformedQuery() query: ListTasksDto, @CurrentUser() user: JwtPayload) {
    return this.taskService.findAll(user.userId, user.role, query)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.taskService.findById(id, user.userId, user.role)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @TransformedBody() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.taskService.update(id, dto, user.userId, user.role)
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.taskService.delete(id)
    return { message: 'Task deleted successfully' }
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async assign(@Param('id', ParseIntPipe) id: number, @TransformedBody() dto: AssignTaskDto) {
    return this.taskService.assign(id, dto.assigneeId)
  }
}
