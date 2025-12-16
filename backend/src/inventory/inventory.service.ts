import { BadRequestException, Injectable } from '@nestjs/common';
import { Product, ProductDocument } from 'src/products/entities/product.entity';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  InventoryLog,
  InventoryLogDocument,
} from './entities/inventory.entity';
import { InventoryType } from './enums/inventory_type.enum';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryLog.name)
    private logModel: Model<InventoryLogDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Hàm Core: Điều chỉnh tồn kho (Dùng chung cho cả Import, Sale, Return, Damaged)
   * productId ID sản phẩm
   * quantity Số lượng thay đổi (Dương = Tăng, Âm = Giảm)
   * type Loại hành động (IMPORT, SALE...)
   * reason Lý do/Ghi chú
   * actor Người thực hiện (User Object từ request)
   * orderId (Tùy chọn) ID đơn hàng
   * supplierId (Tùy chọn) ID nhà cung cấp
   * referenceCode (Tùy chọn) Mã phiếu
   */
  async adjustStock(
    productId: string,
    quantity: number,
    type: InventoryType,
    reason: string,
    actor: any,
    orderId?: string,
    supplierId?: string,
    referenceCode?: string,
  ) {
    // 1. Tìm sản phẩm
    const product = await this.productModel.findById(productId);
    if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

    // 2. Tính toán tồn kho mới
    const newStock = product.stock + quantity;

    // Kiểm tra: Không cho phép tồn kho bị âm (Trừ trường hợp cho phép bán âm - Backorder)
    if (newStock < 0) {
      throw new BadRequestException(
        `Không đủ hàng để xuất (Tồn hiện tại: ${product.stock}, Yêu cầu xuất: ${Math.abs(quantity)})`,
      );
    }

    // 3. Cập nhật thông tin sản phẩm
    product.stock = newStock;

    // Logic phụ: Cập nhật số lượng đã bán (Sold)
    if (type === InventoryType.SALE) {
      // Nếu là BÁN: quantity là số âm -> lấy trị tuyệt đối để cộng vào sold
      product.sold = (product.sold || 0) + Math.abs(quantity);
    } else if (type === InventoryType.RETURN) {
      // Nếu là TRẢ HÀNG: quantity là số dương -> trừ bớt khỏi sold
      product.sold = Math.max(0, (product.sold || 0) - quantity);
    }

    // Lưu sản phẩm
    await product.save();

    // 4. Sinh mã phiếu tự động nếu không có (VD: IMPORT-17092832...)
    const code = referenceCode || `${type}-${Date.now()}`;

    // 5. Ghi Log biến động kho (QUAN TRỌNG)
    // Lưu snapshot các thông tin tại thời điểm này
    await this.logModel.create({
      productId,
      type,
      change: quantity,
      currentStock: newStock,
      reason,
      orderId: orderId || null,
      supplierId: supplierId || null,
      referenceCode: code,
      actor: {
        userId: actor.userId || 'System',
        email: actor.email || 'System',
        role: actor.role || 'System',
      },
    });

    return product;
  }

  /**
   * Lấy danh sách lịch sử kho (Cho trang Admin/History)
   */
  async getAllHistory(page: number, limit: number, keyword: string) {
    // 1. Tính toán phân trang
    const skip = (page - 1) * limit;

    // 2. Tạo bộ lọc
    const filter: any = {};

    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i'); // Case-insensitive

      const orConditions: any[] = [
        { referenceCode: regex }, // Tìm theo mã phiếu
        { reason: regex }, // Tìm theo lý do
        { type: regex }, // Tìm theo loại
        { 'actor.email': regex }, // Tìm theo email người làm
      ];

      // Nếu keyword là ID hợp lệ -> Tìm theo các trường liên kết
      if (isValidObjectId(keyword)) {
        orConditions.push(
          { _id: keyword },
          { productId: keyword },
          { orderId: keyword },
          { supplierId: keyword },
        );
      }

      filter.$or = orConditions;
    }

    // 3. Query song song (Lấy Data + Đếm tổng)
    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .populate('productId', 'name sku image') // Lấy thông tin SP
        .populate('supplierId', 'name email phone') // Lấy thông tin NCC
        .populate('orderId', '_id totalAmount status') // Lấy thông tin Đơn hàng
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments(filter),
    ]);

    // 4. Trả về kết quả
    return {
      data,
      total,
      page: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Lấy lịch sử của 1 sản phẩm cụ thể (Dùng cho trang chi tiết SP)
  async getHistoryByProduct(productId: string) {
    return this.logModel
      .find({ productId })
      .sort({ createdAt: -1, _id: -1 })
      .populate('actor', 'name')
      .exec();
  }
}
