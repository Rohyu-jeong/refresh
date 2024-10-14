import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDTO {
  @ApiProperty({ description: 'refresh token' })
  @IsString()
  @IsNotEmpty()
  readonly refresh_token: string;
}
