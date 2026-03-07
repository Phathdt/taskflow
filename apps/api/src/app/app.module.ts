import KeyvRedis from '@keyv/redis'
import { BullModule } from '@nestjs/bullmq'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AuthModule } from '@taskflow/auth'
import { CustomConfigModule, CustomConfigService } from '@taskflow/custom-config'
import { CustomLoggerModule } from '@taskflow/custom-logger'
import { DatabaseModule } from '@taskflow/database'
import { QueueName } from '@taskflow/share'
import { TaskModule } from '@taskflow/task'
import { UserModule } from '@taskflow/user'

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
import { TaskMonitorProcessor } from '../processors'
import { TaskMonitorScheduler } from '../schedulers'

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
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [CustomConfigModule],
      useFactory: (configService: CustomConfigService) => {
        const redisUrl = new URL(configService.redis.url)
        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || 6379,
            ...(redisUrl.password && { password: decodeURIComponent(redisUrl.password) }),
          },
        }
      },
      inject: [CustomConfigService],
    }),
    BullModule.registerQueue({ name: QueueName.TaskMonitor }),
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
    // Scheduler and processor
    TaskMonitorScheduler,
    TaskMonitorProcessor,
  ],
  exports: [],
})
export class AppModule {}
