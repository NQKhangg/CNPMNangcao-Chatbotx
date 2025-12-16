import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupplierDocument = Supplier & Document;

/**
 * @Schema({ timestamps: true })
 * Tự động tạo 2 trường:
 * - createdAt: Ngày tạo NCC
 * - updatedAt: Ngày cập nhật thông tin gần nhất
 */
@Schema({ timestamps: true })
export class Supplier {
  /**
   * Tên Công ty / Nhà vườn
   * index: true -> Đánh index để tìm kiếm theo tên nhanh hơn.
   */
  @Prop({ required: true, index: true })
  name: string;

  /**
   * Tên người liên hệ (Sale/Chủ vườn)
   */
  @Prop()
  contactPerson: string;

  /**
   * Số điện thoại liên hệ
   * index: true -> Giúp tìm nhanh "SĐT này của NCC nào?".
   */
  @Prop({ required: true, index: true })
  phone: string;

  /**
   * Email liên hệ
   */
  @Prop()
  email: string;

  /**
   * Địa chỉ trụ sở/kho hàng
   */
  @Prop()
  address: string;

  /**
   * Mã số thuế (Tax Code)
   * Dùng cho nghiệp vụ kế toán/nhập kho.
   */
  @Prop()
  taxCode: string;

  /**
   * Ghi chú nội bộ về NCC này.
   */
  @Prop()
  note: string;

  /**
   * Xóa mềm (Soft Delete)
   */
  @Prop({ default: false })
  isDeleted: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

// --- INDEX ---
// Tạo Text Index để hỗ trợ tìm kiếm trên tên và sđt
SupplierSchema.index({ name: 'text', phone: 'text' });
