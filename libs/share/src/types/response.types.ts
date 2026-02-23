import { z } from 'zod'

export const ResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  })

export type IResponse<T> = z.infer<ReturnType<typeof ResponseSchema<z.ZodType<T>>>>
