import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { convertToSnakeCase } from './utils'

@Injectable()
export class SnakeToCamelInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => convertToSnakeCase(data)))
  }
}
