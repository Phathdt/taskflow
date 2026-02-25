import { type INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'

export const setUpSwagger = (app: INestApplication, baseUrl: string) => {
  const config = new DocumentBuilder()
    .setTitle('taskflow')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addServer(baseUrl)
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
    swaggerOptions: { persistAuthorization: true },
  })

  app.use(
    '/reference',
    apiReference({
      spec: { content: document },
      theme: 'kepler',
    })
  )
}
