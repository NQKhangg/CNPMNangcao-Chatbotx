import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true }) // Tự động tạo createdAt, updatedAt
export class Department {
  /**
   * Tên phòng ban (VD: Kinh doanh, IT, HR...)
   * trim: true -> Tự động cắt khoảng trắng thừa.
   */
  @Prop({ required: true, trim: true })
  name: string;

  /**
   * Mô tả chức năng, nhiệm vụ của phòng ban.
   */
  @Prop()
  description: string;

  /**
   * Trưởng phòng (Manager)
   * Liên kết tới bảng User.
   * Index: true -> Giúp query "Tìm phòng ban mà ông A làm trưởng phòng" nhanh hơn.
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  manager?: User | string;

  /**
   * Trạng thái hoạt động.
   * true: Đang hoạt động.
   * false: Tạm ngưng/Giải thể.
   */
  @Prop({ default: true })
  isActive: boolean;

  /**
   * Cờ Xóa mềm (Soft Delete).
   * true: Đã xóa
   * false: Chưa xóa.
   */
  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// --- INDEX ---

/**
 * Partial Unique Index cho Tên phòng ban.
 * Logic: Tên phòng ban phải duy nhất, nhưng chỉ áp dụng với các phòng ban chưa xóa.
 * Ví dụ:
 * 1. Tạo "IT" -> OK.
 * 2. Xóa "IT" (isDeleted: true) -> OK.
 * 3. Tạo lại "IT" mới (isDeleted: false) -> OK (Không bị báo lỗi đã tồn tại).
 */
DepartmentSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
