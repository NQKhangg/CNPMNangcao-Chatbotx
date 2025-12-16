// src/webhook/entities/payment-transaction.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ timestamps: true })
export class PaymentTransaction {
  @Prop({ unique: true })
  transactionId: number; // id từ SePay

  @Prop()
  gateway: string;

  @Prop()
  transactionDate: string;

  @Prop()
  accountNumber: string;

  @Prop()
  content: string;

  @Prop()
  transferAmount: number;

  @Prop()
  transferType: string;

  @Prop()
  referenceCode: string; // Mã đơn hàng tìm được (nếu có)

  @Prop({ default: 'UNPAID' })
  status: string;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
