import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  // Inject MailerService của thư viện @nestjs-modules/mailer để thực hiện việc gửi
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  /**
   * Gửi email khôi phục mật khẩu (Forgot Password)
   * @param to Email người nhận
   * @param token Mã xác nhận hoặc token reset
   */
  async sendPasswordResetEmail(to: string, token: string) {
    // Link trỏ về trang Reset Password của FRONTEND (React/Next.js)
    const url = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: to,
      subject: 'Khôi phục mật khẩu - FreshFood', // Tiêu đề email
      // Nội dung HTML của email (Có thể dùng template engine như Handlebars/EJS nếu mail phức tạp)
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
          <p>Chào bạn,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>FreshFood</strong>.</p>
          <p>Vui lòng sử dụng mã Token bên dưới để xác nhận (Có hiệu lực trong 1 giờ):</p>
          
          <div style="background: #f9f9f9; padding: 10px; text-align: center; border-radius: 5px;">
             <h1 style="color: #16a34a; letter-spacing: 5px; margin: 0;">${token}</h1>
          </div>
          
          <p style="margin-top: 20px;">Hoặc bấm trực tiếp vào đường dẫn này:</p>
          <a href="${url}" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu ngay</a>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
        </div>
      `,
    });
    console.log('LOG: Đã gửi mail reset password tới: ' + to);
  }

  /**
   * Gửi email phản hồi thắc mắc khách hàng (Admin trả lời Contact)
   * to Email khách hàng
   * name Tên khách hàng
   * originalMessage Câu hỏi gốc của khách
   * replyContent Câu trả lời của Admin
   */
  async sendContactReply(
    to: string,
    name: string,
    originalMessage: string,
    replyContent: string,
  ) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Phản hồi từ bộ phận Hỗ trợ FreshFood',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Chào ${name},</h3>
          <p>Cảm ơn bạn đã liên hệ với FreshFood. Chúng tôi xin phản hồi về vấn đề của bạn như sau:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #16a34a; margin: 15px 0; color: #555; font-style: italic;">
             "${originalMessage}"
          </div>

          <div style="padding: 10px 0;">
            <p><strong>Nội dung phản hồi:</strong></p>
            <p style="white-space: pre-line;">${replyContent}</p> 
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="color: #16a34a; font-weight: bold;">Trân trọng,<br/>Đội ngũ CSKH FreshFood.</p>
        </div>
      `,
    });
    console.log('LOG: Đã gửi phản hồi contact tới: ' + to);
  }
}
