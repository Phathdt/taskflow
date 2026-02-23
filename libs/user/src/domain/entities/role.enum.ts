import { z } from 'zod'

export const Role = { ADMIN: 'admin', WORKER: 'worker' } as const
export type RoleType = (typeof Role)[keyof typeof Role]
export const RoleSchema = z.enum([Role.ADMIN, Role.WORKER])
