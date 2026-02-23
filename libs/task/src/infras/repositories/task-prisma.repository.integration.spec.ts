import { NotFoundException } from '@nestjs/common'
import { type DatabaseService } from '@taskflow/database'
import {
  setupPostgresContainer,
  teardownPostgresContainer,
  truncateAllTables,
  type PrismaTestContext,
} from '@taskflow/database/__tests__/prisma-test-helper'

import { TaskPrismaRepository } from './task-prisma.repository'

jest.setTimeout(60_000)

describe('TaskPrismaRepository (integration)', () => {
  let ctx: PrismaTestContext
  let repo: TaskPrismaRepository
  let seedUserId: number

  beforeAll(async () => {
    ctx = await setupPostgresContainer()
    repo = new TaskPrismaRepository(ctx.prismaClient as unknown as DatabaseService)
  })

  afterAll(async () => {
    await teardownPostgresContainer(ctx)
  })

  beforeEach(async () => {
    await truncateAllTables(ctx)
    // Seed a user for the foreign key createdById
    const result = await ctx.pool.query(
      `INSERT INTO "users" ("email", "password", "name", "role", "created_at", "updated_at")
       VALUES ('seed@example.com', 'pass', 'Seed User', 'worker', NOW(), NOW())
       RETURNING "id"`
    )
    seedUserId = result.rows[0].id
  })

  describe('create', () => {
    it('should create a task with required fields', async () => {
      const task = await repo.create({
        title: 'Test Task',
        priority: 'medium',
        createdById: seedUserId,
      })

      expect(task).toMatchObject({
        title: 'Test Task',
        priority: 'medium',
        status: 'pending',
        createdById: seedUserId,
        description: null,
        assigneeId: null,
        dueDate: null,
      })
      expect(task.id).toBeGreaterThan(0)
      expect(task.createdAt).toBeInstanceOf(Date)
    })

    it('should create a task with all optional fields', async () => {
      const dueDate = new Date('2026-12-31T00:00:00Z')
      const task = await repo.create({
        title: 'Full Task',
        description: 'A detailed description',
        priority: 'high',
        dueDate,
        createdById: seedUserId,
        assigneeId: seedUserId,
      })

      expect(task.description).toBe('A detailed description')
      expect(task.priority).toBe('high')
      expect(task.dueDate).toEqual(dueDate)
      expect(task.assigneeId).toBe(seedUserId)
    })
  })

  describe('findById', () => {
    it('should find a task by id', async () => {
      const created = await repo.create({
        title: 'Find Me',
        priority: 'low',
        createdById: seedUserId,
      })

      const found = await repo.findById(created.id)
      expect(found.id).toBe(created.id)
      expect(found.title).toBe('Find Me')
    })

    it('should throw NotFoundException for non-existent id', async () => {
      await expect(repo.findById(99999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create({
          title: `Task ${i}`,
          priority: 'medium',
          createdById: seedUserId,
        })
      }

      const result = await repo.findAll({ page: 1, limit: 3 })
      expect(result.data).toHaveLength(3)
      expect(result.paging.total).toBe(5)
    })

    it('should filter by status', async () => {
      await repo.create({ title: 'Pending', priority: 'medium', createdById: seedUserId })
      const inProgress = await repo.create({ title: 'In Progress', priority: 'medium', createdById: seedUserId })
      await repo.update(inProgress.id, { status: 'in_progress' })

      const result = await repo.findAll({ page: 1, limit: 10, status: 'in_progress' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('In Progress')
    })

    it('should filter by priority', async () => {
      await repo.create({ title: 'Low', priority: 'low', createdById: seedUserId })
      await repo.create({ title: 'High', priority: 'high', createdById: seedUserId })

      const result = await repo.findAll({ page: 1, limit: 10, priority: 'high' })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('High')
    })

    it('should filter by assigneeId', async () => {
      await repo.create({ title: 'Unassigned', priority: 'medium', createdById: seedUserId })
      await repo.create({ title: 'Assigned', priority: 'medium', createdById: seedUserId, assigneeId: seedUserId })

      const result = await repo.findAll({ page: 1, limit: 10, assigneeId: seedUserId })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Assigned')
    })
  })

  describe('findAllByAssignee', () => {
    it('should return only tasks assigned to the given user', async () => {
      await repo.create({ title: 'Unassigned', priority: 'medium', createdById: seedUserId })
      await repo.create({ title: 'Assigned 1', priority: 'medium', createdById: seedUserId, assigneeId: seedUserId })
      await repo.create({ title: 'Assigned 2', priority: 'low', createdById: seedUserId, assigneeId: seedUserId })

      const result = await repo.findAllByAssignee(seedUserId, { page: 1, limit: 10 })
      expect(result.data).toHaveLength(2)
      expect(result.paging.total).toBe(2)
    })
  })

  describe('update', () => {
    it('should update task fields', async () => {
      const created = await repo.create({
        title: 'Original',
        priority: 'low',
        createdById: seedUserId,
      })

      const updated = await repo.update(created.id, {
        title: 'Updated Title',
        status: 'in_progress',
        priority: 'urgent',
        description: 'Now has description',
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.status).toBe('in_progress')
      expect(updated.priority).toBe('urgent')
      expect(updated.description).toBe('Now has description')
    })

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(repo.update(99999, { title: 'Nope' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('should delete a task', async () => {
      const created = await repo.create({
        title: 'To Delete',
        priority: 'medium',
        createdById: seedUserId,
      })

      await repo.delete(created.id)
      await expect(repo.findById(created.id)).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(repo.delete(99999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('assign', () => {
    it('should assign a user to a task', async () => {
      const created = await repo.create({
        title: 'To Assign',
        priority: 'medium',
        createdById: seedUserId,
      })

      const assigned = await repo.assign(created.id, seedUserId)
      expect(assigned.assigneeId).toBe(seedUserId)
    })

    it('should throw NotFoundException for non-existent task', async () => {
      await expect(repo.assign(99999, seedUserId)).rejects.toThrow(NotFoundException)
    })
  })
})
