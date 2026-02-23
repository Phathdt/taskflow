import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { PrioritySchema } from '../../domain'

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).nullable().optional(),
  priority: PrioritySchema.default('medium'),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
})

export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
