import { randomUUID } from 'crypto'

/** Generate a random token string (UUID v4 without dashes) */
export function generateToken(): string {
  return randomUUID().replace(/-/g, '')
}
