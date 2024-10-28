import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/users.entity';

// Access Token에 대한 인증 처리
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      // JWT를 요청 헤더에서 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 만료된 JWT는 허용하지 않음
      ignoreExpiration: false,

      // 파일 경로 대신 환경 변수에서 public key를 가져옴
      secretOrKey: configService.get<string>('public_key').replace(/\\n/g, '\n'),
      // RSA256 알고리즘을 사용하여 JWT 검증
      algorithms: ['RS256'],
    });
  }

  // 검증된 JWT payload를 처리
  async validate(payload: any): Promise<User> {
    const user = await this.usersService.findeOne(payload.username);
    if (!user) {
      throw new UnauthorizedException('잘못된 토큰');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('토큰 무효화');
    }

    return user;
  }
}
