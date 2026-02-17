import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Adaptive Learning Platform API')
    .setDescription(
      'Hyper-personalized adaptive learning platform with BKT, RAG, ' +
        'gamification, and neuroscience-based session management.',
    )
    .setVersion('1.0')
    .addTag('session', 'Session management with visual Pomodoro timer')
    .addTag('content', 'AI-powered content generation with RAG pipeline')
    .addTag('progress', 'Progress submission with BKT & gamification')
    .addTag('video', 'Khan Academy video verification system')
    .addTag('users', 'User profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Adaptive Learning API running on port ${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
