import { type NotificationPayload } from '../entities'

export interface INotificationProvider {
  name: string
  send(payload: NotificationPayload): Promise<void>
}
