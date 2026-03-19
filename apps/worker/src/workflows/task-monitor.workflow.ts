import { proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities'

const { checkProcessingTasks } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function taskMonitorWorkflow(): Promise<string> {
  return await checkProcessingTasks()
}
