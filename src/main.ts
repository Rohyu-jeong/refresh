import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { Handler, Context, Callback } from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';

async function bootstrap() {
  config(); // .env 파일 로드
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

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
    origin: ['http://localhost:3000', 'https://refresh-beryl.vercel.app/', 'https://refresh-5czjf3nrb-yujeongs-projects-3e4f6ac1.vercel.app/'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger 설정
  const configSwagger = new DocumentBuilder()
    .setTitle('NestJS Auth API')
    .setDescription(
      'API documentation for NestJS Authentication with Refresh Tokens',
    )
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

  await app.init();
  console.log(`Application is running on: ${await app.getUrl()}`);
  return expressApp;
}

let cachedServer: Handler;

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  if (!cachedServer) {
    const expressApp = await bootstrap();
    cachedServer = proxy(createServer(expressApp), event, context);
  }

  return cachedServer(event, context, callback);
};
