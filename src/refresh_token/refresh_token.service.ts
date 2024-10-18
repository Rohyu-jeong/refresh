import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh_token.entity';
import { LessThan, Repository } from 'typeorm';
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

  // Refresh Token 제거 (로그아웃)
  async removeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token });
  }

  // 특정 사용자에 대한 모든 Refresh Token 제거(전체 로그아웃)
  async removeAllRefreshToken (id: number): Promise<void> {
    await this.refreshTokenRepository.delete({ user: {id} });
  }

  // 만료된 Refresh Token 제거
  async removeExpiredRefreshTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepository.delete({ expiresAt: LessThan(now) })
  }
}
