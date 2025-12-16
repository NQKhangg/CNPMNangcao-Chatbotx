import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { CreateInventoryDto } from './dtos/create-inventory.dto';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Audit } from 'src/common/decorators/audit.decorator';
import { InventoryType } from './enums/inventory_type.enum';

@Controller('inventory')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@UseInterceptors(AuditInterceptor)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * API: Nhập hàng (Import)
   * Cộng thêm số lượng vào kho.
   * DTO đảm bảo quantity gửi lên > 0.
   */
  @Post('import')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.inventory, actions: [Action.create] }])
  @Audit(Resource.inventory, Action.create) // Ghi log hành động nhập
  importGoods(@Body() createInventoryDto: CreateInventoryDto, @Req() req) {
    return this.inventoryService.adjustStock(
      createInventoryDto.productId,
      Math.abs(createInventoryDto.quantity), // Import: Luôn là số DƯƠNG
      InventoryType.IMPORT,
      createInventoryDto.reason || 'Nhập hàng thủ công',
      req.user, // Người thực hiện
      undefined, // Order ID (không có)
      createInventoryDto.supplierId, // Nhà cung cấp
      createInventoryDto.referenceCode, // Mã phiếu
    );
  }

  /**
   * API: Xuất hủy hàng lỗi (Discard/Damaged)
   * Trừ bớt số lượng khỏi kho.
   * DTO gửi lên quantity > 0, Controller tự chuyển thành số Âm.
   */
  @Post('discard')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.inventory, actions: [Action.create] }])
  @Audit(Resource.inventory, Action.create)
  discardGoods(@Body() createInventoryDto: CreateInventoryDto, @Req() req) {
    return this.inventoryService.adjustStock(
      createInventoryDto.productId,
      -Math.abs(createInventoryDto.quantity), // Discard: Luôn chuyển thành số ÂM
      InventoryType.DAMAGED,
      createInventoryDto.reason || 'Hủy hàng hỏng/lỗi',
      req.user,
      undefined,
      createInventoryDto.supplierId,
      createInventoryDto.referenceCode,
    );
  }

  /**
   * API: Xem lịch sử kho (Logs)
   */
  @Get('logs')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.inventory, actions: [Action.read] }])
  getAllLogs(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.inventoryService.getAllHistory(page, limit, keyword);
  }
}
