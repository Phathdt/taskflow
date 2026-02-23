import { NotFoundException } from '@nestjs/common'

import { UserService } from './user.service'
import { type IUserRepository, type User, type UserWithPassword } from '../../domain'

describe('UserService', () => {
  let service: UserService
  let mockRepo: jest.Mocked<IUserRepository>

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'worker',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  const mockUserWithPassword: UserWithPassword = {
    ...mockUser,
    password: 'hashed_password',
  }

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    }

    service = new UserService(mockRepo)
  })

  describe('findByEmail', () => {
    it('should return user with password when found', async () => {
      mockRepo.findByEmail.mockResolvedValue(mockUserWithPassword)

      const result = await service.findByEmail('test@example.com')

      expect(result).toEqual(mockUserWithPassword)
      expect(mockRepo.findByEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should propagate NotFoundException when user not found', async () => {
      mockRepo.findByEmail.mockRejectedValue(new NotFoundException('User not found'))

      await expect(service.findByEmail('missing@example.com')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      mockRepo.findById.mockResolvedValue(mockUser)

      const result = await service.findById(1)

      expect(result).toEqual(mockUser)
      expect(mockRepo.findById).toHaveBeenCalledWith(1)
    })

    it('should propagate NotFoundException when user not found', async () => {
      mockRepo.findById.mockRejectedValue(new NotFoundException('User not found'))

      await expect(service.findById(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('should create and return user', async () => {
      const input = { email: 'new@example.com', password: 'hashed', name: 'New User', role: 'worker' }
      mockRepo.create.mockResolvedValue({ ...mockUser, email: input.email, name: input.name })

      const result = await service.create(input)

      expect(result.email).toBe(input.email)
      expect(result.name).toBe(input.name)
      expect(mockRepo.create).toHaveBeenCalledWith(input)
    })
  })
})
