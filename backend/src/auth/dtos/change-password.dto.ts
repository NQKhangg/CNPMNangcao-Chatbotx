import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * Dùng khi người dùng đã đăng nhập và muốn đổi mật khẩu
 */
export class ChangePasswordDto {
  // Mật khẩu cũ cần phải gửi lên để server xác thực xem có đúng không
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  // Mật khẩu mới
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  /**
   * --- REGEX MẬT KHẨU ---
   * ^              : Bắt đầu chuỗi
   * (?=.*[A-Za-z]) : Lookahead - Phải chứa ít nhất 1 chữ cái (hoa hoặc thường)
   * (?=.*\d)       : Lookahead - Phải chứa ít nhất 1 số (0-9)
   * .{6,}          : Độ dài chuỗi phải từ 6 ký tự trở lên (bao gồm cả ký tự đặc biệt nếu có)
   * $              : Kết thúc chuỗi
   */
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số',
  })
  newPassword: string;
}
