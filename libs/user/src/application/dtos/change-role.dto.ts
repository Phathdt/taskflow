import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

import { RoleSchema } from '../../domain'

export const ChangeRoleSchema = z.object({ role: RoleSchema })
export class ChangeRoleDto extends createZodDto(ChangeRoleSchema) {}
