import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';
import { isValidObjectId, Model } from 'mongoose';
import { CreateAuditLogDto } from './dtos/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private logModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Ghi lại nhật ký
   * Được gọi từ Interceptor
   */
  async log(data: CreateAuditLogDto) {
    return this.logModel.create(data);
  }

  /**
   * Lấy danh sách Log với bộ lọc nâng cao
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    keyword: string = '',
    fromDate?: string,
    toDate?: string,
  ) {
    // 1. Tính toán phân trang
    const skip = (page - 1) * limit;

    // 2. Khởi tạo bộ lọc cơ bản
    const filter: any = {};

    // --- LOGIC LỌC THEO THỜI GIAN  ---
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        // $gte: Lớn hơn hoặc bằng ngày bắt đầu
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        // $lte: Nhỏ hơn hoặc bằng ngày kết thúc (Set về cuối ngày để chính xác)
        const date = new Date(toDate);
        date.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = date;
      }
    }

    // --- LOGIC TÌM KIẾM TỪ KHÓA (KEYWORD) ---
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i');

      const orConditions: any[] = [
        { resource: regex }, // Tìm theo tên Resource (Product, User...)
        { ip: regex }, // Tìm theo IP
        { action: regex },
      ];

      // Nếu keyword là ID hợp lệ (MongoDB ObjectId)
      if (isValidObjectId(keyword)) {
        orConditions.push(
          { _id: keyword }, // ID của Log
          { resourceId: keyword }, // ID của đối tượng bị sửa
          { performedBy: keyword }, // ID người thực hiện
        );
      }

      // Gộp điều kiện keyword vào filter chính bằng toán tử $and
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: orConditions }];
        delete filter.$or;
      } else {
        filter.$or = orConditions;
      }
    }

    // 3. Thực hiện Query song song (Lấy data & Đếm tổng) để tối ưu hiệu năng
    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .populate('performedBy', 'name email role avatar') // Lấy thêm avatar nếu cần hiển thị
        .sort({ createdAt: -1, _id: -1 }) // Sắp xếp mới nhất trước
        .skip(skip)
        .limit(limit)
        .lean() // trả về object JS thuần
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

  /**
   * Xem chi tiết 1 log
   */
  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('ID không hợp lệ');

    const log = await this.logModel
      .findById(id)
      .populate('performedBy', 'name email role avatar')
      .exec();

    if (!log) throw new NotFoundException('Không tìm thấy nhật ký');
    return log;
  }
}
