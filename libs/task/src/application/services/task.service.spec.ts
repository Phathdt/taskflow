/* eslint-disable @typescript-eslint/no-require-imports */
import { ForbiddenException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { TaskService } from './task.service'

import { type ITaskRepository } from '../../domain'
import { TASK_REPOSITORY } from '../../infras/di'

// Mock @taskflow/user to avoid ESM uuid chain (user.module → database → custom-logger → uuid)
// Use Symbol.for so it's globally shared between the mock and NestJS DI container
jest.mock('@taskflow/user', () => ({
  USER_SERVICE: Symbol.for('__test_USER_SERVICE__'),
  Role: { ADMIN: 'admin', WORKER: 'worker' },
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { USER_SERVICE } = require('@taskflow/user')

describe('TaskService', () => {
  let service: TaskService
  let taskRepo: jest.Mocked<ITaskRepository>
  let userService: { findById: jest.Mock }

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: null,
    status: 'pending' as const,
    priority: 'medium' as const,
    dueDate: null,
    createdById: 1,
    assigneeId: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const mockTaskRepo: jest.Mocked<ITaskRepository> = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllByAssignee: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assign: jest.fn(),
    }

    const mockUserService = { findById: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: TASK_REPOSITORY, useValue: mockTaskRepo },
        { provide: USER_SERVICE, useValue: mockUserService },
      ],
    }).compile()

    service = module.get<TaskService>(TaskService)
    taskRepo = module.get(TASK_REPOSITORY)
    userService = module.get(USER_SERVICE)
  })

  describe('create', () => {
    it('should create a task', async () => {
      taskRepo.create.mockResolvedValue(mockTask)
      const result = await service.create({
        title: 'Test Task',
        priority: 'medium',
        createdById: 1,
      })
      expect(result).toEqual(mockTask)
    })

    it('should validate assignee exists', async () => {
      userService.findById.mockResolvedValue({ id: 2 })
      taskRepo.create.mockResolvedValue(mockTask)
      await service.create({
        title: 'Test',
        priority: 'medium',
        createdById: 1,
        assigneeId: 2,
      })
      expect(userService.findById).toHaveBeenCalledWith(2)
    })
  })

  describe('findById', () => {
    it('should return task for admin', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      const result = await service.findById(1, 99, 'admin')
      expect(result).toEqual(mockTask)
    })

    it('should return task for assigned worker', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      const result = await service.findById(1, 2, 'worker')
      expect(result).toEqual(mockTask)
    })

    it('should throw for unassigned worker', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      await expect(service.findById(1, 99, 'worker')).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findAll', () => {
    it('should return all tasks for admin', async () => {
      const paginated = {
        data: [mockTask],
        paging: { total: 1, page: 1, limit: 20, pages: 1 },
      }
      taskRepo.findAll.mockResolvedValue(paginated)
      const result = await service.findAll(1, 'admin', { page: 1, limit: 20 })
      expect(taskRepo.findAll).toHaveBeenCalled()
      expect(result).toEqual(paginated)
    })

    it('should return only assigned tasks for worker', async () => {
      const paginated = {
        data: [mockTask],
        paging: { total: 1, page: 1, limit: 20, pages: 1 },
      }
      taskRepo.findAllByAssignee.mockResolvedValue(paginated)
      const result = await service.findAll(2, 'worker', { page: 1, limit: 20 })
      expect(taskRepo.findAllByAssignee).toHaveBeenCalledWith(2, { page: 1, limit: 20 })
      expect(result).toEqual(paginated)
    })
  })

  describe('update', () => {
    it('should allow admin to update any field', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      taskRepo.update.mockResolvedValue({ ...mockTask, title: 'Updated' })
      const result = await service.update(1, { title: 'Updated' }, 1, 'admin')
      expect(result.title).toBe('Updated')
    })

    it('should restrict worker to status-only update', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      taskRepo.update.mockResolvedValue({ ...mockTask, status: 'in_progress' })
      await service.update(1, { title: 'Ignored', status: 'in_progress' }, 2, 'worker')
      expect(taskRepo.update).toHaveBeenCalledWith(1, { status: 'in_progress' })
    })

    it('should throw for unassigned worker', async () => {
      taskRepo.findById.mockResolvedValue(mockTask)
      await expect(service.update(1, { status: 'in_progress' }, 99, 'worker')).rejects.toThrow(ForbiddenException)
    })
  })

  describe('assign', () => {
    it('should validate assignee and assign', async () => {
      userService.findById.mockResolvedValue({ id: 3 })
      taskRepo.assign.mockResolvedValue({ ...mockTask, assigneeId: 3 })
      const result = await service.assign(1, 3)
      expect(userService.findById).toHaveBeenCalledWith(3)
      expect(result.assigneeId).toBe(3)
    })
  })

  describe('delete', () => {
    it('should delegate to repository', async () => {
      taskRepo.delete.mockResolvedValue(undefined)
      await service.delete(1)
      expect(taskRepo.delete).toHaveBeenCalledWith(1)
    })
  })
})
