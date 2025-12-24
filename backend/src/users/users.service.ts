import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => RolesService))
    private rolesService: RolesService, // Dùng để lấy Role
    private auditLogsService: AuditLogsService,
  ) {}

  /**
   * Helper query cơ bản: Chỉ lấy user chưa bị xóa mềm
   */
  private baseQuery() {
    return this.userModel.find({ isDeleted: false });
  }

  /**
   * Tìm User bằng Email (Dùng cho module Auth - Login)
   * select('+password'): Lấy password hash ra để so sánh
   * populate('roleId'): Lấy thông tin role để check quyền
   */
  async findByEmail(email: string) {
    return this.baseQuery()
      .findOne({ email })
      .select('+password')
      .populate('roleId')
      .exec();
  }

  /**
   * Tìm User bằng ID (Xem profile)
   * Populate cả Role và Department (nếu là nhân viên)
   */
  async findById(id: string) {
    return this.baseQuery()
      .findOne({ _id: id })
      .populate('roleId')
      .populate('department')
      .exec();
  }

  /**
   * Đăng ký tài khoản Khách hàng (Customer Registration)
   * Logic: Nếu không gửi roleId, tự động gán role 'Customer'.
   * Nếu role 'Customer' chưa tồn tại trong DB, tự tạo mới.
   */
  async createCustomer(userData: any) {
    let roleId = userData.roleId;

    // 1. Xử lý Role mặc định
    if (!roleId) {
      const defaultRole = await this.rolesService.getRoleByName('Customer');
      if (!defaultRole) {
        // Fallback: Tự tạo Role nếu chưa có (Dev environment)
        const newRole = await this.rolesService.createRole({
          name: 'Customer',
          permissions: [],
        });
        roleId = newRole._id;
      } else {
        roleId = defaultRole._id;
      }
    }

    // 3. Tạo User mới
    const newUser = new this.userModel({
      ...userData,
      roleId: roleId, // Liên kết với bảng Role
    });

    return newUser.save();
  }

  /**
   * Lấy danh sách tất cả User (Admin Dashboard - Debug)
   */
  async findAll() {
    return this.userModel
      .find({ isDeleted: { $ne: true } })
      .select('-password') // Không trả về mật khẩu
      .populate('roleId')
      .populate('department')
      .exec();
  }

  /**
   * Đổi Role cho User
   * - Dùng khi thăng chức nhân viên hoặc phân quyền admin
   */
  async updateRole(userId: string, roleId: string, actor: any) {
    const oldRole = this.userModel.findById(userId); // (Lấy dữ liệu cũ để log nếu cần)
    const newRole = this.userModel.findByIdAndUpdate(
      userId,
      { roleId: roleId },
      { new: true },
    );

    return {
      oldData: oldRole,
      newData: newRole,
    };
  }

  /**
   * Khóa/Mở khóa tài khoản (Active/Inactive)
   * Trả về { oldData, newData } để Audit Log ghi nhận sự thay đổi
   */
  async updateStatus(userId: string, isActive: boolean, actor: any) {
    const oldData = await this.userModel.findById(userId).lean();
    const newData = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: isActive },
      { new: true },
    );

    return {
      oldData: oldData,
      newData: newData,
    };
  }

  /**
   * Lấy danh sách Khách hàng (Customers Only)
   * Logic: Lọc theo Role = 'Customer'
   */
  async findAllCustomers(
    page: number = 1,
    limit: number = 10,
    keyword?: string,
  ) {
    // 1. Tìm ID của role Customer
    const customerRole = await this.rolesService.getRoleByName('Customer');
    if (!customerRole) return { data: [], total: 0, page, lastPage: 0 };

    const filter: any = {
      isDeleted: false,
      roleId: customerRole._id, // Chỉ lấy customer
    };

    // 2. Logic tìm kiếm (Search)
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
      if (isValidObjectId(keyword)) {
        filter.$or.push({ _id: keyword });
      }
    }

    const skip = (page - 1) * limit;

    // 3. Query song song
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('roleId')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy danh sách Nhân viên (Staff Only)
   * Logic: Lấy tất cả user KHÔNG PHẢI là Customer
   */
  async findAllStaff(page: number, limit: number, keyword?: string) {
    const skip = (page - 1) * limit;
    const customerRole = await this.rolesService.getRoleByName('Customer');

    const filter: any = {
      isDeleted: false,
    };

    // Loại trừ Customer ra khỏi danh sách
    if (customerRole) {
      filter.roleId = { $ne: customerRole._id };
    }

    if (keyword && keyword.trim().length > 0) {
      const regex = new RegExp(keyword.trim(), 'i');
      const orArray: any[] = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { employeeCode: regex }, // Tìm theo mã nhân viên
      ];
      if (isValidObjectId(keyword)) orArray.push({ _id: keyword });
      filter.$or = orArray;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('roleId')
        .populate('department', '_id name')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Tạo Nhân viên mới (Admin Create Staff)
   */
  async createStaff(userData: any, actor: any) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newStaff = this.userModel.create({
      ...userData,
      password: hashedPassword,
      // Đảm bảo roleId và department là ObjectId hợp lệ
      roleId: new Types.ObjectId(userData.roleId),
      department: userData.department
        ? new Types.ObjectId(userData.department)
        : undefined,
    });
    return newStaff;
  }

  /**
   * Lấy danh sách Quyền của User (Dùng cho Authorization Guard)
   * Flow: User -> Role -> Permissions
   */
  async getUserPermissions(userId: string) {
    const user = await this.userModel.findById(userId).populate('roleId');

    if (!user) throw new BadRequestException('User not found');

    const role = user.roleId as any; // Cast type để lấy permissions
    if (!role) throw new BadRequestException('Role not found for user');

    return role.permissions;
  }

  /**
   * Cập nhật thông tin User (Profile Update)
   * Loại bỏ các trường nhạy cảm (password, roleId) khỏi data update để bảo mật
   */
  async update(id: string, data: any, actor: any) {
    // Destructuring để loại bỏ field không cho phép sửa trực tiếp
    const { password, roleId, refreshToken, ...safeData } = data;

    // Nếu có department, chuyển sang ObjectId
    if (safeData.department && isValidObjectId(safeData.department)) {
      safeData.department = new Types.ObjectId(safeData.department);
    }

    const oldUserValue = await this.userModel.findById(id).lean();

    const newUserValue = await this.userModel
      .findByIdAndUpdate(id, safeData, { new: true })
      .select('-password -refreshToken')
      .populate('roleId')
      .populate('department')
      .exec();

    return {
      oldData: oldUserValue,
      newData: newUserValue,
    };
  }

  /**
   * Xóa mềm (Soft Delete)
   */
  async remove(id: string, actor: any) {
    const user = await this.userModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    return user;
  }

  // =================================================================
  // CÁC HÀM WISHLIST (YÊU THÍCH)
  // =================================================================

  /**
   * Toggle Wishlist (Thích/Bỏ thích)
   * - Dùng $addToSet để thêm (không trùng)
   * - Dùng $pull để xóa
   */
  async toggleWishlist(userId: string, productId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Check tồn tại trong mảng wishlist
    const isExist = user.wishlist.some((id) => id.toString() === productId);

    if (isExist) {
      await this.userModel.findByIdAndUpdate(userId, {
        $pull: { wishlist: productId },
      });
      return { message: 'Đã bỏ yêu thích sản phẩm', status: 'removed' };
    } else {
      await this.userModel.findByIdAndUpdate(userId, {
        $addToSet: { wishlist: productId }, // $addToSet đảm bảo không bị duplicate
      });
      return { message: 'Đã thêm vào yêu thích', status: 'added' };
    }
  }

  /**
   * Lấy danh sách Wishlist
   */
  async getWishlist(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const user = await this.userModel
      .findById(userId)
      .populate('wishlist') // Populate full product data
      .exec();

    if (!user) return { data: [], total: 0, page, lastPage: 1 };

    const wishlist = user.wishlist || [];
    const total = wishlist.length;

    // Cắt mảng (Pagination in Memory)
    const data = wishlist.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
