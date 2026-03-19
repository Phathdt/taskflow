import 'dotenv/config'

import { Client, Connection } from '@temporalio/client'
import { NativeConnection, Worker } from '@temporalio/worker'

import * as activities from './activities'
import { temporalConfig } from './config'

// Schedules to clean up from previous versions
const DEPRECATED_SCHEDULES = ['cron-sample-every-10s']

async function cleanupDeprecatedSchedules(client: Client): Promise<void> {
  for (const id of DEPRECATED_SCHEDULES) {
    try {
      await client.schedule.getHandle(id).delete()
      console.log(`Deleted deprecated schedule: ${id}`)
    } catch {
      // Schedule doesn't exist, ignore
    }
  }
}

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

  // Start Temporal client to manage schedules
  const clientConnection = await Connection.connect({ address: temporalConfig.address })
  const client = new Client({ connection: clientConnection, namespace: temporalConfig.namespace })

  // Clean up old schedules
  await cleanupDeprecatedSchedules(client)

  // Create task-monitor schedule
  const scheduleId = 'task-monitor-every-1m'
  try {
    await client.schedule.getHandle(scheduleId).delete()
  } catch {
    // Schedule doesn't exist yet, ignore
  }

  await client.schedule.create({
    scheduleId,
    spec: { intervals: [{ every: '1m' }] },
    action: {
      type: 'startWorkflow',
      workflowType: 'taskMonitorWorkflow',
      taskQueue: temporalConfig.taskQueue,
    },
  })

  console.log(`Temporal worker started | queue=${temporalConfig.taskQueue} | ns=${temporalConfig.namespace}`)
  console.log(`Schedule "${scheduleId}" created — runs every 1m`)
  await worker.run()
}

run().catch((err) => {
  console.error('Worker failed:', err)
  process.exit(1)
})
