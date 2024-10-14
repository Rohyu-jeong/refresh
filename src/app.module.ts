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
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 3306,
      username: process.env.DATABASE_USERNAME || 'admin',
      password: process.env.DATABASE_PASSWORD || '1234',
      database: process.env.DATABASE_NAME || 'nest_auth_db',
      entities: [User, RefreshToken],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    RefreshTokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
