import { PaginationResponseSchema } from '@taskflow/share'

import { z } from 'zod'

import { PrioritySchema, TaskStatusSchema } from '../../domain'

// Swagger-safe task schema (z.string for dates since z.date can't serialize to JSON Schema)
export const TaskResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  dueDate: z.string().nullable(),
  createdById: z.number(),
  assigneeId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const TaskListResponseSchema = z.object({
  data: z.array(TaskResponseSchema),
  paging: PaginationResponseSchema,
})

export const TaskDeleteResponseSchema = z.object({
  message: z.string(),
})
