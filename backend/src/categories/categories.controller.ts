import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Audit } from 'src/common/decorators/audit.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Controller('categories')
@UseInterceptors(AuditInterceptor) // Áp dụng ghi Log cho toàn bộ Controller
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ==================================================================
  // 1. PUBLIC ROUTES (AI CŨNG TRUY CẬP ĐƯỢC)
  // ==================================================================

  /**
   * Lấy danh sách danh mục (Public)
   * Chỉ trả về các danh mục đang Active (isActive: true)
   */
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // ==================================================================
  // 2. ADMIN ROUTES (CẦN LOGIN & QUYỀN)
  // ==================================================================

  /**
   * Lấy tất cả danh mục (Admin)
   * Trả về cả danh mục đang ẩn (isActive: false)
   * Không trả về danh mục đã xóa mềm (isDeleted: true)
   */
  @Get('admin')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.categories, actions: [Action.read] }])
  findAllAdmin(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.categoriesService.findAllAdmin(page, limit, keyword);
  }

  /**
   * Tạo danh mục mới
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.categories, actions: [Action.create] }])
  @Audit(Resource.categories, Action.create) // Ghi log hành động
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Cập nhật trạng thái Active/Inactive nhanh
   * URL: PUT /categories/:id/active
   * Body: { "isActive": true }
   * ParseBoolPipe đảm bảo active nhận vào là boolean chuẩn
   */
  @Patch(':id/active')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.categories, actions: [Action.update] }])
  @Audit(Resource.categories, Action.update)
  updateActive(
    @Param('id') id: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.categoriesService.updateActive(id, isActive);
  }

  /**
   * Cập nhật thông tin danh mục (Tên, Ảnh, Mô tả...)
   * URL: PUT /categories/:id
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.categories, actions: [Action.update] }])
  @Audit(Resource.categories, Action.update)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  /**
   * Xóa danh mục (Soft Delete)
   * URL: DELETE /categories/:id
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.categories, actions: [Action.delete] }])
  @Audit(Resource.categories, Action.delete)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
