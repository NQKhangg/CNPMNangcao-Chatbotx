import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order_status.enum';
import { PaymentStatus } from '../enums/payment_status.enum';

export type OrderDocument = Order & Document;

/**
 * Schema con: Món hàng (Snapshot)
 * _id: false -> Không cần tạo ID riêng cho từng item trong đơn hàng để tiết kiệm dung lượng index.
 */
@Schema({ _id: false })
class OrderItem {
  // Link tới Product gốc để sau này user click vào xem lại chi tiết hoặc đánh giá
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  // Lưu SKU text để dễ đối soát với kho
  @Prop({ required: true })
  sku: string;

  // --- KỸ THUẬT SNAPSHOT (LƯU CỨNG) ---
  // Tại sao phải lưu lại Tên, Ảnh, Giá?
  // Để nếu sau này Admin sửa tên sản phẩm hoặc tăng giá,
  // thì đơn hàng cũ của khách vẫn hiển thị đúng thông tin tại thời điểm họ mua.

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  productImage: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  price: number; // Giá bán thực tế tại thời điểm mua (Sau khi trừ khuyến mãi SP nếu có)

  @Prop({ required: true })
  originalPrice: number; // Giá gốc
}

/**
 * Schema con: Lịch sử đơn hàng
 * Dùng để Tracking: Đơn hàng chuyển trạng thái lúc nào? Ai làm?
 */
@Schema({ _id: false })
class OrderHistory {
  @Prop({ required: true })
  status: string; // PENDING -> CONFIRMED -> SHIPPING...

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId; // User ID của người thao tác (Admin hoặc Khách)

  @Prop({ default: Date.now })
  timestamp: Date; // Thời điểm thay đổi

  @Prop()
  note?: string; // Ghi chú (VD: "Khách hẹn giao sau 5h chiều")
}

@Schema({ timestamps: true }) // Tự động có createdAt, updatedAt
export class Order {
  // --- 1. LIÊN KẾT USER ---
  // Có thể null nếu khách mua không cần đăng nhập (Guest Checkout)
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  // --- 2. THÔNG TIN GIAO HÀNG (Snapshot) ---
  // Lưu cứng object này thay vì Ref sang User Address.
  // Lý do: User có thể đổi địa chỉ mặc định trong Profile, nhưng đơn hàng cũ phải giữ nguyên địa chỉ cũ.
  @Prop({ type: Object, required: true })
  customerInfo: {
    name: string;
    phone: string;
    address: {
      city: string;
      district: string;
      ward: string;
      street: string;
    };
    note?: string;
  };

  // --- 3. DANH SÁCH HÀNG ---
  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  // --- 4. TRẠNG THÁI ---
  @Prop({
    required: true,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: string;

  // Mảng lưu lịch sử các lần đổi trạng thái
  @Prop({ type: [OrderHistory], default: [] })
  history: OrderHistory[];

  @Prop()
  cancelReason?: string; // Lý do hủy đơn

  // --- 5. THANH TOÁN ---
  @Prop({ required: true, default: 'COD' })
  paymentMethod: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: string;

  @Prop()
  transactionId?: string; // Mã giao dịch từ cổng thanh toán (VNPAY/Momo) gửi về

  // --- 6. GIAO VẬN (Logistics) ---
  @Prop()
  shippingMethod?: string; // Đơn vị vận chuyển

  @Prop()
  trackingCode?: string; // Mã vận đơn

  // --- 7. TÀI CHÍNH ---
  @Prop({ default: 0 })
  subTotal: number; // Tổng tiền hàng (Chưa ship, chưa giảm)

  @Prop({ default: 0 })
  shippingFee: number; // Phí ship

  @Prop({ default: 0 })
  discountAmount: number; // Tổng tiền được giảm (Coupon + Voucher)

  @Prop({ required: true })
  totalAmount: number; // = subTotal + shippingFee - discountAmount (Số tiền khách phải trả cuối cùng)

  // Lưu thông tin Coupon đã dùng
  @Prop({ type: [{ code: String, discountValue: Number }], default: [] })
  coupons: { code: string; discountValue: number }[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// --- INDEX ---
// 1. Sắp xếp đơn hàng mới nhất (createdAt: -1)
OrderSchema.index({ createdAt: -1 });

// 2. Tìm đơn hàng theo Số điện thoại khách (CSKH hay dùng)
OrderSchema.index({ 'customerInfo.phone': 1 });

// 3. Lọc đơn theo trạng thái (VD: Tab "Đang giao")
OrderSchema.index({ status: 1 });
