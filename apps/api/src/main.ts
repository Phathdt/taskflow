import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { CustomConfigService } from '@taskflow/custom-config'

import 'dotenv/config'

import { Logger as PinoLogger } from 'nestjs-pino'

import { AppModule } from './app'
import { BasicAuthMiddleware } from './middlewares'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  })

  // Configure SDK using CustomConfigService
  const configService = app.get(CustomConfigService)

  // Global pipes, filters, and interceptors are now registered via APP_* providers in AppModule

  app.useLogger(app.get(PinoLogger))

  app.use('/queues', new BasicAuthMiddleware().use.bind(new BasicAuthMiddleware()))

  const port = configService.host.port
  await app.listen(port, () => {
    Logger.log(`App running on http://localhost:${port}`)
  })
}

bootstrap()
