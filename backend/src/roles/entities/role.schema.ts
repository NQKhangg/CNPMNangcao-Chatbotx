import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';

/**
 * Schema con: Permission
 */
@Schema({ _id: false })
class Permission {
  // Lưu Resource (VD: 'Product')
  @Prop({ required: true, enum: Resource })
  resource: Resource;

  // Lưu mảng các Action (VD: ['CREATE', 'READ'])
  // type: [{ type: String ... }] nghĩa là một mảng các chuỗi String
  @Prop({ type: [{ type: String, enum: Action }] })
  actions: Action[];
}
// Tạo SchemaFactory cho class con để nhúng vào class cha
export const PermissionSchema = SchemaFactory.createForClass(Permission);

/**
 * Schema chính: Role
 */
@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class Role {
  // Tên Role phải duy nhất (Unique) để tránh tạo trùng (VD: 2 role Admin)
  @Prop({ required: true, unique: true })
  name: string;

  // Nhúng mảng PermissionSchema vào đây
  @Prop({ required: true, type: [PermissionSchema] })
  permissions: Permission[];

  // Cờ xóa mềm
  @Prop({ default: false })
  isDeleted: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
