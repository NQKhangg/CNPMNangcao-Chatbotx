import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// versionKey: false -> Bỏ trường __v trong document
@Schema({ versionKey: false, timestamps: true })
export class ResetToken extends Document {
  // Token gửi qua email
  @Prop({ required: true })
  token: string;

  // Liên kết đến User
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  // Thời gian hết hạn
  @Prop({ required: true })
  expiryDate: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);
