import { SimpleLogger } from '@taskflow/custom-logger'

import { type INotificationProvider, type NotificationPayload } from '../../domain'

export class ConsoleProvider implements INotificationProvider {
  name = 'console'
  private readonly logger: SimpleLogger

  constructor(logger?: SimpleLogger) {
    this.logger = logger ?? new SimpleLogger({ context: 'Notification:Console' })
  }

  async send(payload: NotificationPayload): Promise<void> {
    this.logger.info(`[${payload.type}] To user #${payload.recipientId}: ${payload.title} — ${payload.message}`)
  }
}
