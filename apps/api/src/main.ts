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
  app.enableCors({ origin: process.env.WEB_ORIGIN || 'http://localhost:3000', credentials: true });

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
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger em http://localhost:${port}/docs`);
  }
}

bootstrap().catch(console.error);
