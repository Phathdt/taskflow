import { PaginationResponseSchema } from '@taskflow/share'

import { z } from 'zod'

import { RoleSchema } from '../../domain'

// Swagger-safe user schema (z.string for dates since z.date can't serialize to JSON Schema)
export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: RoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const UserListResponseSchema = z.object({
  data: z.array(UserResponseSchema),
  paging: PaginationResponseSchema,
})
