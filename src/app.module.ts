import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/users.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RefreshTokenModule } from './refresh_token/refresh_token.module';
import { RefreshToken } from './refresh_token/entities/refresh_token.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 환경 변수를 전역으로 사용
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'ep-nameless-firefly-a49bi3zp-pooler.us-east-1.aws.neon.tech',
      port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
      username: process.env.DATABASE_USERNAME || 'default',
      password: process.env.DATABASE_PASSWORD || 'M2EcWsg4oplI',
      database: process.env.DATABASE_NAME || 'verceldb',
      entities: [User, RefreshToken],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // ssl 검증하지 않음
      }
    }),
    AuthModule,
    UsersModule,
    RefreshTokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
