import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Dùng để lấy Access Token mới khi Access Token cũ hết hạn
 */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token là bắt buộc' })
  @IsString()
  refreshToken: string;
}
