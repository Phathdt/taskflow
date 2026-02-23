import { Module, type Provider } from '@nestjs/common'
import { DatabaseModule } from '@taskflow/database'
import { UserModule } from '@taskflow/user'

import { TaskService } from './application'
import { TaskPrismaRepository } from './infras'
import { TASK_REPOSITORY, TASK_SERVICE } from './infras/di'

const services: Provider[] = [{ provide: TASK_SERVICE, useClass: TaskService }]
const repositories: Provider[] = [{ provide: TASK_REPOSITORY, useClass: TaskPrismaRepository }]

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [...services, ...repositories],
  exports: [TASK_SERVICE],
})
export class TaskModule {}
