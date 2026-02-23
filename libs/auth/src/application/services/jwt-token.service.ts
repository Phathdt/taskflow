import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { type IJwtTokenService, type JwtPayload } from '../../domain'

@Injectable()
export class JwtTokenService implements IJwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload)
  }

  verify(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
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
