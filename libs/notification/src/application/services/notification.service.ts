import { type INotificationProvider, type INotificationService, type NotificationPayload } from '../../domain'

// Framework-agnostic notification service — usable in both NestJS and Worker
export class NotificationService implements INotificationService {
  constructor(private readonly providers: INotificationProvider[]) {}

  async send(payload: NotificationPayload): Promise<void> {
    const results = await Promise.allSettled(this.providers.map((provider) => provider.send(payload)))

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        console.error(`[Notification] Provider "${this.providers[i].name}" failed:`, result.reason)
      }
    }
  }
}
