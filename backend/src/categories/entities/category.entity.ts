import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true }) // Tự động tạo 2 trường: createdAt và updatedAt
export class Category {
  /**
   * Tên danh mục.
   * trim: true -> Tự động cắt khoảng trắng đầu/cuối (VD: " Rau " -> "Rau")
   */
  @Prop({ required: true, trim: true })
  name: string;

  /**
   * Slug (URL thân thiện). VD: "rau-cu-qua"
   * lowercase: true -> Tự động chuyển thành chữ thường
   */
  @Prop({ required: true, lowercase: true })
  slug: string;

  /**
   * Đường dẫn ảnh (URL)
   */
  @Prop()
  image: string;

  /**
   * Mô tả chi tiết danh mục
   */
  @Prop()
  description: string;

  /**
   * Trạng thái hoạt động:
   * true: Đang hiện trên web
   * false: Tạm ẩn (VD: Danh mục "Coca tết" chỉ mở khi đến mùa)
   */
  @Prop({ default: true })
  isActive: boolean;

  /**
   * --- SOFT DELETE (XÓA MỀM) ---
   * Thay vì xóa khỏi database, ta chỉ đánh dấu là đã xóa.
   * true: Đã xóa
   * false: Chưa xóa
   * index: true -> Giúp query lọc hàng chưa xóa nhanh hơn
   */
  @Prop({ default: false, index: true })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// --- GIẢI THÍCH VỀ PARTIAL FILTER EXPRESSION INDEX ---

/**
 * VẤN ĐỀ:
 * Nếu dùng @Prop({ unique: true }) cho slug:
 * 1. Tạo danh mục "Rau củ" (slug: rau-cu).
 * 2. Xóa mềm nó (isDeleted: true). Nó vẫn nằm trong DB.
 * 3. Tạo lại danh mục "Rau củ" mới (slug: rau-cu).
 * -> LỖI: MongoDB báo trùng slug "rau-cu", dù cái cũ đã bị "xóa".
 *
 * GIẢI PHÁP:
 * Dùng Partial Filter Expression:
 * "Chỉ bắt buộc slug phải là DUY NHẤT đối với những danh mục CHƯA BỊ XÓA (isDeleted: false)"
 */

// Index 1: Slug phải duy nhất giữa các danh mục đang tồn tại
CategorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// Index 2: Tên cũng phải duy nhất giữa các danh mục đang tồn tại
CategorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
