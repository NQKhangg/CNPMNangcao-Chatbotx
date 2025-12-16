import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Post,
  Req,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Audit } from 'src/common/decorators/audit.decorator';

/**
 * Controller Quản lý Người dùng (Users)
 * @UseGuards(AuthenticationGuard): Áp dụng bắt buộc đăng nhập cho TẤT CẢ các API trong controller này.
 * @UseInterceptors(AuditInterceptor): Tự động lắng nghe và ghi log hành động (nếu có @Audit).
 */
@Controller('users')
@UseGuards(AuthenticationGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lấy danh sách toàn bộ User (Dành cho Admin Dashboard)
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard) // Kích hoạt check quyền
  @Permissions([{ resource: Resource.users, actions: [Action.read] }]) // Yêu cầu quyền
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Tạo nhân viên mới (Create Staff)
   */
  @Post('staff')
  @UseGuards(AuthenticationGuard, AuthorizationGuard) // Kích hoạt check quyền
  @Permissions([{ resource: Resource.users, actions: [Action.create] }]) // Yêu cầu quyền
  @Audit(Resource.users, Action.create) // Đánh dấu để ghi log
  createStaff(@Body() body: any, @Req() req) {
    // req.user: Thông tin người đang thực hiện hành động (Admin)
    return this.usersService.createStaff(body, req.user);
  }

  /**
   * User tự cập nhật hồ sơ cá nhân (My Profile)
   * Logic bảo mật: Không truyền ID qua URL.
   * Lấy ID từ `req.userId` (được giải mã từ Token) -> Đảm bảo chỉ sửa được chính mình.
   */
  @Put('profile')
  @UseGuards(AuthenticationGuard)
  @Audit(Resource.users, Action.update)
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    // req.userId được AuthenticationGuard gắn vào request sau khi verify token
    return this.usersService.update(req.userId, updateProfileDto, req.user);
  }

  /**
   * Xem hồ sơ cá nhân (My Profile)
   * Logic bảo mật: Lấy thông tin dựa trên Token của người đang gọi API.
   */
  @Get('profile')
  @UseGuards(AuthenticationGuard)
  getProfile(@Req() req) {
    return this.usersService.findById(req.userId);
  }

  /**
   * Phân quyền: Đổi Role cho User (Dành cho Admin)
   */
  @Put(':id/role')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.update] }])
  @Audit(Resource.users, Action.update)
  updateRole(
    @Param('id') id: string, // ID của user bị sửa
    @Body('role') roleId: string, // ID của Role mới
    @Req() req,
  ) {
    return this.usersService.updateRole(id, roleId, req.user);
  }

  /**
   * Lấy danh sách Khách hàng (Customers)
   * Dùng cho trang Quản lý khách hàng.
   */
  @Get('customers')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.read] }])
  getCustomers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.usersService.findAllCustomers(page, limit, keyword);
  }

  /**
   * Lấy danh sách Nhân viên (Staffs)
   * Dùng cho trang Quản lý nhân sự.
   */
  @Get('staffs')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.read] }])
  getStaffs(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.usersService.findAllStaff(page, limit, keyword);
  }

  // =================================================================
  // CÁC CHỨC NĂNG E-COMMERCE (WISHLIST)
  // =================================================================

  /**
   * Thêm/Xóa sản phẩm khỏi danh sách yêu thích (Toggle)
   */
  @UseGuards(AuthenticationGuard)
  @Post('wishlist/:productId')
  toggleWishlist(@Param('productId') productId: string, @Req() req: any) {
    return this.usersService.toggleWishlist(req.user.userId, productId);
  }

  /**
   * Xem danh sách yêu thích của tôi
   */
  @UseGuards(AuthenticationGuard)
  @Get('wishlist')
  getWishlist(
    @Req() req: any,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.usersService.getWishlist(req.user.userId, page, limit);
  }

  // =================================================================
  // CÁC CHỨC NĂNG QUẢN TRỊ (ADMIN)
  // =================================================================

  /**
   * Khóa/Mở khóa tài khoản (Active/Inactive)
   * Dùng khi nhân viên nghỉ việc hoặc user vi phạm chính sách.
   */
  @Patch(':id/status')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.update] }])
  @Audit(Resource.users, Action.update)
  updateStatus(
    @Param('id') id: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
    @Req() req,
  ) {
    console.log(`Update user ${id} status to ${isActive}`);
    return this.usersService.updateStatus(id, isActive, req.user);
  }

  /**
   * Admin xem chi tiết 1 user bất kỳ
   */
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.read] }])
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * Admin cập nhật thông tin user bất kỳ
   * VD: Admin sửa lại số điện thoại cho nhân viên.
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.update] }])
  @Audit(Resource.users, Action.update)
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    return this.usersService.update(id, updateData, req.user);
  }

  /**
   * Xóa user (Soft Delete)
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.users, actions: [Action.delete] }])
  @Audit(Resource.users, Action.delete)
  remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user);
  }
}
