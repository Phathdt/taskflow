import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { AuthModule } from '@taskflow/auth'
import { CustomConfigModule, CustomConfigService } from '@taskflow/custom-config'
import { CustomLoggerModule } from '@taskflow/custom-logger'
import { DatabaseModule } from '@taskflow/database'
import { TASK_REPOSITORY, TASK_SERVICE, TaskModule, TaskService, type ITaskRepository, type Task } from '@taskflow/task'
import { USER_SERVICE, UserModule, type IUserService } from '@taskflow/user'

import { LoggerErrorInterceptor } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'

import { AppController } from './app.controller'

import { AuthController, TaskController, UserController } from '../controllers'
import {
  ResponseExceptionFilter,
  ResponseInterceptor,
  TraceIdInterceptor,
  ZodValidationExceptionFilter,
} from '../interceptors'
import { TemporalClientService } from '../services'

@Module({
  imports: [
    CustomConfigModule,
    CustomLoggerModule,
    CacheModule.registerAsync({
      imports: [CustomConfigModule],
      useFactory: async (configService: CustomConfigService) => {
        return {
          stores: [new KeyvRedis(configService.redis.url)],
        }
      },
      inject: [CustomConfigService],
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    TaskModule,
  ],
  controllers: [AppController, AuthController, UserController, TaskController],
  providers: [
    // Global interceptors (order matters: LoggerError -> TraceId -> Response)
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TraceIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // Global filters
    { provide: APP_FILTER, useClass: ResponseExceptionFilter },
    { provide: APP_FILTER, useClass: ZodValidationExceptionFilter },
    // Global pipes
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Temporal client for triggering workflows
    TemporalClientService,
    // Override TASK_SERVICE to wire onTaskAssigned callback
    {
      provide: TASK_SERVICE,
      useFactory: (taskRepo: ITaskRepository, userService: IUserService, temporal: TemporalClientService) =>
        new TaskService(taskRepo, userService, {
          onTaskAssigned: async (task: Task) => {
            await temporal.startWorkflow(
              'taskAssignedNotificationWorkflow',
              [{ taskId: task.id, taskTitle: task.title, assigneeId: task.assigneeId }],
              `task-assigned-notification-${task.id}-${Date.now()}`
            )
          },
        }),
      inject: [TASK_REPOSITORY, USER_SERVICE, TemporalClientService],
    },
  ],
  exports: [],
})
export class AppModule {}
