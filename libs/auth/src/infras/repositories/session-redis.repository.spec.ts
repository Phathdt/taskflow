import { SessionRedisRepository } from './session-redis.repository'

describe('SessionRedisRepository', () => {
  let repo: SessionRedisRepository
  let mockRedis: {
    set: jest.Mock
    get: jest.Mock
    keys: jest.Mock
    del: jest.Mock
  }

  beforeEach(() => {
    mockRedis = {
      set: jest.fn(),
      get: jest.fn(),
      keys: jest.fn(),
      del: jest.fn(),
    }

    repo = new SessionRedisRepository(mockRedis as never)
  })

  describe('save', () => {
    it('should store signature with TTL in Redis', async () => {
      mockRedis.set.mockResolvedValue('OK')

      await repo.save(1, 'sub-token-abc', 'jwt-signature', 3600)

      expect(mockRedis.set).toHaveBeenCalledWith('/users/1/session/sub-token-abc', 'jwt-signature', 'EX', 3600)
    })
  })

  describe('get', () => {
    it('should return signature when session exists', async () => {
      mockRedis.get.mockResolvedValue('jwt-signature')

      const result = await repo.get(1, 'sub-token-abc')

      expect(result).toBe('jwt-signature')
      expect(mockRedis.get).toHaveBeenCalledWith('/users/1/session/sub-token-abc')
    })

    it('should return null when session does not exist', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await repo.get(1, 'nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('removeAllForUser', () => {
    it('should delete all session keys for user', async () => {
      mockRedis.keys.mockResolvedValue(['/users/1/session/abc', '/users/1/session/def'])
      mockRedis.del.mockResolvedValue(2)

      await repo.removeAllForUser(1)

      expect(mockRedis.keys).toHaveBeenCalledWith('/users/1/session/*')
      expect(mockRedis.del).toHaveBeenCalledWith('/users/1/session/abc', '/users/1/session/def')
    })

    it('should not call del when no keys found', async () => {
      mockRedis.keys.mockResolvedValue([])

      await repo.removeAllForUser(1)

      expect(mockRedis.keys).toHaveBeenCalledWith('/users/1/session/*')
      expect(mockRedis.del).not.toHaveBeenCalled()
    })
  })
})
