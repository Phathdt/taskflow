import { PrismaPg } from '@prisma/adapter-pg'
import { CustomConfigService } from '@taskflow/custom-config'
import { SimpleLogger } from '@taskflow/custom-logger'
import { PrismaClient } from '@taskflow/database'

import { Pool } from 'pg'

// Shared instances for activities (reused across invocations)
let prisma: PrismaClient | null = null
let logger: SimpleLogger | null = null

function getConfig(): CustomConfigService {
  return new CustomConfigService()
}

function getLogger(): SimpleLogger {
  if (!logger) {
    const config = getConfig()
    logger = new SimpleLogger({
      level: config.log.level,
      context: 'TaskMonitor',
      enableJsonFormat: config.log.enableJsonFormat,
    })
  }
  return logger
}

function getPrisma(): PrismaClient {
  if (!prisma) {
    const config = getConfig()
    const pool = new Pool({ connectionString: config.database.url })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaPg(pool as any)
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export async function checkProcessingTasks(): Promise<string> {
  const db = getPrisma()
  const log = getLogger()

  const inProgressTasks = await db.task.findMany({
    where: { status: 'in_progress' },
    select: { id: true, title: true, status: true },
  })

  const message = `Found ${inProgressTasks.length} task(s) with status 'in_progress'`
  log.info(message)

  if (inProgressTasks.length > 0) {
    log.info(`In-progress tasks: ${JSON.stringify(inProgressTasks.map((t) => ({ id: t.id, title: t.title })))}`)
  }

  return message
}
