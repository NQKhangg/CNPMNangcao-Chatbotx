import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 1. Lấy thông tin từ @Audit decorator
    const auditInfo = this.reflector.get(AUDIT_KEY, context.getHandler());

    // Nếu API không gắn @Audit -> Bỏ qua, chỉ chạy như bình thường
    if (!auditInfo) {
      return next.handle();
    }

    // 2. Lấy thông tin Request ban đầu
    const req = context.switchToHttp().getRequest();

    // Lấy user từ Token (Nếu đã đăng nhập qua Guard)
    let user = req.user;

    // Lấy thông tin môi trường
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Lấy ID từ URL (VD: /users/:id -> id này dùng làm resourceId mặc định)
    const paramId = req.params.id || req.params._id;

    // 3. Xử lý luồng dữ liệu (RxJS Pipe)
    // next.handle() sẽ gọi Service chạy. Sau khi Service trả về, code trong pipe() sẽ chạy.
    return next.handle().pipe(
      // --- GIAI ĐOẠN 1: GHI LOG (Side Effect) ---
      // Toán tử 'tap' dùng để thực hiện hành động phụ mà không làm thay đổi dữ liệu trả về
      tap(async (response) => {
        try {
          // Nếu Service trả về null/void (trừ case DELETE) thì không log để tránh lỗi
          if (!response && auditInfo.action !== 'DELETE') return;

          let resourceId = response?._id || paramId;

          // === LOGIC XỬ LÝ PUBLIC API (QUAN TRỌNG) ===
          // Với Signup/Reset Password/Login, lúc request vào chưa có User trong Token (req.user = null).
          // Ta phải lấy User ID từ chính kết quả trả về của Service.
          if (!user && response && (response._id || response.userId)) {
            // Giả lập object user để dùng cho performedBy
            user = { userId: response._id || response.userId };

            // Nếu chưa có resourceId (thường là trường hợp tạo mới User), lấy luôn ID này
            if (!resourceId) resourceId = user.userId;
          }
          // ===========================================

          let oldValue = null;
          let newValue = null;

          // === PHÂN LOẠI HÀNH ĐỘNG ĐỂ GHI LOG ===

          // Case 1: UPDATE (Cần lưu cả cũ và mới)
          if (auditInfo.action === 'UPDATE') {
            // Kiểm tra xem Service có trả về đúng format { oldData, newData } không
            if (response.oldData || response.newData) {
              oldValue = response.oldData;
              newValue = response.newData;

              // Đặc biệt: Với Reset Password, ID user nằm trong newData
              if (response.newData && response.newData._id) {
                resourceId = response.newData._id;
                // Cập nhật lại người thực hiện nếu đang là public flow
                if (!user) user = { userId: resourceId };
              }
            } else {
              // Fallback: Nếu service lười không trả về oldData, dùng tạm request body làm oldValue
              newValue = response;
              oldValue = req.body;
            }
          }
          // Case 2: CREATE (Chỉ có mới)
          else if (auditInfo.action === 'CREATE') {
            newValue = response;
            resourceId = response._id;
          }
          // Case 3: DELETE (Chỉ có cũ)
          else if (auditInfo.action === 'DELETE') {
            oldValue = response;
            resourceId = response._id;
          }

          // === GHI VÀO DB ===
          // Xác định người thực hiện cuối cùng
          const performedBy = user ? user.userId : null;

          // Chỉ ghi khi xác định được ai làm và làm trên cái gì
          if (performedBy && resourceId) {
            await this.auditLogsService.log({
              action: auditInfo.action,
              resource: auditInfo.resource,
              resourceId: resourceId,
              performedBy: performedBy,
              oldValue: oldValue,
              newValue: newValue,
              ip: ip,
              userAgent: userAgent,
            });
          }
        } catch (err) {
          // Bắt lỗi log để không làm crash luồng chính của user
          this.logger.error(`Audit Log Error: ${err.message}`);
        }
      }),

      // --- GIAI ĐOẠN 2: DỌN DẸP DỮ LIỆU (Transform) ---
      // Toán tử 'map' dùng để biến đổi dữ liệu trước khi trả về cho Frontend
      map((response) => {
        // Nếu Service trả về dạng { oldData, newData } (Dạng gói tin nội bộ cho Log)
        if (response && response.oldData && response.newData) {
          // Nếu là Login/Signup, ta cần trả về toàn bộ (vì chứa Token)
          // Nếu là Update thông thường, ta chỉ cần trả về newData (kết quả sau khi sửa)
          // Ở đây logic ưu tiên trả về newData nếu có, hoặc trả về nguyên gốc
          return response.newData || response;
        }

        // Cleanup: Xóa các trường thừa nếu lỡ còn sót lại
        if (response && typeof response === 'object') {
          delete response.oldData;
          delete response.newData;
        }

        // Trả về dữ liệu sạch cho Frontend
        return response;
      }),
    );
  }
}
