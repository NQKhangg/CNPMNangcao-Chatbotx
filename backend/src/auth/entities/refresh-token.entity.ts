import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true }) // Tự động tạo createdAt và updatedAt
export class RefreshToken extends Document {
  // Chuỗi token thực tế
  // Index để tìm kiếm nhanh hơn
  @Prop({ required: true, index: true })
  token: string;

  // ID của người dùng sở hữu token này
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  // Thời điểm hết hạn.
  @Prop({ required: true })
  expiryDate: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
