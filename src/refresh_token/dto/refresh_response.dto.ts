import { ApiProperty } from "@nestjs/swagger";

export class RefreshResponseDTO {
    @ApiProperty({
        description: 'New Access Token'
    })
    readonly access_token: string;

    @ApiProperty({
        description: 'new Refresh Token'
    })
    readonly refresh_token: string;
}