import { Module, type Provider } from '@nestjs/common'
import { DatabaseModule, DatabaseService } from '@taskflow/database'

import { UserService } from './application'
import { type IUserRepository } from './domain'
import { USER_REPOSITORY, USER_SERVICE, UserPrismaRepository } from './infras'

const repositories: Provider[] = [
  {
    provide: USER_REPOSITORY,
    useFactory: (db: DatabaseService) => new UserPrismaRepository(db),
    inject: [DatabaseService],
  },
]

const services: Provider[] = [
  {
    provide: USER_SERVICE,
    useFactory: (userRepo: IUserRepository) => new UserService(userRepo),
    inject: [USER_REPOSITORY],
  },
]

@Module({
  imports: [DatabaseModule],
  providers: [...repositories, ...services],
  exports: [USER_SERVICE],
})
export class UserModule {}
