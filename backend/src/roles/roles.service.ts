import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './entities/role.schema';
import { Model } from 'mongoose';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { Resource } from './enums/resource.enum';
import { Action } from './enums/action.enum';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private RoleModel: Model<Role>) {}

  /**
   * Tạo Role mới
   */
  async createRole(role: CreateRoleDto) {
    // Validate: Kiểm tra trùng tên Role trước khi tạo
    const exist = await this.RoleModel.findOne({
      name: role.name,
      isDeleted: false,
    });
    if (exist) {
      throw new BadRequestException(`Role '${role.name}' đã tồn tại`);
    }

    return this.RoleModel.create(role);
  }

  // Help
  async getResource() {
    return Resource;
  }
  async getAction() {
    return Action;
  }

  /**
   * Lấy danh sách
   */
  async getAllRoles() {
    return this.RoleModel.find({ isDeleted: false }).exec();
  }

  /**
   * Lấy chi tiết theo ID
   */
  async getRoleById(roleId: string) {
    return this.RoleModel.findOne({ _id: roleId, isDeleted: false });
  }

  /**
   * Helper: Tìm role theo tên (Dùng cho UsersService khi tạo user mới)
   */
  async getRoleByName(name: string) {
    return this.RoleModel.findOne({ name, isDeleted: false });
  }

  /**
   * Cập nhật Role
   * Trả về { oldData, newData } để AuditInterceptor ghi log sự thay đổi
   */
  async updateRole(roleId: string, updateRoleDto: UpdateRoleDto) {
    const oldData = await this.RoleModel.findById(roleId).lean();

    const newData = await this.RoleModel.findByIdAndUpdate(
      roleId,
      updateRoleDto,
      { new: true }, // Trả về data mới sau update
    );

    return {
      oldData,
      newData,
    };
  }

  /**
   * Xóa mềm Role (Soft Delete)
   */
  async deleteRole(roleId: string) {
    const deletedRole = await this.RoleModel.findByIdAndUpdate(roleId, {
      isDeleted: true,
    });
    return deletedRole;
  }
}
