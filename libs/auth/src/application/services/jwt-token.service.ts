import { type JwtService } from '@nestjs/jwt'
import { AppUnauthorizedException } from '@taskflow/share'

import { type IJwtTokenService, type JwtPayload } from '../../domain'

// JwtService from @nestjs/jwt is passed via constructor (not injected).
// For worker usage, provide a different IJwtTokenService implementation.
export class JwtTokenService implements IJwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload)
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token)
    } catch {
      throw new AppUnauthorizedException('Invalid or expired token')
    }
  }

  decode(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token)
    } catch {
      return null
    }
  }
}
