import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Audit } from 'src/common/decorators/audit.decorator';

@Controller('blogs')
@UseInterceptors(AuditInterceptor) // Ghi log toàn bộ thao tác trong controller (nếu có cấu hình @Audit)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // ==================================================================
  // PHẦN 1: PUBLIC ROUTES (KHÔNG CẦN LOGIN)
  // Các route này ai cũng truy cập được để xem bài viết
  // ==================================================================

  /**
   * Lấy danh sách bài viết đã xuất bản (Published)
   * Dành cho trang chủ/trang tin tức của khách.
   */
  @Get('published')
  findPublished(
    @Query('page', ParseIntPipe) page: number = 1, // Mặc định là 1 nếu ko truyền
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.blogsService.findPublished(page, limit);
  }

  /**
   * Xem chi tiết một bài viết
   * Dành cho khách xem nội dung chi tiết.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  // ==================================================================
  // PHẦN 2: ADMIN / STAFF ROUTES (CẦN LOGIN & QUYỀN)
  // Các route này dùng để quản lý nội dung
  // ==================================================================

  /**
   * Tạo bài viết mới
   * Yêu cầu: Đăng nhập + Quyền CREATE Blog
   * Có ghi Audit Log
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.blogs, actions: [Action.create] }])
  @Audit(Resource.blogs, Action.create)
  create(@Body() createBlogDto: CreateBlogDto, @Req() req: any) {
    // req.user.userId lấy từ token (do AuthenticationGuard giải mã)
    return this.blogsService.create(createBlogDto, req.user.userId);
  }

  /**
   * Lấy danh sách toàn bộ bài viết (Quản trị)
   * Bao gồm cả bài Nháp (Draft) và Đã ẩn (Hidden).
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.blogs, actions: [Action.read] }])
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('keyword') keyword: string = '',
  ) {
    return this.blogsService.findAll(page, limit, keyword);
  }

  /**
   * Cập nhật bài viết
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.blogs, actions: [Action.update] }])
  @Audit(Resource.blogs, Action.update)
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(id, updateBlogDto);
  }

  /**
   * Xóa bài viết (Soft Delete)
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.blogs, actions: [Action.delete] }])
  @Audit(Resource.blogs, Action.delete)
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
