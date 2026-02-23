import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis'

import Redis from 'ioredis'

export interface RedisTestContext {
  container: StartedRedisContainer
  redisClient: Redis
}

export async function setupRedisContainer(): Promise<RedisTestContext> {
  const container = await new RedisContainer('redis:7.2-alpine').start()

  const redisClient = new Redis({
    host: container.getHost(),
    port: container.getMappedPort(6379),
  })

  return { container, redisClient }
}

export async function teardownRedisContainer(ctx: RedisTestContext): Promise<void> {
  await ctx.redisClient.quit()
  await ctx.container.stop()
}
