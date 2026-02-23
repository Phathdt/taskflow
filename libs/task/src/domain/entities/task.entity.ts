import { z } from 'zod'

import { PrioritySchema } from './priority.enum'
import { TaskStatusSchema } from './task-status.enum'

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: PrioritySchema,
  dueDate: z.date().nullable(),
  createdById: z.number().int().positive(),
  assigneeId: z.number().int().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Task = z.infer<typeof TaskSchema>
