import { Processor, WorkerHost } from '@nestjs/bullmq'
import { EnhancedLogger } from '@taskflow/custom-logger'
import { DatabaseService } from '@taskflow/database'
import { QueueName } from '@taskflow/share'

import { Job } from 'bullmq'

interface CheckProcessingTasksPayload {
  triggeredAt: string
}

@Processor(QueueName.TaskMonitor)
export class TaskMonitorProcessor extends WorkerHost {
  private readonly logger: EnhancedLogger

  constructor(
    private readonly db: DatabaseService,
    logger: EnhancedLogger
  ) {
    super()
    this.logger = logger.with({ context: TaskMonitorProcessor.name })
  }

  async process(job: Job<CheckProcessingTasksPayload>): Promise<void> {
    try {
      this.logger.log(`Processing job [id=${job.id}, name=${job.name}, triggeredAt=${job.data.triggeredAt}]`)

      const inProgressTasks = await this.db.task.findMany({
        where: { status: 'in_progress' },
        select: { id: true, title: true, status: true },
      })

      this.logger.log(`Found ${inProgressTasks.length} task(s) with status 'in_progress'`)

      if (inProgressTasks.length > 0) {
        this.logger.log(
          `In-progress tasks: ${JSON.stringify(inProgressTasks.map((t) => ({ id: t.id, title: t.title })))}`
        )
      }
    } catch (error) {
      this.logger.error(error instanceof Error ? error : new Error(String(error)), undefined, TaskMonitorProcessor.name)
      throw error
    }
  }
}
