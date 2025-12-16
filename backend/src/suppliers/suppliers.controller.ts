import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dtos/create-supplier.dto';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Action } from 'src/roles/enums/action.enum';
import { Resource } from 'src/roles/enums/resource.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Audit } from 'src/common/decorators/audit.decorator';

/**
 * Controller Quản lý Nhà Cung Cấp
 * - @UseInterceptors(AuditInterceptor): Tự động ghi lại log hành động (Create/Update/Delete)
 * cho tất cả các API trong controller này.
 */
@Controller('suppliers')
@UseInterceptors(AuditInterceptor)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Tạo nhà cung cấp mới
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.suppliers, actions: [Action.create] }])
  @Audit(Resource.suppliers, Action.create)
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  /**
   * Lấy danh sách nhà cung cấp (Admin Dashboard)
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.suppliers, actions: [Action.read] }])
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.suppliersService.findAll(page, limit, keyword);
  }

  /**
   * Xem chi tiết nhà cung cấp
   */
  @Get(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.suppliers, actions: [Action.read] }])
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.suppliers, actions: [Action.update] }])
  @Audit(Resource.suppliers, Action.update)
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  /**
   * Xóa nhà cung cấp (Soft Delete)
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.suppliers, actions: [Action.delete] }])
  @Audit(Resource.suppliers, Action.delete)
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
