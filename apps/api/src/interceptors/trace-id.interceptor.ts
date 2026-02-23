import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common'

import { Request, Response } from 'express'
import { ClsService } from 'nestjs-cls'
import { Observable, throwError } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { v7 as uuidv7 } from 'uuid'

interface TraceableRequest extends Request {
  traceId?: string
}

interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
  [key: string]: unknown
}

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TraceableRequest>()
    // Use traceId from CLS middleware (already generated) to ensure consistency with logs
    // Fallback to uuidv7() to ensure trace ID is always present
    const traceId = this.cls.getId() || request.traceId || uuidv7()
    request.traceId = traceId

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>()
        response.setHeader('X-Trace-Id', traceId)
      }),
      catchError((error: unknown) => {
        const response = context.switchToHttp().getResponse<Response>()
        response.setHeader('X-Trace-Id', traceId)

        if (error instanceof HttpException) {
          const statusCode = error.getStatus()
          const errorResponse = error.getResponse() as string | ErrorResponse

          const modifiedError: ErrorResponse = {
            statusCode,
            message: typeof errorResponse === 'string' ? errorResponse : errorResponse.message,
            error: typeof errorResponse === 'string' ? error.name : errorResponse.error || error.name,
            traceId: traceId,
          }

          if (typeof errorResponse === 'object') {
            Object.assign(modifiedError, errorResponse)
          }

          error.getResponse = () => modifiedError
        } else if (error instanceof Error) {
          ;(error as Error & { traceId: string }).traceId = traceId
        }

        return throwError(() => error)
      })
    )
  }
}
