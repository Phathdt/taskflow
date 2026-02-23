import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { PrioritySchema, TaskStatusSchema } from '../../domain'

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  dueDate: z.coerce.date().nullable().optional(),
})

export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}
