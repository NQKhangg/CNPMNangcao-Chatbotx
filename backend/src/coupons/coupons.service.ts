import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Coupon, CouponDocument } from './entities/coupon.entity';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
  ) {}

  /**
   * Tạo mã mới
   */
  async create(createCouponDto: CreateCouponDto) {
    // 1. Chuẩn hóa mã về chữ hoa TRƯỚC KHI kiểm tra
    const normalizedCode = createCouponDto.code.trim().toUpperCase();

    // 2. Kiểm tra trùng mã (Chỉ check những mã chưa bị xóa)
    const exists = await this.couponModel.findOne({
      code: normalizedCode,
      isDeleted: false,
    });

    if (exists) {
      throw new BadRequestException(`Mã giảm giá ${normalizedCode} đã tồn tại`);
    }

    // 3. Tạo mới
    return this.couponModel.create({
      ...createCouponDto,
      code: normalizedCode, // Lưu mã đã chuẩn hóa
    });
  }

  /**
   * Lấy danh sách
   * page Trang hiện tại
   * limit Số lượng mỗi trang
   * keyword Từ khóa tìm kiếm
   */
  async findAll(page: number, limit: number, keyword: string) {
    // 1. Tính toán skip
    const skip = (page - 1) * limit;

    // 2. Tạo bộ lọc
    const filter: any = { isDeleted: false };

    if (keyword && keyword.trim() !== '') {
      // Tìm kiếm theo Mã giảm giá (Code) - Không phân biệt hoa thường
      filter.code = { $regex: keyword.trim(), $options: 'i' };
    }

    // 3. Query song song (Lấy data & Đếm tổng)
    const [data, total] = await Promise.all([
      this.couponModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .exec(),
      this.couponModel.countDocuments(filter),
    ]);

    // 4. Trả về
    return {
      data,
      total,
      page: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy danh sách mã giảm giá hợp lệ cho khách hàng
   */
  async findActiveCoupons() {
    const now = new Date();
    return this.couponModel
      .find({
        isDeleted: false,
        isActive: true,
        // 1. Kiểm tra hạn sử dụng
        expiryDate: { $gte: now },

        // 2. Ẩn mã hết lượt
        // Lấy những mã mà usageCount (đã dùng) < usageLimit (giới hạn)
        $expr: { $lt: ['$usageCount', '$usageLimit'] },
      })
      .sort({ expiryDate: 1 }) // Mã nào sắp hết hạn hiện lên đầu
      .select('-usageCount -usersUsed') // Ẩn thông tin nhạy cảm
      .exec();
  }

  /**
   * Lấy chi tiết 1 mã
   */
  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('ID không hợp lệ');
    const coupon = await this.couponModel.findById(id);
    if (!coupon) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return coupon;
  }

  /**
   * Cập nhật mã
   * Trả về { oldData, newData } để phục vụ Audit Log
   */
  async update(id: string, updateCouponDto: UpdateCouponDto) {
    if (!isValidObjectId(id)) throw new BadRequestException('ID không hợp lệ');

    const oldData = await this.couponModel.findById(id).lean();
    if (!oldData) throw new NotFoundException('Không tìm thấy mã giảm giá');

    // Nếu có update code thì phải uppercase
    if (updateCouponDto.code) {
      updateCouponDto.code = updateCouponDto.code.toUpperCase();
    }

    const newData = await this.couponModel.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        new: true,
      },
    );

    return {
      oldData: oldData,
      newData: newData,
    };
  }

  /**
   * Cập nhật trạng thái
   */
  async updateActive(id: string, isActive: boolean) {
    if (!isValidObjectId(id)) throw new BadRequestException('ID không hợp lệ');

    const oldData = await this.couponModel.findById(id).lean();
    if (!oldData) throw new NotFoundException('Không tìm thấy mã giảm giá');

    const newData = await this.couponModel.findByIdAndUpdate(
      id,
      { isActive: isActive },
      {
        new: true,
      },
    );

    return {
      oldData: oldData,
      newData: newData,
    };
  }

  /**
   * Xóa mã
   * Trả về document đã xóa để Audit Log ghi lại thông tin
   */
  async remove(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('ID không hợp lệ');
    const deleted = await this.couponModel.findByIdAndUpdate(id, {
      isActive: false,
      isDeleted: true,
    });
    if (!deleted) throw new NotFoundException('Không tìm thấy mã để xóa');
    return deleted; // Trả về để làm oldValue trong log
  }

  /**
   * Tăng số lượt sử dụng lên 1
   * Dùng khi khách hàng đặt đơn hàng thành công
   */
  async incrementUsage(code: string) {
    await this.couponModel.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
    );
  }

  /**
   * Kiểm tra tính hợp lệ của mã (Validation Logic)
   * 1. Có tồn tại và Active không?
   * 2. Có hết hạn chưa?
   * 3. Có hết lượt dùng chưa?
   */
  async validateCoupon(code: string) {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true, // Phải đang kích hoạt
      isDeleted: false,
    });

    if (!coupon)
      throw new BadRequestException(
        'Mã giảm giá không tồn tại hoặc đã bị khóa',
      );

    // Check ngày hết hạn
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    // Check giới hạn lượt dùng (Nếu usageLimit = 0 là không giới hạn)
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    return coupon;
  }
}
