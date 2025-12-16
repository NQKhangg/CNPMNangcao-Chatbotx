import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookDto } from './dtos/create-webhook.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('sepay')
  async handleSepay(
    @Body() payload: WebhookDto,
    @Headers('authorization') authHeader: string,
  ) {
    // console.log('SePay Webhook Payload:', JSON.stringify(payload));
    // console.log('Header Auth:', authHeader);

    // 2. Check Token
    // 2. Tách Token (Xử lý cả "Bearer ..." và "Apikey ...")
    // Logic: Tách chuỗi bằng khoảng trắng, lấy phần tử cuối cùng
    // VD: "Bearer 12345" -> "12345"
    // VD: "Apikey 12345" -> "12345"
    // VD: "12345"        -> "12345"
    const parts = authHeader?.split(' ');
    const token =
      parts && parts.length > 1 ? parts[parts.length - 1] : authHeader;
    if (token !== process.env.SEPAY_API_KEY) {
      console.error('Sai Token SePay');
      throw new UnauthorizedException('Sai SePay API Key');
    }

    // 3. Gọi service
    await this.webhookService.handleSepayWebhook(payload);

    return { success: true };
  }
}
