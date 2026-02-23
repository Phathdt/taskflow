import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  IS_PUBLIC_KEY,
  JWT_TOKEN_SERVICE,
  SESSION_STORE_SERVICE,
  type IJwtTokenService,
  type ISessionStoreService,
} from '@taskflow/auth'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(JWT_TOKEN_SERVICE) private readonly jwtTokenService: IJwtTokenService,
    @Inject(SESSION_STORE_SERVICE) private readonly sessionStore: ISessionStoreService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const token = authHeader.split(' ')[1]

    // Verify JWT signature and expiry
    const payload = this.jwtTokenService.verify(token)

    // Check Redis whitelist
    const storedSignature = await this.sessionStore.get(payload.userId, payload.subToken)
    if (!storedSignature) {
      throw new UnauthorizedException('Session expired or invalidated')
    }

    // Verify the signature matches
    const tokenSignature = token.split('.')[2]
    if (storedSignature !== tokenSignature) {
      throw new UnauthorizedException('Session expired or invalidated')
    }

    // Attach user payload to request
    request.user = payload

    return true
  }
}
