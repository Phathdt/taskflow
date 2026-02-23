import KeyvRedis from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { AuthModule } from '@taskflow/auth'
import { CustomConfigModule, CustomConfigService } from '@taskflow/custom-config'
import { CustomLoggerModule } from '@taskflow/custom-logger'

import { LoggerErrorInterceptor } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'

import { AppController } from './app.controller'

import { AuthController } from '../controllers'
import {
  ResponseExceptionFilter,
  ResponseInterceptor,
  TraceIdInterceptor,
  ZodValidationExceptionFilter,
} from '../interceptors'

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
    AuthModule,
  ],
  controllers: [AppController, AuthController],
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
  ],
  exports: [],
})
export class AppModule {}
