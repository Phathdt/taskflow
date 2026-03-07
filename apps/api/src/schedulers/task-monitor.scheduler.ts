import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EnhancedLogger } from '@taskflow/custom-logger'
import { TASK_MONITOR_QUEUE } from '@taskflow/share'

import { Queue } from 'bullmq'

@Injectable()
export class TaskMonitorScheduler {
  private readonly logger: EnhancedLogger

  constructor(
    @InjectQueue(TASK_MONITOR_QUEUE.MONITOR.NAME) private readonly taskMonitorQueue: Queue,
    logger: EnhancedLogger
  ) {
    this.logger = logger.with({ context: TaskMonitorScheduler.name })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    try {
      const job = await this.taskMonitorQueue.add(TASK_MONITOR_QUEUE.MONITOR.JOBS.CHECK_PROCESSING_TASKS, {
        triggeredAt: new Date().toISOString(),
      })
      this.logger.log(`Enqueued check-processing-tasks job [id=${job.id}]`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error : new Error(String(error)), undefined, TaskMonitorScheduler.name)
    }
  }
}
