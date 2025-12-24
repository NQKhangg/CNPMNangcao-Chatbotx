import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Resource } from '../roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Audit } from 'src/common/decorators/audit.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { UpdateProductDto } from './dtos/update-product.dto';
import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';

/**
 * Controller Quản lý Sản phẩm
 * Public API: Xem danh sách, xem chi tiết (cho khách hàng)
 * Private API: Tạo, Sửa, Xóa (cho Admin/Staff)
 */
@Controller('products')
@UseInterceptors(AuditInterceptor) // Ghi log toàn bộ controller này
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Tạo sản phẩm mới
   * Yêu cầu: Đăng nhập + Quyền CREATE Product
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.products, actions: [Action.create] }])
  @Audit(Resource.products, Action.create)
  create(@Body() createProductDto: CreateProductDto, @Req() req) {
    return this.productsService.create(createProductDto, req.user);
  }

  /**
   * Lấy danh sách sản phẩm (Filter + Pagination + Sort)
   * Public API
   * Hỗ trợ lọc theo giá, sao, danh mục, từ khóa
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.products, actions: [Action.read] }])
  @OptionalAuth()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('keyword') keyword: string = '',
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number,
    @Query('category') category: string = '',
    @Query('sort') sort: string = 'newest', // newest | price_asc | price_desc
    @Req() req?: any,
  ) {
    // 1. Lấy role thô từ Request (có thể là String hoặc Object)
    const rawRole = req?.user?.role;
    // 2. Chuẩn hóa về String 'Customer' / 'Admin'
    const userRole = rawRole?.name ? rawRole.name : rawRole || 'Customer';

    // 3. Ép kiểu về số vì Query Params luôn là string
    return this.productsService.findAll(
      Number(page),
      Number(limit),
      keyword,
      minPrice ? Number(minPrice) : undefined,
      maxPrice ? Number(maxPrice) : undefined,
      minRating ? Number(minRating) : undefined,
      category,
      sort,
      userRole,
    );
  }

  /**
   * Lấy danh sách sản phẩm đang giảm giá (Flash Sale)
   * - Public API
   * - Giá bán < Giá gốc
   */
  @Get('on-sale')
  findOnSale(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.productsService.findOnSale(page, limit);
  }

  /**
   * Cập nhật sản phẩm
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.products, actions: [Action.update] }])
  @Audit(Resource.products, Action.update)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req,
  ) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  /**
   * Xóa mềm sản phẩm (Soft Delete)
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.products, actions: [Action.delete] }])
  @Audit(Resource.products, Action.delete)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Xem chi tiết sản phẩm
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
