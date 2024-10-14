import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh_token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  // Refresh Token 저장
  async saveRefreshToken(
    user: User,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      token,
      user,
      expiresAt,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  // Refresh Token 검증
  async findeByToken(token: string): Promise<RefreshToken | undefined> {
    return this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  // Refresh Token 제거
  async removeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token });
  }
}
