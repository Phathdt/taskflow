import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'

import { Response } from 'express'
import { v7 as uuidv7 } from 'uuid'

interface TraceableRequest {
  traceId?: string
}

const httpStatusToCode: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
}

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<TraceableRequest>()
    const traceId = request.traceId || uuidv7()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code = 'INTERNAL_SERVER_ERROR'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = httpStatusToCode[status] || 'UNKNOWN_ERROR'
      const body = exception.getResponse() as string | { message?: string | string[] }

      if (typeof body === 'string') {
        message = body
      } else if (body && typeof body.message === 'string') {
        message = body.message
      } else if (body && Array.isArray(body.message)) {
        message = body.message.join(', ')
      } else {
        message = exception.message
      }
    } else if (this._isPrismaNotFound(exception)) {
      status = HttpStatus.NOT_FOUND
      code = 'NOT_FOUND'
      message = 'Resource not found'
    } else if (this._isPrismaUniqueConstraint(exception)) {
      status = HttpStatus.CONFLICT
      code = 'CONFLICT'
      message = 'Resource already exists'
    } else if (exception instanceof Error) {
      message = exception.message
    }

    response.status(status).header('X-Trace-Id', traceId).json({
      error: { code, message },
      traceId,
    })
  }

  private _isPrismaNotFound(err: unknown): boolean {
    return (err as { code?: string })?.code === 'P2025'
  }

  private _isPrismaUniqueConstraint(err: unknown): boolean {
    return (err as { code?: string })?.code === 'P2002'
  }
}
