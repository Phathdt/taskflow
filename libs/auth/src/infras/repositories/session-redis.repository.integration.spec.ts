import {
  setupRedisContainer,
  teardownRedisContainer,
  type RedisTestContext,
} from '@taskflow/database/__tests__/redis-test-helper'

import { SessionRedisRepository } from './session-redis.repository'

jest.setTimeout(60_000)

describe('SessionRedisRepository (integration)', () => {
  let ctx: RedisTestContext
  let repo: SessionRedisRepository

  beforeAll(async () => {
    ctx = await setupRedisContainer()
    // Construct repository directly, bypassing NestJS DI
    // The constructor expects a Redis instance via @InjectRedis()
    repo = new (SessionRedisRepository as new (...args: unknown[]) => SessionRedisRepository)(ctx.redisClient)
  })

  afterAll(async () => {
    await teardownRedisContainer(ctx)
  })

  beforeEach(async () => {
    await ctx.redisClient.flushall()
  })

  describe('save + get', () => {
    it('should save a session and retrieve it', async () => {
      await repo.save(1, 'token-abc', 'sig-xyz', 3600)

      const result = await repo.get(1, 'token-abc')
      expect(result).toBe('sig-xyz')
    })

    it('should return null for non-existent session', async () => {
      const result = await repo.get(1, 'non-existent')
      expect(result).toBeNull()
    })

    it('should overwrite existing session with same key', async () => {
      await repo.save(1, 'token-abc', 'sig-old', 3600)
      await repo.save(1, 'token-abc', 'sig-new', 3600)

      const result = await repo.get(1, 'token-abc')
      expect(result).toBe('sig-new')
    })
  })

  describe('TTL expiration', () => {
    it('should expire after TTL', async () => {
      await repo.save(1, 'token-exp', 'sig-exp', 1) // 1 second TTL

      // Verify it exists immediately
      const before = await repo.get(1, 'token-exp')
      expect(before).toBe('sig-exp')

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const after = await repo.get(1, 'token-exp')
      expect(after).toBeNull()
    })
  })

  describe('removeAllForUser', () => {
    it('should remove all sessions for a specific user', async () => {
      await repo.save(1, 'token-a', 'sig-a', 3600)
      await repo.save(1, 'token-b', 'sig-b', 3600)
      await repo.save(2, 'token-c', 'sig-c', 3600)

      await repo.removeAllForUser(1)

      expect(await repo.get(1, 'token-a')).toBeNull()
      expect(await repo.get(1, 'token-b')).toBeNull()
      // User 2's session should remain
      expect(await repo.get(2, 'token-c')).toBe('sig-c')
    })

    it('should handle removal when no sessions exist', async () => {
      // Should not throw
      await expect(repo.removeAllForUser(999)).resolves.toBeUndefined()
    })
  })
})
