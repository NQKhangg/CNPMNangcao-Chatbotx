import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/orders/entities/order.entity';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './entities/payment-transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
