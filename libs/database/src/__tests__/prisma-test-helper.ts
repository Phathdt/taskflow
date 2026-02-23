import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'

import { Pool } from 'pg'

import { PrismaClient } from '../generated/prisma/client'

export interface PrismaTestContext {
  container: StartedPostgreSqlContainer
  prismaClient: PrismaClient
  pool: Pool
}

export async function setupPostgresContainer(): Promise<PrismaTestContext> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start()

  const connectionUrl = container.getConnectionUri()
  const pool = new Pool({ connectionString: connectionUrl })

  // Run migration SQL directly
  const migrationPath = join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'prisma',
    'migrations',
    '20260223103912_init',
    'migration.sql'
  )
  const migrationSql = readFileSync(migrationPath, 'utf-8')
  await pool.query(migrationSql)

  // Create PrismaClient with pg adapter pointed at the container
  const adapter = new PrismaPg(pool)
  const prismaClient = new PrismaClient({ adapter })
  await prismaClient.$connect()

  return { container, prismaClient, pool }
}

export async function teardownPostgresContainer(ctx: PrismaTestContext): Promise<void> {
  await ctx.prismaClient.$disconnect()
  await ctx.pool.end()
  await ctx.container.stop()
}

export async function truncateAllTables(ctx: PrismaTestContext): Promise<void> {
  await ctx.pool.query('TRUNCATE TABLE "tasks" CASCADE')
  await ctx.pool.query('TRUNCATE TABLE "users" CASCADE')
}
