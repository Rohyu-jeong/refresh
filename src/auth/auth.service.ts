import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from '../refresh_token/refresh_token.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshResponseDTO } from '../refresh_token/dto/refresh_response.dto';

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

    // 기존 세션 무효화
    await this.logoutAll(user.id);

    // 최신 tokenVersion 조회한 후 포함하여 Access Token 발급
    const updateUser = await this.usersService.findeOne(username);

    // Access Token에 들어갈 유저 정보
    const payload = {
      sub: updateUser.id,
      username: updateUser.username,
      role: updateUser.role,
      tokenVersion: updateUser.tokenVersion,
    };
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
  async refreshAccessToken(refreshToken: string): Promise<RefreshResponseDTO> {
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

    // tokenVersion 증가
    await this.usersService.incrementTokenVersion(user.id);

    // 최신 tokenVersion 조회
    const updateUser = await this.usersService.findeOne(user.username);

    // 새로운 Refresh Token 생성
    const newRefreshToken = this.generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 새로운 Refresh Token 저장
    await this.refreshTokenService.saveRefreshToken(
      updateUser,
      newRefreshToken,
      newExpiresAt,
    );

    // 새로운 Access Token 생성
    const payload = {
      sub: updateUser.id,
      username: updateUser.username,
      role: updateUser.role,
      tokenVersion: updateUser.tokenVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '5m',
    });

    return { access_token: accessToken, refresh_token: newRefreshToken };
  }

  // 로그아웃 시 Refresh Token 제거
  async logout(refreshToken: string): Promise<void> {
    const storedRefreshToken =
      await this.refreshTokenService.findeByToken(refreshToken);
    if (storedRefreshToken) {
      const user = storedRefreshToken.user;

      await this.refreshTokenService.removeRefreshToken(refreshToken);
      // tokenVersion 증가하여 기존 Access Token 무효화
      await this.usersService.incrementTokenVersion(user.id);
    }
    // 유효하지 않은 토큰이라도 성공적으로 로그아웃 처리
  }

  // 전체 로그아웃
  async logoutAll(id: number): Promise<void> {
    await this.refreshTokenService.removeAllRefreshToken(id);
    await this.usersService.incrementTokenVersion(id);
  }

  // 회원가입
  async register(username: string, password: string, role: string = 'user') {
    return this.usersService.createUser(username, password, role);
  }
}
