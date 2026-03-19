export const NotificationType = {
  TASK_ASSIGNED: 'task_assigned',
} as const

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType]

export interface NotificationPayload {
  type: NotificationTypeValue
  recipientId: number
  title: string
  message: string
  metadata?: Record<string, unknown>
}
