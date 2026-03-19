import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { CustomConfigService } from '@taskflow/custom-config'
import { Client, Connection } from '@temporalio/client'

@Injectable()
export class TemporalClientService implements OnModuleInit, OnModuleDestroy {
  private client!: Client
  private connection!: Connection

  private readonly address: string
  private readonly namespace: string
  private readonly taskQueue: string

  constructor(configService: CustomConfigService) {
    this.address = process.env.TEMPORAL_ADDRESS || configService.get<string>('temporal.address') || 'localhost:7233'
    this.namespace = process.env.TEMPORAL_NAMESPACE || configService.get<string>('temporal.namespace') || 'default'
    this.taskQueue =
      process.env.TEMPORAL_TASK_QUEUE || configService.get<string>('temporal.taskQueue') || 'taskflow-queue'
  }

  async onModuleInit(): Promise<void> {
    this.connection = await Connection.connect({ address: this.address })
    this.client = new Client({ connection: this.connection, namespace: this.namespace })
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.close()
  }

  async startWorkflow(workflowType: string, args: unknown[], workflowId: string): Promise<void> {
    await this.client.workflow.start(workflowType, {
      args,
      taskQueue: this.taskQueue,
      workflowId,
    })
  }
}
