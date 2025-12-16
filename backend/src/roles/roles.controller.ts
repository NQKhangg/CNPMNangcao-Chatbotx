import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dtos/create-role.dto';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { Resource } from './enums/resource.enum';
import { Action } from './enums/action.enum';
import { Audit } from 'src/common/decorators/audit.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UpdateRoleDto } from './dtos/update-role.dto';

/**
 * Controller Quản lý Vai trò (Role)
 */
@Controller('roles')
@UseInterceptors(AuditInterceptor) // Ghi log toàn bộ thao tác trong controller
@UseGuards(AuthenticationGuard) // Áp dụng Guard cho TOÀN BỘ controller
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Tạo Role mới (VD: Tạo role "Kế toán trưởng")
   */
  @Post()
  @Permissions([{ resource: Resource.roles, actions: [Action.create] }]) // Check quyền
  @Audit(Resource.roles, Action.create) // Ghi Audit Log: "User A tạo Role B"
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  /**
   * Lấy danh sách tất cả Role
   */
  @Get()
  @Permissions([{ resource: Resource.roles, actions: [Action.read] }])
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  // Help
  @Get('resource')
  async getResource() {
    return this.rolesService.getResource();
  }
  @Get('action')
  async getAction() {
    return this.rolesService.getAction();
  }

  /**
   * Lấy chi tiết 1 Role
   */
  @Get(':id')
  @Permissions([{ resource: Resource.roles, actions: [Action.read] }])
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  /**
   * Cập nhật Role (Sửa tên hoặc sửa danh sách quyền)
   */
  @Put(':id')
  @Permissions([{ resource: Resource.roles, actions: [Action.update] }])
  @Audit(Resource.roles, Action.update) // Ghi log update
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, updateRoleDto);
  }

  /**
   * Xóa Role (Soft Delete)
   */
  @Delete(':id')
  @Permissions([{ resource: Resource.roles, actions: [Action.delete] }])
  @Audit(Resource.roles, Action.delete) // Ghi log delete
  async deleteRole(@Param('id') id: string) {
    console.log('Xóa Role với ID:', id);
    return this.rolesService.deleteRole(id);
  }
}
