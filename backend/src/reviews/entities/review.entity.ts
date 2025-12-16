import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/products/entities/product.entity';
import { User } from 'src/users/entities/user.entity';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class Review {
  /**
   * Người đánh giá.
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: User | string;

  /**
   * Sản phẩm được đánh giá.
   */
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Product | string;

  /**
   * Điểm số đánh giá.
   * Giới hạn từ 1 đến 5 sao.
   */
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  /**
   * Nội dung bình luận.
   */
  @Prop({ required: true, trim: true })
  comment: string;

  /**
   * Danh sách ảnh đính kèm (URL ảnh).
   */
  @Prop({ type: [String], default: [] })
  images: string[];

  /**
   * Trạng thái ẩn.
   * true: Đánh giá bị ẩn (Do vi phạm, spam...).
   * false: Hiển thị bình thường.
   */
  @Prop({ default: false })
  isHidden: boolean;

  /**
   * --- TRẢ LỜI ĐÁNH GIÁ (ADMIN REPLY) ---
   */
  @Prop()
  replyComment?: string; // Nội dung Admin trả lời

  @Prop({ type: Types.ObjectId, ref: 'User' })
  repliedBy?: User | string; // ID của nhân viên/admin trả lời

  @Prop()
  repliedAt?: Date; // Thời gian trả lời
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// --- INDEX ---

// 1. Compound Index: Tìm review theo Sản phẩm + Sắp xếp mới nhất
ReviewSchema.index({ productId: 1, createdAt: -1 });

// 2. Compound Index: Đảm bảo 1 User chỉ đánh giá 1 Sản phẩm đúng 1 lần
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
