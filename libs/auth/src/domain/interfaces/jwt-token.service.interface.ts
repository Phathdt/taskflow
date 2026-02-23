export interface JwtPayload {
  userId: number
  email: string
  name: string
  role: string
  subToken: string
  iat: number
  exp: number
}

export interface IJwtTokenService {
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string
  verify(token: string): JwtPayload
  decode(token: string): JwtPayload | null
}
