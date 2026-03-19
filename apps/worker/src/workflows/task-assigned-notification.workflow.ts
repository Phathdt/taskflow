import { proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities'
import { type TaskAssignedInput } from '../types'

const { sendTaskAssignedNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function taskAssignedNotificationWorkflow(input: TaskAssignedInput): Promise<void> {
  await sendTaskAssignedNotification(input)
}
