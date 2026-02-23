import { z } from 'zod'

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const
export type PriorityType = (typeof Priority)[keyof typeof Priority]
export const PrioritySchema = z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT])
