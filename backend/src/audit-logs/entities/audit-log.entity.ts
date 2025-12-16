import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  /**
   * Loại hành động thực hiện.
   * Ví dụ: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'.
   * Index: Giúp Admin lọc nhanh các hành động nguy hiểm (như DELETE).
   */
  @Prop({ required: true, index: true })
  action: string;

  /**
   * Tên tài nguyên bị tác động.
   * Ví dụ: 'Product', 'Order', 'User', 'Category'.
   */
  @Prop({ required: true })
  resource: string;

  /**
   * ID của đối tượng bị tác động.
   */
  @Prop({ type: Types.ObjectId, required: true })
  resourceId: Types.ObjectId;

  /**
   * Người thực hiện hành động.
   * Liên kết (Ref) sang bảng User.
   * Index: Để tra cứu "Nhân viên A đã làm gì?".
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  performedBy: User | Types.ObjectId;

  /**
   * Dữ liệu cũ trước khi thay đổi.
   * Thường dùng cho hành động UPDATE hoặc DELETE.
   */
  @Prop({ type: Object, required: false })
  oldValue?: Record<string, any>;

  /**
   * Dữ liệu mới sau khi thay đổi.
   * Thường dùng cho hành động CREATE hoặc UPDATE.
   */
  @Prop({ type: Object, required: false })
  newValue?: Record<string, any>;

  /**
   * Địa chỉ IP của người dùng khi gửi request.
   * Hữu ích để chặn spam hoặc điều tra truy cập lạ.
   */
  @Prop({ required: false })
  ip?: string;

  /**
   * Thông tin thiết bị/trình duyệt (User-Agent).
   * Ví dụ: "Mozilla/5.0 (Windows NT 10.0)..."
   */
  @Prop({ required: false })
  userAgent?: string;

  /**
   * Trường thời gian tạo (tự động có do timestamps: true).
   * Khai báo để TypeScript nhận diện khi dùng lọc Date
   */
  createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// --- INDEX (CHIẾN LƯỢC TRUY VẤN) ---

// 1. Index kép: Tìm lịch sử của MỘT đối tượng cụ thể.
// VD: Xem lịch sử sửa đổi của Đơn hàng #123.
AuditLogSchema.index({ resource: 1, resourceId: 1 });

// 2. Index kép: Xem hoạt động của MỘT nhân viên, sắp xếp mới nhất.
// VD: Hôm nay nhân viên A đã làm những gì?
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });

// 3. Index đơn: Sắp xếp thời gian (Để Admin xem Log toàn hệ thống).
AuditLogSchema.index({ createdAt: -1 });
