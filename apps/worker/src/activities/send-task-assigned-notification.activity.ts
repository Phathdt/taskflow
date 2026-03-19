import { ConsoleProvider, NotificationService, NotificationType } from '@taskflow/notification'

import { type TaskAssignedInput } from '../types'

// Shared instance (reused across invocations)
let notificationService: NotificationService | null = null

function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService([new ConsoleProvider()])
  }
  return notificationService
}

export async function sendTaskAssignedNotification(input: TaskAssignedInput): Promise<void> {
  const service = getNotificationService()

  await service.send({
    type: NotificationType.TASK_ASSIGNED,
    recipientId: input.assigneeId,
    title: `Task assigned: ${input.taskTitle}`,
    message: `Task #${input.taskId} "${input.taskTitle}" has been assigned to you`,
    metadata: { taskId: input.taskId },
  })
}
