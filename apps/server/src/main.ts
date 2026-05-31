import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origin = config.get<string>('CLIENT_ORIGIN') ?? 'http://localhost:5173'

  app.setGlobalPrefix('api')
  app.enableCors({ origin, credentials: true })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
  app.useGlobalFilters(new HttpExceptionFilter())

  const port = config.get<number>('PORT') ?? 3000
  const host = config.get<string>('HOST') ?? '127.0.0.1'
  await app.listen(port, host)
}

void bootstrap()
