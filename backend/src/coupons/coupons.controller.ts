import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  Patch,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Audit } from 'src/common/decorators/audit.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('coupons')
@UseInterceptors(AuditInterceptor) // Ghi lại lịch sử thao tác cho toàn bộ Controller
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * API Kiểm tra mã giảm giá (Public hoặc Customer)
   * Dùng ở trang Checkout để xem mã có hợp lệ không, giảm bao nhiêu tiền.
   * Cần decodeURIComponent vì mã có thể chứa ký tự đặc biệt khi truyền trên URL.
   */
  @Get('validate/:code')
  validate(@Param('code') code: string) {
    const decodeCode = decodeURIComponent(code);
    return this.couponsService.validateCoupon(decodeCode);
  }

  // API Public cho khách xem mã
  @Get('active')
  findActive() {
    return this.couponsService.findActiveCoupons();
  }

  /**
   * Tạo mã giảm giá mới (Admin)
   * Yêu cầu: Đăng nhập + Quyền CREATE Coupon
   * Có ghi Audit Log
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.coupons, actions: [Action.create] }])
  @Audit(Resource.coupons, Action.create)
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  /**
   * Lấy danh sách mã giảm giá (Admin quản lý)
   * Yêu cầu: Đăng nhập + Quyền READ Coupon
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.coupons, actions: [Action.read] }])
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.couponsService.findAll(page, limit, keyword);
  }

  /**
   * Cập nhật trạng thái mã giảm giá
   */
  @Patch(':id/active')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.coupons, actions: [Action.update] }])
  @Audit(Resource.coupons, Action.update)
  updateActive(
    @Param('id') id: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.couponsService.updateActive(id, isActive);
  }

  /**
   * Cập nhật thông tin mã giảm giá
   * Thường dùng để sửa ngày hết hạn, số lượng, hoặc tắt mã (isActive: false)
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.coupons, actions: [Action.update] }])
  @Audit(Resource.coupons, Action.update)
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  /**
   * Xóa mã giảm giá
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.coupons, actions: [Action.delete] }])
  @Audit(Resource.coupons, Action.delete)
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}
