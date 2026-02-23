import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { PrioritySchema } from '../../domain/entities/priority.enum'
import { TaskStatusSchema } from '../../domain/entities/task-status.enum'

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  dueDate: z.coerce.date().nullable().optional(),
})

export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}
