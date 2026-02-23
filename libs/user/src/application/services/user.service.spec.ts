import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'

import { UserService } from './user.service'

import { type IUserRepository } from '../../domain'
import { USER_REPOSITORY } from '../../infras/di'

describe('UserService', () => {
  let service: UserService
  let repo: jest.Mocked<IUserRepository>

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Test',
    role: 'worker' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const mockRepo: jest.Mocked<IUserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      updateRole: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: USER_REPOSITORY, useValue: mockRepo }],
    }).compile()

    service = module.get<UserService>(UserService)
    repo = module.get(USER_REPOSITORY)
  })

  describe('findById', () => {
    it('should return a user', async () => {
      repo.findById.mockResolvedValue(mockUser)
      const result = await service.findById(1)
      expect(result).toEqual(mockUser)
      expect(repo.findById).toHaveBeenCalledWith(1)
    })

    it('should propagate NotFoundException', async () => {
      repo.findById.mockRejectedValue(new NotFoundException())
      await expect(service.findById(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginated = {
        data: [mockUser],
        paging: { total: 1, page: 1, limit: 20, pages: 1 },
      }
      repo.findAll.mockResolvedValue(paginated)
      const result = await service.findAll({ page: 1, limit: 20 })
      expect(result).toEqual(paginated)
    })
  })

  describe('updateRole', () => {
    it('should update and return user', async () => {
      const updated = { ...mockUser, role: 'admin' as const }
      repo.updateRole.mockResolvedValue(updated)
      const result = await service.updateRole(1, 'admin')
      expect(result.role).toBe('admin')
    })
  })

  describe('create', () => {
    it('should create a user', async () => {
      repo.create.mockResolvedValue(mockUser)
      const result = await service.create({
        email: 'test@test.com',
        password: 'hashed',
        name: 'Test',
        role: 'worker',
      })
      expect(result).toEqual(mockUser)
    })
  })
})
