import { Module, type Provider } from '@nestjs/common'
import { DatabaseModule } from '@taskflow/database'

import { UserService } from './application'
import { USER_REPOSITORY, USER_SERVICE, UserPrismaRepository } from './infras'

const services: Provider[] = [{ provide: USER_SERVICE, useClass: UserService }]

const repositories: Provider[] = [{ provide: USER_REPOSITORY, useClass: UserPrismaRepository }]

@Module({
  imports: [DatabaseModule],
  providers: [...services, ...repositories],
  exports: [USER_SERVICE],
})
export class UserModule {}
