import { Module, type Provider } from '@nestjs/common'
import { DatabaseModule, DatabaseService } from '@taskflow/database'
import { USER_SERVICE, UserModule, type IUserService } from '@taskflow/user'

import { TaskService } from './application'
import { type ITaskRepository } from './domain'
import { TASK_REPOSITORY, TASK_SERVICE, TaskPrismaRepository } from './infras'

const repositories: Provider[] = [
  {
    provide: TASK_REPOSITORY,
    useFactory: (db: DatabaseService) => new TaskPrismaRepository(db),
    inject: [DatabaseService],
  },
]

const services: Provider[] = [
  {
    provide: TASK_SERVICE,
    useFactory: (taskRepo: ITaskRepository, userService: IUserService) => new TaskService(taskRepo, userService),
    inject: [TASK_REPOSITORY, USER_SERVICE],
  },
]

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [...repositories, ...services],
  exports: [TASK_SERVICE, TASK_REPOSITORY],
})
export class TaskModule {}
