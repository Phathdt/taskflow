import { Injectable, LoggerService } from '@nestjs/common'

import { ClsService } from 'nestjs-cls'
import { PinoLogger } from 'nestjs-pino'

@Injectable()
export class EnhancedLogger implements LoggerService {
  // ============================================
  // Instance Fields
  // ============================================

  private metadata: Record<string, unknown> = {}

  // ============================================
  // Constructor
  // ============================================

  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly cls: ClsService
  ) {}

  // ============================================
  // Private Static Methods
  // ============================================

  // Custom JSON replacer that handles BigInt serialization
  private static bigIntReplacer(_key: string, value: unknown): unknown {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }

  // ============================================
  // Public Instance Methods
  // ============================================

  with(metadata: Record<string, unknown>): EnhancedLogger {
    const childLogger = new EnhancedLogger(this.pinoLogger, this.cls)
    childLogger.metadata = { ...this.metadata, ...this.serializeMetadata(metadata) }
    return childLogger
  }

  log(message: string | object, context?: string) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.info({ ...this.getContext(), context }, msg)
  }

  error(message: string | object | Error, trace?: string, context?: string) {
    const msg =
      message instanceof Error
        ? message.message
        : typeof message === 'string'
          ? message
          : JSON.stringify(message, EnhancedLogger.bigIntReplacer)

    const errorData = {
      ...this.getContext(),
      trace,
      context,
      ...(message instanceof Error && {
        stack: message.stack,
        name: message.name,
      }),
    }

    this.pinoLogger.error(errorData, msg)
  }

  warn(message: string | object, context?: string) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.warn({ ...this.getContext(), context }, msg)
  }

  debug(message: string | object, context?: string) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.debug({ ...this.getContext(), context }, msg)
  }

  verbose(message: string | object, context?: string) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.trace({ ...this.getContext(), context }, msg)
  }

  info(message: string | object, ...args: unknown[]) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.info({ ...this.getContext() }, msg, ...args)
  }

  fatal(message: string | object, ...args: unknown[]) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.fatal({ ...this.getContext() }, msg, ...args)
  }

  trace(message: string | object, ...args: unknown[]) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message, EnhancedLogger.bigIntReplacer)
    this.pinoLogger.trace({ ...this.getContext() }, msg, ...args)
  }

  // ============================================
  // Private Instance Methods
  // ============================================

  private getContext(): Record<string, unknown> {
    const traceId = this.cls.get('traceId')

    return {
      ...(traceId && { traceId }),
      ...this.metadata,
    }
  }

  // Recursively serialize BigInt values in metadata to strings
  private serializeMetadata(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'bigint') {
        result[key] = value.toString()
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.serializeMetadata(value as Record<string, unknown>)
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'bigint'
            ? item.toString()
            : item && typeof item === 'object'
              ? this.serializeMetadata(item as Record<string, unknown>)
              : item
        )
      } else {
        result[key] = value
      }
    }
    return result
  }
}
