import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * Dùng cho hành động đăng nhập
 */
export class LoginDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(6)
  // Validate format mật khẩu ngay từ lúc đăng nhập để tránh spam request rác
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số',
  })
  password: string;
}
