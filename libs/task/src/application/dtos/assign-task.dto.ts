import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const AssignTaskSchema = z.object({
  assigneeId: z.number().int().positive(),
})

export class AssignTaskDto extends createZodDto(AssignTaskSchema) {}
