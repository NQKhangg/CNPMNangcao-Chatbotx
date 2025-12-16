import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { InventoryService } from 'src/inventory/inventory.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrderStatus } from './enums/order_status.enum';
import { PaymentStatus } from './enums/payment_status.enum';
import { InventoryType } from 'src/inventory/enums/inventory_type.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private inventoryService: InventoryService, // Service Kho
    private couponsService: CouponsService, // Service Mã giảm giá
  ) {}

  /**
   * TẠO ĐƠN HÀNG
   * 1. Kiểm tra tồn kho từng sản phẩm.
   * 2. Trừ kho (giữ chỗ).
   * 3. Tính toán giá tiền (lấy giá gốc từ DB).
   * 4. Áp dụng mã giảm giá (nếu có).
   * 5. Lưu đơn hàng.
   */
  async create(createOrderDto: CreateOrderDto, actor: any) {
    const { items, customerInfo, paymentMethod, couponCodes } = createOrderDto;

    let subTotal = 0; // Tổng tiền hàng chưa giảm
    const orderItems: any[] = [];

    // Pre-generate ID: Tạo ID trước để dùng làm reference cho log kho
    const orderId = new Types.ObjectId();

    // 1: Duyệt qua từng sản phẩm trong giỏ hàng
    for (const item of items) {
      // Query giá và kho mới nhất từ DB
      const product = await this.productModel.findById(item.productId);

      if (!product) {
        throw new BadRequestException(
          `Sản phẩm ID ${item.productId} không tồn tại`,
        );
      }
      if (product.isDeleted || !product.isAvailable) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} đã ngừng kinh doanh`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} không đủ hàng (Còn: ${product.stock})`,
        );
      }

      // TRỪ KHO
      // Gọi InventoryService để ghi log biến động kho và update số lượng tồn
      await this.inventoryService.adjustStock(
        item.productId,
        -item.quantity, // Số lượng âm = Xuất kho
        InventoryType.SALE,
        `Bán hàng cho đơn #${orderId}`,
        {
          userId: actor?.userId || 'Unknown',
          email: actor?.email || 'Unknown',
          role: actor?.role || 'Unknown',
        },
        orderId.toString(),
      );

      // Tính tiền: Dùng giá trong DB * số lượng
      subTotal += product.price * item.quantity;

      // Lưu snapshot thông tin sản phẩm vào đơn hàng
      orderItems.push({
        productId: product._id,
        sku: product.sku || 'N/A',
        productName: product.name,
        productImage: product.images?.[0] || product.thumbnail || '',
        quantity: item.quantity,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
      });
    }

    // 2: Xử lý Mã giảm giá (Hỗ trợ nhiều mã cùng lúc)
    let discountAmount = 0;
    const usedCouponsList: any[] = [];

    if (couponCodes && couponCodes.length > 0) {
      const uniqueCodes = [...new Set(couponCodes)]; // Loại bỏ mã trùng

      for (const code of uniqueCodes) {
        try {
          // Validate mã: Có tồn tại? Còn hạn? Còn lượt dùng?
          const coupon = await this.couponsService.validateCoupon(code);

          // Tính giá trị giảm
          let currentDiscount = 0;
          if (coupon.type === 'PERCENT') {
            currentDiscount = (subTotal * coupon.value) / 100;
          } else {
            currentDiscount = coupon.value; // Giảm tiền mặt
          }

          discountAmount += currentDiscount;

          usedCouponsList.push({
            code: code,
            value: currentDiscount,
            couponId: coupon._id,
          });

          // Tăng đếm số lượt sử dụng mã
          await this.couponsService.incrementUsage(code);
        } catch (e) {
          console.warn(`Mã giảm giá ${code} không áp dụng được: ${e.message}`);
          // Silent fail: Bỏ qua mã lỗi, vẫn tạo đơn bình thường
        }
      }
    }

    // 3: Tính phí vận chuyển & Tổng tiền cuối cùng
    const shippingFee = this.calculateShippingFee(subTotal);

    // Đảm bảo tổng giảm giá không vượt quá tổng tiền
    const maxDiscount = subTotal + shippingFee;
    if (discountAmount > maxDiscount) discountAmount = maxDiscount;

    const finalTotal = Math.max(0, subTotal + shippingFee - discountAmount);

    // 4: Lưu đơn hàng vào MongoDB
    try {
      const newOrder = await this.orderModel.create({
        _id: orderId, // Sử dụng ID đã tạo trước đó
        userId: actor.userId || null, // Null nếu là khách vãng lai

        customerInfo: customerInfo, // Object { name, phone, address... }
        items: orderItems,

        status: OrderStatus.PENDING,
        paymentMethod: paymentMethod,
        paymentStatus: PaymentStatus.UNPAID,

        // Khởi tạo lịch sử đơn hàng
        history: [
          {
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            note: 'Đơn hàng mới được khởi tạo',
            updatedBy: actor.userId || null,
          },
        ],

        subTotal,
        shippingFee,
        discountAmount,
        appliedCoupons: usedCouponsList,
        totalAmount: finalTotal,
      });

      return newOrder;
    } catch (error) {
      console.error('Lỗi khi lưu đơn hàng:', error);
      throw new BadRequestException(
        'Không thể tạo đơn hàng, vui lòng thử lại sau.',
      );
    }
  }

  // Helper: Tính phí ship
  private calculateShippingFee(subTotal: number): number {
    const FREE_SHIP_THRESHOLD = 500000; // Trên 500k miễn phí
    const BASE_FEE = 30000; // Phí cố định 30k
    return subTotal >= FREE_SHIP_THRESHOLD ? 0 : BASE_FEE;
  }

  /**
   * Lấy danh sách đơn hàng (Admin Dashboard)
   */
  async findAll(page: number = 1, limit: number = 10, keyword?: string) {
    const filter: any = {};

    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i'); // Case-insensitive
      const numKeyword = Number(keyword);

      // Tìm kiếm trên các trường Text
      const orQuery: any[] = [
        { 'customerInfo.name': regex },
        { 'customerInfo.phone': regex },
        { 'customerInfo.address.city': regex }, // Tìm theo thành phố
        { status: regex },
        { 'items.productName': regex }, // Tìm theo tên sản phẩm trong đơn
      ];

      // Nếu keyword là số -> Tìm theo Tổng tiền
      if (!isNaN(numKeyword)) {
        orQuery.push({ totalAmount: numKeyword });
      }

      // Nếu keyword là ID -> Tìm theo Mã đơn
      if (isValidObjectId(keyword)) {
        orQuery.push({ _id: keyword });
      }

      filter.$or = orQuery;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết đơn hàng theo ID
   */
  async findOne(id: string) {
    return this.orderModel.findById(id).exec();
  }

  /**
   * Lấy danh sách đơn hàng CỦA TÔI (Client)
   */
  async findByUser(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Cập nhật trạng thái đơn (Admin)
   * Trả về { oldData, newData } để ghi Audit Log
   */
  async updateStatus(id: string, status: string, actor: any) {
    const oldOrder = await this.orderModel.findById(id).lean();
    if (!oldOrder) throw new BadRequestException('Đơn hàng không tồn tại');

    const updateOrder = await this.orderModel.findByIdAndUpdate(
      id,
      {
        status: status,
        // Push thêm vào lịch sử
        $push: {
          history: {
            status: status,
            updatedBy: actor.userId,
            timestamp: new Date(),
            note: 'Cập nhật bởi Admin',
          },
        },
      },
      { new: true },
    );

    return {
      oldData: oldOrder,
      newData: updateOrder,
    };
  }

  /**
   * KHÁCH HÀNG TỰ HỦY ĐƠN
   * Logic: Chỉ hủy được đơn của chính mình & Đơn chưa giao.
   * Hoàn lại kho (Inventory Return).
   */
  async cancelOrder(orderId: string, actor: any) {
    const userId = actor.userId;

    // 1. Kiểm tra điều kiện
    const oldOrder = await this.orderModel
      .findOne({ _id: orderId, userId })
      .lean();

    if (!oldOrder)
      throw new BadRequestException(
        'Đơn hàng không tồn tại hoặc không chính chủ.',
      );

    // Chỉ cho hủy khi PENDING hoặc CONFIRMED (chưa giao cho shipper)
    if (['SHIPPING', 'COMPLETED', 'CANCELLED'].includes(oldOrder.status)) {
      throw new BadRequestException(
        'Đơn hàng đang giao hoặc đã hoàn tất, không thể hủy.',
      );
    }

    // 2. Cập nhật trạng thái
    const newOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        status: OrderStatus.CANCELLED,
        cancelReason: 'Khách hàng tự hủy',
        $push: {
          history: {
            status: OrderStatus.CANCELLED,
            updatedBy: userId,
            timestamp: new Date(),
            note: 'Khách hàng yêu cầu hủy',
          },
        },
      },
      { new: true },
    );

    // 3. HOÀN LẠI KHO (Back Inventory)
    if (oldOrder.items) {
      for (const item of oldOrder.items) {
        await this.inventoryService.adjustStock(
          item.productId.toString(),
          item.quantity, // Số lượng dương = Nhập lại kho
          InventoryType.RETURN,
          `Khách hủy đơn #${orderId}`,
          actor,
          orderId.toString(),
        );
      }
    }

    return {
      oldData: oldOrder,
      newData: newOrder,
    };
  }

  /**
   * ADMIN HỦY ĐƠN (Force Cancel)
   * Dùng khi hết hàng hoặc khách bom hàng.
   * Hoàn kho.
   */
  async adminCancelOrder(orderId: string, actor: any) {
    const oldOrder = await this.orderModel.findById(orderId).lean();
    if (!oldOrder) throw new BadRequestException('Đơn hàng không tồn tại');

    // Admin quyền lực hơn, có thể hủy cả đơn đang Shipping (trường hợp shipper báo khách bom hàng)
    if (oldOrder.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Đơn hàng đã hoàn thành, không thể hủy.');
    }

    const newOrder = await this.orderModel.findByIdAndUpdate(
      orderId,
      {
        status: OrderStatus.CANCELLED,
        cancelReason: 'Admin hủy đơn',
        $push: {
          history: {
            status: OrderStatus.CANCELLED,
            updatedBy: actor.userId,
            timestamp: new Date(),
            note: 'Admin hủy đơn',
          },
        },
      },
      { new: true },
    );

    // Hoàn kho
    if (oldOrder.items) {
      for (const item of oldOrder.items) {
        await this.inventoryService.adjustStock(
          item.productId.toString(),
          item.quantity,
          InventoryType.ADJUST, // Dùng ADJUST hoặc RETURN đều được
          `Admin hủy đơn #${orderId}`,
          actor,
          orderId.toString(),
        );
      }
    }

    return {
      oldData: oldOrder,
      newData: newOrder,
    };
  }

  // Lấy lịch sử mua hàng của 1 user (Admin xem profile khách)
  async getAllOrdersByUserId(userId: string) {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(id: string, paymentStatus: string, actor: any) {
    const oldOrder = await this.orderModel.findById(id).lean();
    if (!oldOrder) throw new BadRequestException('Đơn hàng không tồn tại');

    const newOrder = await this.orderModel.findByIdAndUpdate(
      id,
      { paymentStatus: paymentStatus },
      { new: true },
    );

    return {
      oldData: oldOrder,
      newData: newOrder,
    };
  }
}
