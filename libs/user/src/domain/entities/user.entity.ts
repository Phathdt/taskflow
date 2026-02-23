import { z } from 'zod'

import { RoleSchema } from './role.enum'

export const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  role: RoleSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>

// Internal-only type that includes password (never expose to API)
export const UserWithPasswordSchema = UserSchema.extend({
  password: z.string(),
})

export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>
