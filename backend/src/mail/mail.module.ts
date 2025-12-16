import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

/**
 * @Global()
 * Decorator này biến MailModule thành module toàn cục.
 * Tác dụng: Bạn chỉ cần import MailModule một lần ở AppModule,
 * sau đó có thể dùng MailService ở BẤT KỲ module nào khác (Auth, User...)
 * mà không cần thêm MailModule vào mảng imports của chúng.
 */
@Global()
@Module({
  imports: [
    /**
     * Cấu hình MailerModule bất đồng bộ (Async)
     * Lý do: Cần đọc user/pass từ file .env thông qua ConfigService.
     * Vì việc đọc file cấu hình có thể mất thời gian hoặc cần thứ tự ưu tiên,
     * nên dùng forRootAsync + useFactory để đảm bảo ConfigService đã sẵn sàng.
     */
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com', // Server SMTP của Google
          port: 587, // Port chuẩn cho kết nối bảo mật STARTTLS
          secure: false, // false cho port 587, true cho port 465
          auth: {
            // Lấy thông tin nhạy cảm từ biến môi trường (.env)
            user: config.get('MAIL_USER'),

            // LƯU Ý QUAN TRỌNG:
            // Đây là "Mật khẩu ứng dụng" (App Password) dài 16 ký tự của Google,
            // KHÔNG PHẢI mật khẩu đăng nhập Gmail bình thường.
            // Bạn cần bật xác thực 2 bước (2FA) cho Gmail thì mới tạo được cái này.
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          // Tên người gửi mặc định sẽ hiện trong hộp thư đến của khách
          from: `"FreshFood Support" <${config.get('MAIL_USER')}>`,
        },
      }),
      inject: [ConfigService], // Inject ConfigService để dùng trong useFactory
    }),
  ],
  providers: [MailService], // Khai báo Service xử lý logic
  exports: [MailService], // Export để các Module khác có thể gọi dùng
})
export class MailModule {}
