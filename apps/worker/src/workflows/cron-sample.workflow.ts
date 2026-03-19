import { proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities'

const { logCronTick } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function cronSampleWorkflow(): Promise<string> {
  return await logCronTick()
}
