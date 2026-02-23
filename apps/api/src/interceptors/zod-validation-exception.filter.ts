import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'

import { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'
import { v7 as uuidv7 } from 'uuid'
import { ZodError } from 'zod'

interface TraceableRequest {
  traceId?: string
}

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<TraceableRequest>()
    const traceId = request.traceId || uuidv7()

    const zodError = exception.getZodError() as ZodError
    const firstIssue = zodError.issues[0]

    if (!firstIssue) {
      return response.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed' },
        traceId,
      })
    }

    const fieldName = firstIssue.path[firstIssue.path.length - 1]?.toString() ?? 'unknown'

    return response.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `${fieldName}: ${firstIssue.message}` },
      traceId,
    })
  }
}
