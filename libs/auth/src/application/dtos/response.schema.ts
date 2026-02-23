import { RoleSchema } from '@taskflow/user'

import { z } from 'zod'

// Swagger-safe user schema (z.string for dates since z.date can't serialize to JSON Schema)
const AuthUserResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: RoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const RegisterResponseSchema = AuthUserResponseSchema

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: AuthUserResponseSchema,
})

export const LogoutResponseSchema = z.object({
  message: z.string(),
})

export const MeResponseSchema = AuthUserResponseSchema
