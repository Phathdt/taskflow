import { NotFoundException } from '@nestjs/common'
import { type DatabaseService } from '@taskflow/database'
import {
  setupPostgresContainer,
  teardownPostgresContainer,
  truncateAllTables,
  type PrismaTestContext,
} from '@taskflow/database/__tests__/prisma-test-helper'

import { UserPrismaRepository } from './user-prisma.repository'

jest.setTimeout(60_000)

describe('UserPrismaRepository (integration)', () => {
  let ctx: PrismaTestContext
  let repo: UserPrismaRepository

  beforeAll(async () => {
    ctx = await setupPostgresContainer()
    // PrismaClient implements the same interface as DatabaseService for data access
    repo = new UserPrismaRepository(ctx.prismaClient as unknown as DatabaseService)
  })

  afterAll(async () => {
    await teardownPostgresContainer(ctx)
  })

  beforeEach(async () => {
    await truncateAllTables(ctx)
  })

  describe('create', () => {
    it('should create a user and return it without password', async () => {
      const user = await repo.create({
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        role: 'worker',
      })

      expect(user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'worker',
      })
      expect(user.id).toBeGreaterThan(0)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
      expect((user as Record<string, unknown>)['password']).toBeUndefined()
    })

    it('should throw on duplicate email', async () => {
      await repo.create({
        email: 'dup@example.com',
        password: 'pass1',
        name: 'User 1',
        role: 'worker',
      })

      await expect(
        repo.create({
          email: 'dup@example.com',
          password: 'pass2',
          name: 'User 2',
          role: 'worker',
        })
      ).rejects.toThrow()
    })
  })

  describe('findByEmail', () => {
    it('should find a user by email and include password', async () => {
      await repo.create({
        email: 'find@example.com',
        password: 'secret',
        name: 'Find Me',
        role: 'admin',
      })

      const found = await repo.findByEmail('find@example.com')
      expect(found.email).toBe('find@example.com')
      expect(found.password).toBe('secret')
      expect(found.role).toBe('admin')
    })

    it('should throw NotFoundException for non-existent email', async () => {
      await expect(repo.findByEmail('missing@example.com')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('should find a user by id', async () => {
      const created = await repo.create({
        email: 'byid@example.com',
        password: 'pass',
        name: 'By ID',
        role: 'worker',
      })

      const found = await repo.findById(created.id)
      expect(found.id).toBe(created.id)
      expect(found.email).toBe('byid@example.com')
    })

    it('should throw NotFoundException for non-existent id', async () => {
      await expect(repo.findById(99999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Seed 5 users
      for (let i = 1; i <= 5; i++) {
        await repo.create({
          email: `user${i}@example.com`,
          password: 'pass',
          name: `User ${i}`,
          role: 'worker',
        })
      }

      const result = await repo.findAll({ page: 1, limit: 3 })
      expect(result.data).toHaveLength(3)
      expect(result.paging.total).toBe(5)
      expect(result.paging.page).toBe(1)
      expect(result.paging.limit).toBe(3)
    })

    it('should return second page correctly', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create({
          email: `page${i}@example.com`,
          password: 'pass',
          name: `Page ${i}`,
          role: 'worker',
        })
      }

      const result = await repo.findAll({ page: 2, limit: 3 })
      expect(result.data).toHaveLength(2)
      expect(result.paging.page).toBe(2)
    })

    it('should return empty data when no users exist', async () => {
      const result = await repo.findAll({ page: 1, limit: 10 })
      expect(result.data).toHaveLength(0)
      expect(result.paging.total).toBe(0)
    })
  })

  describe('updateRole', () => {
    it('should update user role', async () => {
      const created = await repo.create({
        email: 'role@example.com',
        password: 'pass',
        name: 'Role User',
        role: 'worker',
      })

      const updated = await repo.updateRole(created.id, 'admin')
      expect(updated.role).toBe('admin')
      expect(updated.id).toBe(created.id)
    })

    it('should throw NotFoundException when updating non-existent user', async () => {
      await expect(repo.updateRole(99999, 'admin')).rejects.toThrow(NotFoundException)
    })
  })
})
