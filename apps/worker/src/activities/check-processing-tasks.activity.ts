import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@taskflow/database'

import { Pool } from 'pg'

// Shared PrismaClient instance for activities (reused across invocations)
let prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE__URL || ''
    const pool = new Pool({ connectionString: databaseUrl })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaPg(pool as any)
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export async function checkProcessingTasks(): Promise<string> {
  const db = getPrisma()

  const inProgressTasks = await db.task.findMany({
    where: { status: 'in_progress' },
    select: { id: true, title: true, status: true },
  })

  const message = `Found ${inProgressTasks.length} task(s) with status 'in_progress'`
  console.log(`[TaskMonitor] ${message}`)

  if (inProgressTasks.length > 0) {
    console.log(
      `[TaskMonitor] In-progress tasks: ${JSON.stringify(inProgressTasks.map((t) => ({ id: t.id, title: t.title })))}`
    )
  }

  return message
}
