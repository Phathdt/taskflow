import { Client, Connection } from '@temporalio/client'
import { NativeConnection, Worker } from '@temporalio/worker'

import * as activities from './activities'
import { temporalConfig } from './config'

async function run() {
  const nativeConnection = await NativeConnection.connect({
    address: temporalConfig.address,
  })

  const worker = await Worker.create({
    connection: nativeConnection,
    namespace: temporalConfig.namespace,
    taskQueue: temporalConfig.taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities,
  })

  // Start Temporal client to create the schedule
  const clientConnection = await Connection.connect({ address: temporalConfig.address })
  const client = new Client({ connection: clientConnection, namespace: temporalConfig.namespace })

  const scheduleId = 'cron-sample-every-10s'
  const handle = client.schedule.getHandle(scheduleId)

  try {
    // Delete existing schedule if any, then recreate
    await handle.delete()
  } catch {
    // Schedule doesn't exist yet, ignore
  }

  await client.schedule.create({
    scheduleId,
    spec: { intervals: [{ every: '10s' }] },
    action: {
      type: 'startWorkflow',
      workflowType: 'cronSampleWorkflow',
      taskQueue: temporalConfig.taskQueue,
    },
  })

  console.log(`Temporal worker started | queue=${temporalConfig.taskQueue} | ns=${temporalConfig.namespace}`)
  console.log(`Schedule "${scheduleId}" created — runs every 10s`)
  await worker.run()
}

run().catch((err) => {
  console.error('Worker failed:', err)
  process.exit(1)
})
