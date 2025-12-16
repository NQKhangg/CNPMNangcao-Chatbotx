import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Dùng Đăng ký tài khoản mới
 */
export class SignUpDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(6)
  // Quy tắc mật khẩu mạnh khi tạo tài khoản
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số',
  })
  password: string;
}
