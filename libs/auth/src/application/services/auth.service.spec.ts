import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common'

import * as bcrypt from 'bcryptjs'

import { AuthService } from './auth.service'
import { type IJwtTokenService, type ISessionStoreService } from '../../domain'

jest.mock('bcryptjs')
jest.mock('@taskflow/share', () => ({
  generateToken: jest.fn(() => 'mock-sub-token'),
}))
jest.mock('@taskflow/user', () => ({
  Role: { ADMIN: 'admin', WORKER: 'worker' },
  USER_SERVICE: Symbol('USER_SERVICE'),
}))

// Define types inline to avoid importing @taskflow/user barrel (which triggers prisma/database chain)
interface User {
  id: number
  email: string
  name: string
  role: string
  createdAt: Date
  updatedAt: Date
}

interface UserWithPassword extends User {
  password: string
}

interface IUserService {
  findByEmail(email: string): Promise<UserWithPassword>
  findById(id: number): Promise<User>
  create(data: { email: string; password: string; name: string; role: string }): Promise<User>
}

describe('AuthService', () => {
  let service: AuthService
  let mockUserService: jest.Mocked<IUserService>
  let mockJwtTokenService: jest.Mocked<IJwtTokenService>
  let mockSessionStore: jest.Mocked<ISessionStoreService>
  let mockConfigService: { auth: { bcryptRounds: number; sessionTtlSeconds: number } }

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
    password: '$2a$10$hashedpassword',
  }

  beforeEach(() => {
    mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    }

    mockJwtTokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    }

    mockSessionStore = {
      save: jest.fn(),
      get: jest.fn(),
      removeAllForUser: jest.fn(),
    }

    mockConfigService = {
      auth: { bcryptRounds: 10, sessionTtlSeconds: 3600 },
    }

    service = new AuthService(
      mockUserService as never,
      mockJwtTokenService,
      mockSessionStore,
      mockConfigService as never
    )
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserService.findByEmail.mockRejectedValue(new NotFoundException('Not found'))
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password')
      mockUserService.create.mockResolvedValue(mockUser)

      const result = await service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' })

      expect(result).toEqual(mockUser)
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(mockUserService.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        role: 'worker',
      })
    })

    it('should throw ConflictException when email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUserWithPassword)

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' })
      ).rejects.toThrow(ConflictException)
    })

    it('should rethrow unexpected errors from findByEmail', async () => {
      mockUserService.findByEmail.mockRejectedValue(new Error('DB connection failed'))

      await expect(
        service.register({ email: 'test@example.com', password: 'password123', name: 'Test User' })
      ).rejects.toThrow('DB connection failed')
    })
  })

  describe('login', () => {
    it('should login successfully and return access token', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUserWithPassword)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mockJwtTokenService.sign.mockReturnValue('header.payload.signature')
      mockSessionStore.save.mockResolvedValue(undefined)

      const result = await service.login({ email: 'test@example.com', password: 'password123' })

      expect(result.accessToken).toBe('header.payload.signature')
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      })
      expect(mockSessionStore.save).toHaveBeenCalledWith(1, 'mock-sub-token', 'signature', 3600)
    })

    it('should throw UnauthorizedException when user not found', async () => {
      mockUserService.findByEmail.mockRejectedValue(new NotFoundException('Not found'))

      await expect(service.login({ email: 'missing@example.com', password: 'password123' })).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUserWithPassword)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException
      )
    })
  })

  describe('logout', () => {
    it('should remove all sessions for user', async () => {
      mockSessionStore.removeAllForUser.mockResolvedValue(undefined)

      await service.logout(1, 'sub-token')

      expect(mockSessionStore.removeAllForUser).toHaveBeenCalledWith(1)
    })
  })

  describe('me', () => {
    it('should return user by id', async () => {
      mockUserService.findById.mockResolvedValue(mockUser)

      const result = await service.me(1)

      expect(result).toEqual(mockUser)
      expect(mockUserService.findById).toHaveBeenCalledWith(1)
    })

    it('should propagate NotFoundException when user not found', async () => {
      mockUserService.findById.mockRejectedValue(new NotFoundException('Not found'))

      await expect(service.me(999)).rejects.toThrow(NotFoundException)
    })
  })
})
