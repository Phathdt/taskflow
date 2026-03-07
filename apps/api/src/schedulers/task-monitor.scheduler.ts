import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { EnhancedLogger } from '@taskflow/custom-logger'
import { QueueName, TaskMonitorJob } from '@taskflow/share'

import { Queue } from 'bullmq'

@Injectable()
export class TaskMonitorScheduler {
  private readonly logger: EnhancedLogger

  constructor(
    @InjectQueue(QueueName.TaskMonitor) private readonly taskMonitorQueue: Queue,
    logger: EnhancedLogger
  ) {
    this.logger = logger.with({ context: TaskMonitorScheduler.name })
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    try {
      const job = await this.taskMonitorQueue.add(TaskMonitorJob.CheckProcessingTasks, {
        triggeredAt: new Date().toISOString(),
      })
      this.logger.log(`Enqueued check-processing-tasks job [id=${job.id}]`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error : new Error(String(error)), undefined, TaskMonitorScheduler.name)
    }
  }
}
