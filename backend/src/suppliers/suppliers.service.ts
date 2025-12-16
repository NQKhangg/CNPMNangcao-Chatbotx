import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Supplier, SupplierDocument } from './entities/supplier.entity';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  // Tạo mới
  async create(createSupplierDto: CreateSupplierDto) {
    return this.supplierModel.create(createSupplierDto);
  }

  /**
   * Lấy danh sách với bộ lọc
   */
  async findAll(page: number, limit: number, keyword?: string) {
    // 1. Tính toán vị trí bắt đầu (Pagination Skip)
    const skip = (page - 1) * limit;

    // 2. Bộ lọc mặc định: Chỉ lấy bản ghi chưa bị xóa mềm
    const filter: any = {
      isDeleted: false,
    };

    // 3. Logic tìm kiếm (Search)
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword, 'i'); // 'i' = Không phân biệt hoa thường

      // Tìm kiếm keyword trong các trường sau:
      filter.$or = [
        { name: regex }, // Tên công ty
        { contactPerson: regex }, // Người liên hệ
        { phone: regex }, // Số điện thoại
        { email: regex }, // Email
        { address: regex }, // Địa chỉ
        { taxCode: regex }, // Mã số thuế
      ];

      // Nếu keyword là ID hợp lệ -> Thêm điều kiện tìm theo ID
      if (isValidObjectId(keyword)) {
        filter.$or.push({ _id: keyword });
      }
    }

    // 4. Chạy Query song song (Tối ưu hiệu năng)
    const [data, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierModel.countDocuments(filter), // Đếm tổng số lượng
    ]);

    // 5. Trả về format chuẩn phân trang
    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Lấy chi tiết
  async findOne(id: string) {
    return this.supplierModel.findById(id).exec();
  }

  /**
   * Cập nhật thông tin
   */
  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const oldData = await this.supplierModel.findById(id).lean();
    const newData = await this.supplierModel.findByIdAndUpdate(
      id,
      updateSupplierDto,
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
   * Xóa mềm (Soft Delete)
   */
  async remove(id: string) {
    return this.supplierModel.findByIdAndUpdate(id, { isDeleted: true });
  }
}
