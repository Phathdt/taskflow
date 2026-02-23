import { UnauthorizedException } from '@nestjs/common'
import { type JwtService } from '@nestjs/jwt'

import { JwtTokenService } from './jwt-token.service'

import { type JwtPayload } from '../../domain'

describe('JwtTokenService', () => {
  let service: JwtTokenService
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify' | 'decode'>>

  const mockPayload: JwtPayload = {
    userId: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'worker',
    subToken: 'sub-token-123',
    iat: 1700000000,
    exp: 1700003600,
  }

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    }

    service = new JwtTokenService(mockJwtService as unknown as JwtService)
  })

  describe('sign', () => {
    it('should sign a payload and return token string', () => {
      mockJwtService.sign.mockReturnValue('signed.jwt.token')
      const { iat, exp, ...input } = mockPayload

      const result = service.sign(input)

      expect(result).toBe('signed.jwt.token')
      expect(mockJwtService.sign).toHaveBeenCalledWith(input)
    })
  })

  describe('verify', () => {
    it('should return decoded payload for valid token', () => {
      mockJwtService.verify.mockReturnValue(mockPayload)

      const result = service.verify('valid.jwt.token')

      expect(result).toEqual(mockPayload)
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.jwt.token')
    })

    it('should throw UnauthorizedException for invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired')
      })

      expect(() => service.verify('expired.jwt.token')).toThrow(UnauthorizedException)
    })
  })

  describe('decode', () => {
    it('should return decoded payload without verification', () => {
      mockJwtService.decode.mockReturnValue(mockPayload)

      const result = service.decode('any.jwt.token')

      expect(result).toEqual(mockPayload)
      expect(mockJwtService.decode).toHaveBeenCalledWith('any.jwt.token')
    })

    it('should return null when decode fails', () => {
      mockJwtService.decode.mockImplementation(() => {
        throw new Error('malformed token')
      })

      const result = service.decode('bad-token')

      expect(result).toBeNull()
    })
  })
})
