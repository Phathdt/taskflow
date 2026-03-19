import { type NotificationPayload } from '../entities'

export interface INotificationService {
  send(payload: NotificationPayload): Promise<void>
}
