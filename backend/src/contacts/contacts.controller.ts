import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { ContactService } from './contacts.service';
import { CreateContactDto } from './dtos/create-contact.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Audit } from 'src/common/decorators/audit.decorator';

@Controller('contacts')
@UseInterceptors(AuditInterceptor) // Áp dụng ghi log Audit cho toàn bộ controller
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Tạo liên hệ mới (Gửi tin nhắn)
   */
  @Post()
  @UseGuards(AuthenticationGuard)
  @Audit(Resource.contacts, Action.create)
  create(@Body() createContactDto: CreateContactDto, @Req() req: any) {
    // req.user được AuthenticationGuard (nếu có) gán vào.
    // Nếu chưa login, userId có thể là null/undefined.
    const userId = req.user ? req.user.userId : null;
    return this.contactService.create(createContactDto, userId);
  }

  /**
   * Lấy danh sách liên hệ (Dành cho Admin)
   * Yêu cầu: Phải đăng nhập + Có quyền READ Contacts
   * Hỗ trợ: Phân trang & Tìm kiếm từ khóa
   */
  @Get()
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.contacts, actions: [Action.read] }])
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('keyword') keyword: string,
  ) {
    return this.contactService.findAll(page, limit, keyword);
  }

  /**
   * Admin trả lời liên hệ
   * Yêu cầu: Đăng nhập + Có quyền UPDATE Contacts
   * Logic: Gửi email cho khách -> Update trạng thái trong DB -> Ghi Audit Log
   */
  @Post(':id/reply')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.contacts, actions: [Action.update] }])
  @Audit(Resource.contacts, Action.update) // Ghi log hành động này: "Admin A đã trả lời Contact B"
  reply(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    // req.user.userId ở đây là ID của Admin đang thực hiện trả lời
    return this.contactService.reply(id, content, req.user.userId);
  }
}
