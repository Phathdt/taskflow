import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis'
import { Module, type Provider } from '@nestjs/common'
import { JwtModule, JwtService, type JwtModuleOptions } from '@nestjs/jwt'
import { CustomConfigModule, CustomConfigService } from '@taskflow/custom-config'
import { USER_SERVICE, UserModule, type IUserService } from '@taskflow/user'

import Redis from 'ioredis'

import { AuthService, JwtTokenService, type AuthServiceConfig } from './application'
import { type IJwtTokenService, type ISessionStoreService } from './domain'
import { AUTH_SERVICE, JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE, SessionRedisRepository } from './infras'

const repositories: Provider[] = [
  {
    provide: SESSION_STORE_SERVICE,
    useFactory: (redis: Redis) => new SessionRedisRepository(redis),
    inject: [getRedisConnectionToken()],
  },
]

const services: Provider[] = [
  {
    provide: JWT_TOKEN_SERVICE,
    useFactory: (jwtService: JwtService) => new JwtTokenService(jwtService),
    inject: [JwtService],
  },
  {
    provide: AUTH_SERVICE,
    useFactory: (
      userService: IUserService,
      jwtTokenService: IJwtTokenService,
      sessionStore: ISessionStoreService,
      configService: CustomConfigService
    ) => {
      const config: AuthServiceConfig = {
        bcryptRounds: configService.auth.bcryptRounds,
        sessionTtlSeconds: configService.auth.sessionTtlSeconds,
      }
      return new AuthService(userService, jwtTokenService, sessionStore, config)
    },
    inject: [USER_SERVICE, JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE, CustomConfigService],
  },
]

@Module({
  imports: [
    UserModule,
    CustomConfigModule,
    RedisModule.forRootAsync({
      imports: [CustomConfigModule],
      useFactory: (configService: CustomConfigService) => ({
        type: 'single' as const,
        url: configService.redis.url,
      }),
      inject: [CustomConfigService],
    }),
    JwtModule.registerAsync({
      imports: [CustomConfigModule],
      useFactory: (configService: CustomConfigService): JwtModuleOptions => {
        return {
          secret: configService.jwt.secret,
          signOptions: { expiresIn: configService.jwt.expiresIn },
        } as JwtModuleOptions
      },
      inject: [CustomConfigService],
    }),
  ],
  providers: [...repositories, ...services],
  exports: [AUTH_SERVICE, JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE],
})
export class AuthModule {}
