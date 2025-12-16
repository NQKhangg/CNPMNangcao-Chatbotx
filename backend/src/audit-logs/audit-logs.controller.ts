import {
  Controller,
  Get,
  UseGuards,
  ParseIntPipe,
  Query,
  Param,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Permissions } from '../common/decorators/permissions.decorator';

@Controller('audit-logs')
@UseGuards(AuthenticationGuard, AuthorizationGuard) // Áp dụng Guard cho toàn bộ Controller
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Lấy danh sách nhật ký hoạt động
   * Có hỗ trợ: Phân trang, Tìm kiếm, Lọc theo ngày
   */
  @Get()
  @Permissions([{ resource: Resource.audit_logs, actions: [Action.read] }])
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1, // Số trang
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10, // Giới hạn item trong một trang
    @Query('keyword') keyword: string = '', // Lọc theo từ khóa
    @Query('fromDate') fromDate?: string, // Ngày bắt đầu
    @Query('toDate') toDate?: string, // Ngày kết thúc
  ) {
    return this.auditLogsService.findAll(
      page,
      limit,
      keyword,
      fromDate,
      toDate,
    );
  }

  /**
   * Xem chi tiết một log cụ thể
   */
  @Get(':id')
  @Permissions([{ resource: Resource.audit_logs, actions: [Action.read] }])
  findOne(@Param('id') id: string) {
    return this.auditLogsService.findOne(id);
  }
}
