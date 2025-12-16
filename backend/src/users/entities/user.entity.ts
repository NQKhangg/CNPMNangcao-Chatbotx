import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../roles/entities/role.schema';
import { Department } from 'src/departments/entities/department.entity';
import { Product } from 'src/products/entities/product.entity';

export type UserDocument = User & Document;

/**
 * Schema con: UserAddress
 */
@Schema({ _id: false })
class UserAddress {
  @Prop()
  label: string; // VD: "Nhà riêng", "Công ty"

  @Prop({ required: true })
  address: string; // Địa chỉ chi tiết

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  receiverName: string;

  @Prop({ default: false })
  isDefault: boolean;
}

@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class User extends Document {
  // =================================================================
  // 1. THÔNG TIN ĐĂNG NHẬP (CORE AUTH)
  // =================================================================
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, select: false })
  password: string;

  // ID của Google để định danh
  @Prop({ unique: true, sparse: true }) // sparse: true để cho phép nhiều user null (user thường)
  googleId: string;

  @Prop({ default: 'local' }) // local hoặc google
  authType: string;

  // Liên kết với bảng Role (Phân quyền)
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Role;

  // =================================================================
  // 2. THÔNG TIN CÁ NHÂN (PROFILE)
  // =================================================================
  @Prop()
  avatar: string;

  @Prop()
  phone: string;

  @Prop({ enum: ['Male', 'Female', 'Other'] })
  gender: string;

  @Prop()
  dateOfBirth: Date;

  // =================================================================
  // 3. DÀNH CHO KHÁCH HÀNG (E-COMMERCE)
  // =================================================================

  // Sổ địa chỉ giao hàng (Mảng các object con)
  @Prop({ type: [SchemaFactory.createForClass(UserAddress)], default: [] })
  addresses: UserAddress[];

  // Danh sách yêu thích (Wishlist) - Liên kết tới Product
  // Dùng mảng ObjectId để populate sau này
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Product[];

  // =================================================================
  // 4. DÀNH CHO NHÂN VIÊN (INTERNAL MANAGEMENT)
  // =================================================================
  @Prop()
  employeeCode?: string; // Mã nhân viên (NV001)

  // Phòng ban làm việc
  @Prop({ type: Types.ObjectId, ref: 'Department', required: false })
  department?: Department;

  // =================================================================
  // 5. TRẠNG THÁI & HỆ THỐNG
  // =================================================================
  @Prop({ default: true })
  isActive: boolean; // Khóa/Mở tài khoản

  @Prop({ default: false })
  isDeleted: boolean; // Soft Delete

  // Refresh Token (Dùng cho Auth, ẩn đi khi query)
  @Prop({ select: false })
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
