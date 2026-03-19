import { Module, type Provider } from '@nestjs/common'

import { NotificationService } from './application'
import { type INotificationProvider } from './domain'
import { ConsoleProvider, NOTIFICATION_SERVICE } from './infras'

const services: Provider[] = [
  {
    provide: NOTIFICATION_SERVICE,
    useFactory: () => {
      const providers: INotificationProvider[] = [new ConsoleProvider()]
      return new NotificationService(providers)
    },
  },
]

@Module({
  providers: [...services],
  exports: [NOTIFICATION_SERVICE],
})
export class NotificationModule {}
