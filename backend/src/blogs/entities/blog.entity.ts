import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true }) // Tự động tạo 2 trường 'createdAt' và 'updatedAt'
export class Blog {
  // Tiêu đề bài viết
  @Prop({ required: true })
  title: string;

  // Đường dẫn thân thiện (SEO).
  // unique: true -> Đảm bảo không có 2 bài viết trùng đường dẫn
  @Prop({ required: true, unique: true })
  slug: string;

  // Mô tả ngắn gọn (Preview)
  @Prop()
  shortDescription: string;

  // Nội dung bài viết (Lưu HTML/Markdown)
  @Prop({ required: true })
  content: string;

  // URL ảnh thumbnail
  @Prop()
  thumbnail: string;

  // --- QUAN TRỌNG: LIÊN KẾT BẢNG (RELATIONSHIP) ---
  // type: Types.ObjectId -> Lưu ID của User
  // ref: 'User' -> Tham chiếu tới Schema User (để dùng hàm .populate('author') lấy thông tin user)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: User;

  // Phân loại bài viết (Sức khỏe, đời sống, ...)
  @Prop()
  category: string;

  // Mảng các từ khóa. Default là mảng rỗng [] nếu không có dữ liệu
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Trạng thái bài viết:
  // true: Đã đăng (Public)
  // false: Bản nháp (Draft) - Chỉ Admin/Author thấy
  @Prop({ default: true })
  isPublished: boolean;

  // Xóa mềm (Soft Delete):
  @Prop({ default: false })
  isDeleted: boolean;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Đánh Index cho text search khi tìm kiếm nhanh theo tiêu đề
BlogSchema.index({ title: 'text', shortDescription: 'text' });
