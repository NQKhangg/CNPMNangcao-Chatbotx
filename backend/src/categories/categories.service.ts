import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private catModel: Model<CategoryDocument>,
  ) {}

  /**
   * Tạo mới danh mục
   * data dữ liệu từ DTO
   */
  async create(createCategoryDto: CreateCategoryDto) {
    return this.catModel.create(createCategoryDto);
  }

  /**
   * Lấy danh sách danh mục (Public/Customer)
   * Chỉ lấy danh mục đang hoạt động (isActive: true)
   * Sắp xếp: Mới nhất lên đầu
   */
  async findAll() {
    return this.catModel
      .find({ isActive: true }) // Chỉ hiện cái active
      .sort({ createdAt: -1, _id: -1 }) // Sort giảm dần theo thời gian tạo
      .exec();
  }

  /**
   * Lấy danh sách danh mục (Admin Dashboard)
   */
  async findAllAdmin(page: number, limit: number, keyword: string) {
    // Tính số lượng bản ghi cần bỏ qua (cho phân trang)
    const skip = (page - 1) * limit;

    // 1. Tạo bộ lọc cơ bản: Chỉ lấy những cái CHƯA bị xóa mềm
    const filter: any = { isDeleted: false };

    // 2. Logic tìm kiếm (Search)
    if (keyword && keyword.trim() !== '') {
      // Tạo Regex không phân biệt hoa thường ('i')
      const regex = new RegExp(keyword.trim(), 'i');

      // Tìm kiếm trong Tên HOẶC Slug HOẶC Mô tả
      filter.$or = [{ name: regex }, { slug: regex }, { description: regex }];
    }

    // 3. Tối ưu hiệu năng: Chạy song song 2 câu lệnh (Lấy data và Đếm tổng)
    // Thay vì await từng cái, ta dùng Promise.all để giảm thời gian chờ
    const [data, total] = await Promise.all([
      this.catModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip) // Bỏ qua n phần tử
        .limit(limit) // Lấy m phần tử
        .exec(),
      this.catModel.countDocuments(filter), // Đếm tổng số lượng thỏa mãn filter
    ]);

    // 4. Trả về cấu trúc chuẩn cho Frontend (dùng cho component Pagination)
    return {
      data, // Danh sách category
      total, // Tổng số bản ghi tìm thấy
      page, // Trang hiện tại
      lastPage: Math.ceil(total / limit), // Tính tổng số trang
    };
  }

  /**
   * Cập nhật thông tin danh mục
   * Trả về { oldData, newData } để phục vụ ghi Audit Log
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Lấy dữ liệu cũ để lưu log (trước khi sửa)
    const oldCat = await this.catModel.findById(id).lean(); // .lean() giúp query nhanh hơn, trả về plain object

    // Thực hiện update và lấy dữ liệu mới
    const newCat = await this.catModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      {
        new: true,
      },
    );

    return {
      oldData: oldCat,
      newData: newCat,
    };
  }

  /**
   * Cập nhật nhanh trạng thái Active/Inactive
   * Trả về cặp old/new để ghi log
   */
  async updateActive(id: string, isActive: boolean) {
    const oldCat = await this.catModel.findById(id).lean();

    const newCat = await this.catModel.findByIdAndUpdate(
      id,
      { isActive: isActive },
      {
        new: true,
      },
    );

    return {
      oldData: oldCat,
      newData: newCat,
    };
  }

  /**
   * Xóa mềm (Soft Delete)
   * Không xóa khỏi DB, chỉ đánh dấu isDeleted = true
   * Set isActive = false để ẩn khỏi trang chủ
   */
  async remove(id: string) {
    return this.catModel.findByIdAndUpdate(id, {
      isActive: false, // Tắt hiển thị
      isDeleted: true, // Đánh dấu đã xóa
    });
  }
}
