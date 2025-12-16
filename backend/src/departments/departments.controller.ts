import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Action } from 'src/roles/enums/action.enum';
import { Resource } from 'src/roles/enums/resource.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Audit } from 'src/common/decorators/audit.decorator';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';

/**
 * Controller quản lý Phòng ban
 * @UseGuards: Áp dụng bảo vệ (Login + Quyền) cho TOÀN BỘ API trong controller này.
 * @UseInterceptors: Tự động ghi lại lịch sử thao tác (Audit Log) sau khi API chạy xong.
 */
@Controller('departments')
@UseGuards(AuthenticationGuard, AuthorizationGuard)
@UseInterceptors(AuditInterceptor)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Tạo phòng ban mới
   * Method: POST
   * Quyền: CREATE Departments
   */
  @Post()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.departments, actions: [Action.create] }])
  @Audit(Resource.departments, Action.create) // Đánh dấu để AuditInterceptor ghi log: "User A đã tạo Department B"
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  /**
   * Lấy danh sách phòng ban
   * Method: GET
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.departments, actions: [Action.read] }])
  findAll(
    @Query('page', ParseIntPipe) page: number = 1, // Mặc định trang 1
    @Query('limit', ParseIntPipe) limit: number = 10, // Mặc định 10 dòng/trang
    @Query('keyword') keyword: string = '', // Từ khóa tìm kiếm
  ) {
    return this.departmentsService.findAll(page, limit, keyword);
  }

  /**
   * Cập nhật nhanh trạng thái (Kích hoạt / Khóa)
   * Method: PUT /departments/:id/active
   * Body: { "isActive": true/false }
   */
  @Patch(':id/active')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.departments, actions: [Action.update] }])
  @Audit(Resource.departments, Action.update)
  updateActive(
    @Param('id') id: string,
    @Body('isActive', ParseBoolPipe) isActive: boolean, // Lấy trực tiếp field isActive và ép kiểu boolean
  ) {
    return this.departmentsService.updateActive(id, isActive);
  }

  /**
   * Cập nhật thông tin phòng ban (Tên, Mô tả, Trưởng phòng...)
   * Method: PUT /departments/:id
   */
  @Put(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.departments, actions: [Action.update] }])
  @Audit(Resource.departments, Action.update)
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  /**
   * Xóa phòng ban (Soft Delete)
   * Method: DELETE /departments/:id
   */
  @Delete(':id')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.departments, actions: [Action.delete] }])
  @Audit(Resource.departments, Action.delete)
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
