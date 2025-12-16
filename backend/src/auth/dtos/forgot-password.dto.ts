import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Dùng khi người dùng quên mật khẩu và yêu cầu gửi link reset qua email
 */
export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;
}
