import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Department, DepartmentDocument } from './entities/department.entity';
import { isValidObjectId, Model } from 'mongoose';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Tạo mới
   */
  async create(createDepartmentDto: CreateDepartmentDto) {
    // 1. Kiểm tra xem tên đã tồn tại chưa
    const exists = await this.deptModel.findOne({
      name: createDepartmentDto.name,
      isDeleted: false,
    });

    if (exists) {
      throw new BadRequestException(
        `Phòng ban "${createDepartmentDto.name}" đã tồn tại.`,
      );
    }
    return this.deptModel.create(createDepartmentDto);
  }

  /**
   * Lấy danh sách có Phân trang & Tìm kiếm
   * Logic tối ưu hiệu năng bằng Promise.all
   */
  async findAll(page: number, limit: number, keyword?: string) {
    // 1. Tính số lượng bản ghi cần bỏ qua (Skip)
    const skip = (page - 1) * limit;

    // 2. Filter mặc định: Chỉ lấy bản ghi chưa bị xóa (Soft Delete)
    const filter: any = {
      isDeleted: false,
    };

    // 3. Xây dựng bộ lọc tìm kiếm (Search)
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword, 'i'); // 'i': Không phân biệt hoa thường

      // Tìm trong Tên hoặc Mô tả
      filter.$or = [{ name: regex }, { description: regex }];

      // Nếu keyword là ID hợp lệ -> Tìm chính xác theo ID phòng ban hoặc ID trưởng phòng
      if (isValidObjectId(keyword)) {
        filter.$or.push({ _id: keyword });
        filter.$or.push({ manager: keyword });
      }
    }

    // 4. Thực thi Query song song (Parallel Execution)
    // Giúp giảm thời gian chờ so với việc await lần lượt
    const [data, total] = await Promise.all([
      this.deptModel
        .find(filter)
        .populate('manager', 'name email avatar') // Join bảng User để lấy thông tin Trưởng phòng
        .sort({ createdAt: -1, _id: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .exec(),
      this.deptModel.countDocuments(filter), // Đếm tổng số lượng thỏa mãn điều kiện
    ]);

    // 5. Trả về kết quả chuẩn
    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Xem chi tiết 1 phòng ban
   */
  async findOne(id: string) {
    return this.deptModel
      .findById(id)
      .populate('manager', 'name email avatar')
      .exec();
  }

  /**
   * Cập nhật trạng thái
   * { new: true } -> Trả về dữ liệu MỚI sau khi update (để Audit Log ghi nhận giá trị mới)
   */
  async updateActive(id: string, isActive: boolean) {
    const oldData = await this.deptModel.findById(id).lean();
    const newData = await this.deptModel.findByIdAndUpdate(
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
   * Cập nhật thông tin
   */
  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const oldData = await this.deptModel.findById(id).lean();
    const newData = await this.deptModel.findByIdAndUpdate(
      id,
      updateDepartmentDto,
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
   * Chỉ đánh dấu isDeleted = true, dữ liệu vẫn còn trong DB
   */
  async remove(id: string) {
    return this.deptModel.findByIdAndUpdate(id, { isDeleted: true });
  }
}
