import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS for mobile/web clients
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Adaptive Learning Platform API')
    .setDescription(
      'End-to-end adaptive learning API with dual-track BKT engine, ' +
        'RAG-powered AI tutor, gamification, and video verification. ' +
        'Designed for hyper-personalized learning with Flow State Design.',
    )
    .setVersion('1.0.0')
    .addTag('Session', 'Neuroscience-based session management (Pomodoro)')
    .addTag('Content', 'AI content generation with RAG pipeline')
    .addTag('Progress & Gamification', 'BKT mastery + Duolingo-style gamification')
    .addTag('Video', 'Khan Academy video verification')
    .addTag('Users', 'User profile management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Adaptive Learning API running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
