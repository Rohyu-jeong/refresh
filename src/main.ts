import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';

async function bootstrap() {
  config(); // .env 파일 로드
  const app = await NestFactory.create(AppModule);

  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 포함된 경우 에러 발생
      transform: true, // 자동 변환
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'https://refresh-beryl.vercel.app/'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger 설정
  const configSwagger = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription('API documentation for NestJS Authentication with Refresh Tokens')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token **_only_**',
      },
      'access-token',
    )
    .addTag('auth')
    .build();

  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
