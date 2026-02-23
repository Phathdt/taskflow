import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'

import { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'
import { ZodError } from 'zod'

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const zodError = exception.getZodError() as ZodError
    const firstIssue = zodError.issues[0]

    if (!firstIssue) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        error: 'Bad Request',
      })
    }

    const fieldName = firstIssue.path[firstIssue.path.length - 1]?.toString() ?? 'unknown'

    return response.status(400).json({
      statusCode: 400,
      message: `${fieldName}: ${firstIssue.message}`,
      error: 'Bad Request',
    })
  }
}
