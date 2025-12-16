import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Dùng khi người dùng click vào link reset trong email
 * và nhập mật khẩu mới
 */
export class ResetPasswordDto {
  // Token này lấy từ URL (query params hoặc body) để xác thực phiên reset
  @IsNotEmpty({ message: 'Reset token là bắt buộc' })
  @IsString()
  resetToken: string;

  // Mật khẩu mới mà người dùng muốn đặt lại
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(6)
  // Áp dụng cùng quy tắc mật khẩu mạnh
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số',
  })
  newPassword: string;
}
