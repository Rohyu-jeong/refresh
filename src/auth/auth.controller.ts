import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { AuthDTO } from './dto/auth.dto';
import { RefreshTokenDTO } from 'src/refresh_token/dto/refresh_token.dto';
import { JwtAuthGuard } from './guards/jwt_auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from 'src/users/entities/users.entity';
import { Request } from 'express';
import { Roles } from './decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 회원가입
  @Post('register')
  @ApiBody({ type: RegisterDTO })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  async register(@Body() registerDto: RegisterDTO) {
    const { username, password, role } = registerDto;
    const user = await this.authService.register(username, password, role);
    return { message: '회원가입 성공', id: user.id };
  }

  // 로그인
  @Post('login')
  @ApiBody({ type: AuthDTO })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  async signIn(@Body() signInDto: AuthDTO) {
    return this.authService.singIn(signInDto.username, signInDto.password);
  }

  // Refresh Token을 사용하여 Access Token 갱신(재발급)
  @Post('refresh')
  @ApiBody({ type: RefreshTokenDTO })
  @ApiResponse({
    status: 201,
    description: 'Access Token과 Refresh Token 재발급',
    type: RefreshTokenDTO,
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDTO) {
    const { refresh_token } = refreshTokenDto;
    return this.authService.refreshAccessToken(refresh_token);
  }

  // 로그아웃
  @Post('logout')
  @ApiBody({ type: RefreshTokenDTO })
  @ApiResponse({ status: 201, description: '로그아웃' })
  async logout(@Body() body: RefreshTokenDTO) {
    const { refresh_token } = body;
    await this.authService.logout(refresh_token);
    return { message: '로그아웃 성공' };
  }

  // 프로필
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('Profile')
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
  })
  getProfile(@Req() req: Request) {
    const user = req.user as User;
    return { id: user.id, username: user.username, role: user.role };
  }

  // 관리자 전용
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Admin data retrieved successfully.',
  })
  getAdminData() {
    return { message: 'Admin data' };
  }

  // 일반 사용자
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user')
  @Roles('user', 'admin')
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'User data retrieved successfully.',
  })
  getUserData() {
    return { message: 'User data' };
  }
}
