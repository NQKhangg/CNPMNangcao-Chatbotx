import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Req,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Audit } from 'src/common/decorators/audit.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from 'src/roles/enums/action.enum';

/**
 * Controller Quản lý Đơn hàng (Orders)
 * - @UseInterceptors(AuditInterceptor): Tự động ghi lại nhật ký hoạt động (Audit Log)
 */
@Controller('orders')
@UseInterceptors(AuditInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==================================================================
  // 1. NHÓM API DÀNH CHO KHÁCH HÀNG (CUSTOMER)
  // ==================================================================

  /**
   * Tạo đơn hàng mới (Checkout)
   * Yêu cầu: Phải đăng nhập (AuthenticationGuard).
   */
  @Post()
  @UseGuards(AuthenticationGuard)
  @Audit(Resource.orders, Action.create)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    // req.user lấy từ Token, đảm bảo đơn hàng gắn đúng với người mua
    return this.ordersService.create(createOrderDto, req.user);
  }

  /**
   * Lấy danh sách đơn hàng CỦA TÔI (Lịch sử mua hàng)
   * Yêu cầu: Phải đăng nhập.
   * Chỉ trả về các đơn hàng khớp với req.userId (lấy từ Token).
   */
  @Get('my-orders')
  @UseGuards(AuthenticationGuard)
  findByUser(@Req() req) {
    // console.log('User ID từ JWT:', req.userId);
    return this.ordersService.findByUser(req.userId);
  }

  /**
   * Khách hàng tự hủy đơn
   * Yêu cầu: Đăng nhập.
   * Service cần check xem đơn hàng có thuộc về user này không
   * và trạng thái có được phép hủy không (VD: Đang giao thì không được hủy).
   */
  @Put(':id/cancel')
  @UseGuards(AuthenticationGuard)
  @Audit(Resource.orders, Action.update) // Ghi log hành động hủy
  cancelOrder(@Param('id') id: string, @Req() req) {
    return this.ordersService.cancelOrder(id, req.user);
  }

  // ==================================================================
  // 2. NHÓM API DÀNH CHO QUẢN TRỊ VIÊN (ADMIN/STAFF)
  // ==================================================================

  /**
   * Lấy danh sách toàn bộ đơn hàng (Dashboard)
   * Yêu cầu: Login + Quyền READ Orders.
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.orders, actions: [Action.read] }])
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.ordersService.findAll(Number(page), Number(limit), keyword);
  }

  /**
   * Xem lịch sử đơn hàng của 1 User cụ thể (Admin soi profile khách)
   * Yêu cầu: Login.
   */
  @Get('/user/:userId')
  @UseGuards(AuthenticationGuard)
  getAllOrdersByUserId(@Param('userId') userId: string) {
    return this.ordersService.getAllOrdersByUserId(userId);
  }

  /**
   * Cập nhật trạng thái vận đơn (Quy trình xử lý đơn)
   * Trạng thái : PENDING -> CONFIRMED -> SHIPPING -> COMPLETED
   * Yêu cầu: Quyền UPDATE Orders.
   */
  @Put(':id/status')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.orders, actions: [Action.update] }])
  @Audit(Resource.orders, Action.update)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req,
  ) {
    return this.ordersService.updateStatus(id, status, req.user);
  }

  /**
   * Admin hủy đơn (Force Cancel)
   * Dùng khi khách bom hàng hoặc hết hàng.
   * Yêu cầu: Quyền UPDATE Orders.
   */
  @Put(':id/admin-cancel')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.orders, actions: [Action.update] }])
  @Audit(Resource.orders, Action.update)
  adminCancel(@Param('id') id: string, @Req() req) {
    return this.ordersService.adminCancelOrder(id, req.user);
  }

  /**
   * Cập nhật trạng thái thanh toán riêng biệt
   * Dùng khi xác nhận chuyển khoản ngân hàng thủ công (UNPAID -> PAID).
   * Tách biệt với trạng thái giao vận.
   */
  @Put(':id/payment-status')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.orders, actions: [Action.update] }])
  @Audit(Resource.orders, Action.update)
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
    @Req() req,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentStatus, req.user);
  }

  // ==================================================================
  // 3. API CHUNG (PUBLIC/SHARED)
  // ==================================================================

  /**
   * Xem chi tiết đơn hàng
   */
  @Get(':id')
  @UseGuards(AuthenticationGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
