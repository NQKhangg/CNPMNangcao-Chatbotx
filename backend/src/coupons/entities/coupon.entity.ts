import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CouponType } from '../enums/coupon_type.enum';

export type CouponDocument = Coupon & Document;

@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class Coupon {
  /**
   * Mã giảm giá.
   * unique: true -> Đảm bảo không có 2 mã trùng nhau.
   * uppercase: true -> Tự động lưu dạng in hoa (VD: user nhập 'summer' -> lưu 'SUMMER').
   * trim: true -> Cắt khoảng trắng thừa đầu đuôi.
   */
  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  /**
   * Loại giảm giá.
   * Chỉ chấp nhận 2 giá trị: 'PERCENT' hoặc 'AMOUNT'.
   */
  @Prop({ required: true, enum: CouponType })
  type: CouponType;

  /**
   * Giá trị giảm.
   * Nếu type=PERCENT: Giá trị này là % (VD: 10).
   * Nếu type=AMOUNT: Giá trị này là VNĐ (VD: 50000).
   */
  @Prop({ required: true, min: 0 })
  value: number;

  /**
   * Giới hạn số lần sử dụng.
   * 0: Không giới hạn (Vô tận).
   * > 0: Số lần tối đa mã này được phép dùng.
   */
  @Prop({ default: 0, min: 0 })
  usageLimit: number;

  /**
   * Số lần đã sử dụng thực tế.
   * Mỗi khi có đơn hàng dùng mã này thành công, tăng số này lên 1.
   * Logic check: if (usedCount >= usageLimit && usageLimit > 0) -> Hết lượt.
   */
  @Prop({ default: 0, min: 0 })
  usedCount: number;

  /**
   * Giá trị đơn hàng tối thiểu (VNĐ).
   * Ví dụ: 100000 -> Đơn từ 100k mới được dùng.
   */
  @Prop({ default: 0, min: 0 })
  minOrderValue: number;

  /**
   * Ngày hết hạn.
   */
  @Prop({ type: Date, required: true })
  expiryDate?: Date;

  /**
   * Trạng thái kích hoạt.
   * Admin có thể tắt mã này thủ công (isActive = false) ngay cả khi chưa hết hạn.
   */
  @Prop({ default: true })
  isActive: boolean;

  /**
   * Xóa mềm
   */
  @Prop({ default: false })
  isDeleted: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Đánh index cho trường 'code' để tìm kiếm nhanh hơn khi User nhập mã lúc Checkout
CouponSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
// Đánh index ngày hết hạn để quét mã hết hạn dễ hơn
CouponSchema.index({ expiryDate: 1 });
