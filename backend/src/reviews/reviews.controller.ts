import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor';
import { Audit } from 'src/common/decorators/audit.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { AuthorizationGuard } from 'src/guards/authorization.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { User } from 'src/users/entities/user.entity';

@Controller('reviews')
@UseInterceptors(AuditInterceptor)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Viết đánh giá (Cần login)
  @Post()
  @UseGuards(AuthenticationGuard)
  @Audit('reviews', Action.create)
  create(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    return this.reviewsService.create(createReviewDto, req.user.userId);
  }

  // Xem đánh giá theo sản phẩm (Công khai)
  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  /**
   * User sửa đánh giá
   */
  @Patch(':id')
  @UseGuards(AuthenticationGuard) // Yêu cầu login
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReviewDto,
    @Req() req,
  ) {
    console.log('OK');
    return this.reviewsService.updateByUser(id, updateDto, req.user.userId);
  }

  /**
   * Admin trả lời đánh giá
   */
  @Put(':id/reply')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([
    { resource: Resource.products, actions: [Action.update] }, // Yêu cầu quyền update product mới được reply
  ])
  @Audit('reviews', Action.update) // Log audit nếu cần
  async reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyReviewDto,
    @Req() req: any,
  ) {
    return this.reviewsService.replyReview(id, replyDto, req.user);
  }

  /**
   * Admin ẩn/hiện đánh giá
   */
  @Patch(':id/toggle-hidden')
  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.products, actions: [Action.update] }])
  @Audit('reviews', Action.update)
  async toggleHidden(@Param('id') id: string) {
    return this.reviewsService.toggleHidden(id);
  }
}
