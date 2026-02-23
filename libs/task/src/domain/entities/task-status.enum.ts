import { z } from 'zod'

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const
export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus]
export const TaskStatusSchema = z.enum([
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
])
