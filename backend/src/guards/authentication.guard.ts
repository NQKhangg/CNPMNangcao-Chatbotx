import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';

/**
 * AuthenticationGuard: Middleware kiểm tra đăng nhập.
 * 1. Lấy Token từ Header gửi lên.
 * 2. Giải mã Token (Verify) để xem có hợp lệ không.
 * 3. Gắn thông tin User vào Request để Controller sử dụng.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  /**
   * Hàm canActivate: Quyết định cho phép (true) hoặc chặn (false/throw exception) request.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 1. Chuyển đổi context sang HTTP để lấy đối tượng Request của Express
    const request = context.switchToHttp().getRequest();

    // 2. Lấy token từ header Authorization (Bearer ...)
    const token = this.extractTokenFromHeader(request);

    // 3. Nếu không có token -> Chặn luôn, báo lỗi 401 Unauthorized
    if (!token) {
      throw new UnauthorizedException('Invalid token: Token not found');
    }

    try {
      // 4. Xác thực Token
      // verify() sẽ throw lỗi nếu token hết hạn, sai chữ ký, hoặc format sai
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET, // Key bí mật dùng để ký token
      });

      // console.log('Payload giải mã từ token:', payload);

      // 5. Gắn thông tin user vào object Request
      // Để ở Controller, bạn có thể dùng @Req() req -> req.user để lấy thông tin
      request['user'] = {
        userId: payload.userId, // ID của user (Lưu ý: JWT chuẩn thường dùng field 'sub', check lại code login của bạn)
        email: payload.email,
        role: payload.role,
      };

      // Giữ lại cái này để tương thích với code cũ dùng req.userId (nếu có)
      // Tuy nhiên, khuyên dùng req.user.userId cho chuẩn cấu trúc object
      request['userId'] = payload.userId;
    } catch (e) {
      // 6. Nếu verify thất bại (Token hết hạn, sai secret...) -> Báo lỗi
      Logger.error(`Auth Error: ${e.message}`);
      throw new UnauthorizedException('Invalid Token: Verification failed');
    }

    // 7. Nếu chạy êm đẹp đến đây -> Cho phép request đi tiếp vào Controller
    return true;
  }

  /**
   * Helper: Tách token từ chuỗi "Bearer <token_string>"
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    // request.headers.authorization có dạng: "Bearer eyJhbGci..."
    // split(' ') -> ["Bearer", "eyJhbGci..."]
    // [1] -> Lấy phần token phía sau
    // Dấu ? (Optional chaining) để tránh lỗi nếu header không tồn tại
    return request.headers.authorization?.split(' ')[1];
  }
}
