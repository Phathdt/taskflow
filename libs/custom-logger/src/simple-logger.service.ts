import pino, { type Logger } from 'pino'

// Framework-agnostic logger for use outside NestJS (e.g. Temporal Worker)
// Uses pino directly without nestjs-pino or ClsService
export class SimpleLogger {
  private readonly logger: Logger
  private metadata: Record<string, unknown> = {}

  constructor(options?: { level?: string; context?: string; enableJsonFormat?: boolean }) {
    const level = options?.level || 'info'
    const context = options?.context

    this.logger = pino({
      level,
      transport: options?.enableJsonFormat
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: true, colorize: true },
          },
    })

    if (context) {
      this.metadata = { context }
    }
  }

  with(metadata: Record<string, unknown>): SimpleLogger {
    const child = new SimpleLogger()
    // Share the same pino instance
    Object.defineProperty(child, 'logger', { value: this.logger })
    child.metadata = { ...this.metadata, ...metadata }
    return child
  }

  log(message: string): void {
    this.logger.info(this.metadata, message)
  }

  info(message: string): void {
    this.logger.info(this.metadata, message)
  }

  error(message: string | Error): void {
    if (message instanceof Error) {
      this.logger.error({ ...this.metadata, err: message }, message.message)
    } else {
      this.logger.error(this.metadata, message)
    }
  }

  warn(message: string): void {
    this.logger.warn(this.metadata, message)
  }

  debug(message: string): void {
    this.logger.debug(this.metadata, message)
  }
}
