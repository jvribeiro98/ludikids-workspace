import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(app.get(JwtAuthGuard));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const isProduction = process.env.NODE_ENV === 'production';
  let corsOrigin: string | string[] | true = true;
  if (process.env.WEB_ORIGIN) {
    corsOrigin = process.env.WEB_ORIGIN.split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    if (isProduction && corsOrigin.length === 0) corsOrigin = true;
  }
  if (isProduction && (corsOrigin === true || (Array.isArray(corsOrigin) && corsOrigin.length === 0))) {
    corsOrigin = [];
  }
  const originCallback =
    Array.isArray(corsOrigin) && corsOrigin.length > 0
      ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
          if (!origin) return cb(null, false);
          const normalized = origin.replace(/\/+$/, '');
          const allow = corsOrigin.includes(normalized);
          cb(null, allow);
        }
      : undefined;
  app.enableCors({
    origin: originCallback ?? corsOrigin,
    credentials: true,
  });
  if (!isProduction) {
    console.log('CORS origens:', typeof corsOrigin === 'boolean' ? 'qualquer' : corsOrigin);
  }

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LudiKids API')
      .setDescription('API do sistema de gestão de creche LudiKids')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`API rodando em http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger em http://localhost:${port}/docs`);
  }
}

bootstrap().catch(console.error);
