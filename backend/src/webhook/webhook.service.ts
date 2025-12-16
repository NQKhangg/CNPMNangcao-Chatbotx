import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from 'src/orders/entities/order.entity';
import { WebhookDto } from './dtos/create-webhook.dto';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from './entities/payment-transaction.entity';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(PaymentTransaction.name)
    private transModel: Model<PaymentTransactionDocument>,
  ) {}

  async handleSepayWebhook(payload: WebhookDto) {
    // SAVE LOG TRANSACTION SEPAY
    try {
      // Kiểm tra xem giao dịch này đã xử lý chưa dựa trên ID của SePay
      const existTrans = await this.transModel.findOne({
        transactionId: payload.id,
      });
      if (existTrans) {
        this.logger.log(`Giao dịch ${payload.id} đã tồn tại.`);
        return { success: true, message: 'Already processed' };
      }

      // Lưu vào DB
      await this.transModel.create({
        transactionId: payload.id,
        gateway: payload.gateway,
        transactionDate: payload.transactionDate,
        accountNumber: payload.accountNumber,
        content: payload.content,
        transferAmount: payload.transferAmount,
        transferType: payload.transferType,
        status: 'PAID',
      });
    } catch (error) {
      this.logger.error('Lỗi khi lưu log giao dịch', error);
    }

    // UPDATE ORDER
    // 1. Chỉ nhận tiền vào
    if (payload.transferType !== 'in') {
      this.logger.warn(`Bỏ qua giao dịch tiền ra hoặc không xác định.`);
      return;
    }

    // 2. Regex tìm mã đơn hàng
    // Payload : "...THANHTOANEAB4F3..."
    // Regex này hỗ trợ cả dính liền và có dấu cách
    const match = payload.content?.match(
      /(?:DH|THANHTOAN)\s*([a-fA-F0-9]{6,24})/i,
    );

    if (match) {
      const orderIdPart = match[1].toUpperCase();
      this.logger.log(`Tìm đơn hàng có đuôi ID: ${orderIdPart}`);

      // 3. Lấy tất cả đơn PENDING ra để lọc
      const pendingOrders = await this.orderModel.find({ status: 'PENDING' });

      const order = pendingOrders.find((o) =>
        o._id.toString().toUpperCase().endsWith(orderIdPart),
      );

      if (order) {
        // Check số tiền
        const receivedAmount = payload.transferAmount || 0;

        if (receivedAmount >= order.totalAmount) {
          order.status = 'CONFIRMED';
          order.paymentStatus = 'PAID';
          await order.save();
          this.logger.log(`THÀNH CÔNG: Đã xác nhận đơn ${order._id}`);
        } else {
          this.logger.warn(
            `Tiền thiếu. Cần: ${order.totalAmount}, Nhận: ${receivedAmount}`,
          );
        }
      } else {
        this.logger.warn(
          `Không tìm thấy đơn PENDING nào khớp với mã: ${orderIdPart}`,
        );
      }
    } else {
      this.logger.warn(
        `Không tìm thấy từ khóa THANHTOAN/DH trong nội dung: ${payload.content}`,
      );
    }

    return { success: true };
  }
}
