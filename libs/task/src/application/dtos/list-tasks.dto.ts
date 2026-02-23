import { pagingDTOSchema } from '@taskflow/share'

import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { PrioritySchema, TaskStatusSchema } from '../../domain'

export const ListTasksSchema = pagingDTOSchema.extend({
  status: TaskStatusSchema.optional(),
  priority: PrioritySchema.optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
})

export class ListTasksDto extends createZodDto(ListTasksSchema) {}
