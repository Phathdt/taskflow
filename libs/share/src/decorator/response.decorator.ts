import { applyDecorators, HttpStatus } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { createZodDto } from 'nestjs-zod'
import { z, type ZodTypeAny } from 'zod'

const getName = (input: string) => {
  const words = input
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  return `${words}ResponseDto`
}

const toResponseSchema = (summary: string, schema: ZodTypeAny) => {
  const className = getName(summary)
  const BaseDto = createZodDto(
    z.object({
      data: schema,
      traceId: z.string(),
    })
  )

  return {
    [className]: class extends BaseDto {},
  }[className]
}

/**
 * Composite Swagger decorator that standardizes API response documentation.
 * Wraps the provided Zod schema in { data, traceId } envelope.
 *
 * @param summary - Short description for ApiOperation
 * @param description - Response description for ApiResponse
 * @param schema - Zod schema defining the response data shape
 * @param options - Optional config (status code, whether auth is required)
 */
export function UseResponseSchema(
  summary: string,
  description: string,
  schema: ZodTypeAny,
  options?: { status?: HttpStatus; auth?: boolean }
) {
  const status = options?.status ?? HttpStatus.OK
  const requireAuth = options?.auth ?? true
  const responseType = toResponseSchema(summary, schema)

  const decorators = [
    ApiOperation({ summary }),
    ApiResponse({ status, description, type: responseType }),
    ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' }),
  ]

  if (requireAuth) {
    decorators.push(ApiBearerAuth())
  }

  return applyDecorators(...decorators)
}
