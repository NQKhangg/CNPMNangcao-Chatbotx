import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InventoryType } from '../enums/inventory_type.enum';

export type InventoryLogDocument = InventoryLog & Document;

@Schema({ timestamps: true }) // Tự động tạo createdAt (thời gian log)
export class InventoryLog {
  /**
   * Sản phẩm bị tác động.
   * Index: true -> Giúp truy vấn "Xem lịch sử của sản phẩm A" nhanh.
   */
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId: Types.ObjectId;

  /**
   * Mã đơn hàng (Nếu là SALE hoặc RETURN).
   */
  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  orderId?: Types.ObjectId;

  /**
   * Nhà cung cấp (Nếu là IMPORT).
   */
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: false })
  supplierId?: Types.ObjectId;

  /**
   * Mã tham chiếu/Mã phiếu (VD: PN-2023-001, PX-HUY-002).
   * Giúp kế toán đối soát với giấy tờ thực tế.
   */
  @Prop({ required: false })
  referenceCode?: string;

  /**
   * Loại hành động (Nhập, Xuất, Hủy...).
   */
  @Prop({ required: true, enum: InventoryType })
  type: InventoryType;

  /**
   * Số lượng thay đổi.
   * - Dương (+): Nhập, Trả hàng.
   * - Âm (-): Bán, Hủy.
   */
  @Prop({ required: true })
  change: number;

  /**
   * Tồn kho TẠI THỜI ĐIỂM ghi log (Snapshot).
   * Giúp vẽ biểu đồ lịch sử tồn kho mà không cần tính toán lại từ đầu.
   */
  @Prop({ required: true })
  currentStock: number;

  /**
   * Lý do/Ghi chú chi tiết.
   */
  @Prop()
  reason: string;

  /**
   * Người thực hiện (Snapshot).
   * Lưu cứng thông tin (email, role) thay vì chỉ lưu ID.
   * Để lỡ User bị xóa thì log vẫn biết ai đã làm.
   */
  @Prop({
    type: Object({
      userId: String,
      email: String,
      role: String,
    }),
  })
  actor: {
    userId: string;
    email: string;
    role: string;
  };
}

export const InventoryLogSchema = SchemaFactory.createForClass(InventoryLog);

// Index : Sắp xếp lịch sử mới nhất
InventoryLogSchema.index({ createdAt: -1 });
export { InventoryType };
