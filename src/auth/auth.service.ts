import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from 'src/refresh_token/refresh_token.service';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshResponseDTO } from 'src/refresh_token/dto/refresh_response.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private refreshTokenService: RefreshTokenService,
    private jwtService: JwtService,
  ) {}

  // 로그인 : Access Token과 Refresh Token 발급
  async singIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findeOne(username);

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('다시');
    }

    // Access Token에 들어갈 유저 정보
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    // Refresh Token 만료 시간 설정
    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.saveRefreshToken(
      user,
      refreshToken,
      expiresAt,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  // Refresh Token 생성 메서드
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  // Refresh Token을 사용하여 새로운 Access Token 발급(재발급)
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<RefreshResponseDTO> {
    const storedRefreshToken =
      await this.refreshTokenService.findeByToken(refreshToken);
    if (!storedRefreshToken) {
      throw new UnauthorizedException('리프레시 없음');
    }

    const now = new Date();
    if (storedRefreshToken.expiresAt < now) {
      // Refresh Token 만료 시, 제거 후 예외 발생
      await this.refreshTokenService.removeRefreshToken(refreshToken);
      throw new UnauthorizedException('Refresh Token 기한 만료');
    }

    const user = storedRefreshToken.user;

    // 기존 Refresh Token 제거
    await this.refreshTokenService.removeRefreshToken(refreshToken);

    // 새로운 Refresh Token 제거
    const newRefreshToken = this.generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 새로운 Refresh Token 저장
    await this.refreshTokenService.saveRefreshToken(
      user,
      newRefreshToken,
      newExpiresAt,
    );

    // 새로운 Access Token 생성
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    return { access_token: accessToken, refresh_token: newRefreshToken };
  }

  // 로그아웃 시 Refresh Token 제거
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.removeRefreshToken(refreshToken);
  }

  // 전체 로그인
  async logoutAll (id: number): Promise<void> {
    await this.refreshTokenService.removeAllRefreshToken(id);
  }

  // 회원가입
  async register(username: string, password: string, role: string = 'user') {
    return this.usersService.createUser(username, password, role);
  }
}
