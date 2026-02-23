import { RedisModule } from '@nestjs-modules/ioredis'
import { Module, type Provider } from '@nestjs/common'
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt'
import { CustomConfigModule, CustomConfigService } from '@taskflow/custom-config'
import { UserModule } from '@taskflow/user'

import { AuthService, JwtTokenService } from './application'
import { AUTH_SERVICE, JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE, SessionRedisRepository } from './infras'

const services: Provider[] = [
  { provide: AUTH_SERVICE, useClass: AuthService },
  { provide: JWT_TOKEN_SERVICE, useClass: JwtTokenService },
  { provide: SESSION_STORE_SERVICE, useClass: SessionRedisRepository },
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
  providers: [...services],
  exports: [AUTH_SERVICE, JWT_TOKEN_SERVICE, SESSION_STORE_SERVICE],
})
export class AuthModule {}
