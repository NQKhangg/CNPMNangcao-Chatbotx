import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { ContactStatus } from '../enums/contact_status.enum';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class Contact {
  /**
   * Tên người liên hệ.
   */
  @Prop({ required: true, trim: true })
  name: string;

  /**
   * Email người liên hệ.
   * Index: true -> Giúp Admin tìm lịch sử gửi tin của 1 email cụ thể nhanh.
   */
  @Prop({ required: true, trim: true, index: true })
  email: string;

  /**
   * ID khách hàng (nếu họ đã đăng nhập).
   * Index: true -> Giúp query "Xem lịch sử liên hệ của user này".
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  customerId?: User | string;

  /**
   * Tiêu đề liên hệ.
   */
  @Prop({ required: true })
  subject: string;

  /**
   * Nội dung tin nhắn.
   */
  @Prop({ required: true })
  message: string;

  /**
   * Trạng thái xử lý.
   * Default: PENDING.
   * Index: true -> Để Admin lọc ra các tin "Chưa trả lời" nhanh hơn.
   */
  @Prop({
    required: true,
    enum: ContactStatus,
    default: ContactStatus.PENDING,
    index: true,
  })
  status: string;

  /**
   * Người trả lời (Admin/Staff).
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  replierId?: User | string;

  /**
   * Nội dung Admin phản hồi.
   */
  @Prop()
  replyMessage?: string;

  /**
   * Thời điểm phản hồi.
   */
  @Prop()
  repliedAt?: Date;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// --- INDEX ---
// Tạo Compound Index (Chỉ mục kép): Giúp sắp xếp tin nhắn mới nhất nhanh hơn
ContactSchema.index({ createdAt: -1 });
