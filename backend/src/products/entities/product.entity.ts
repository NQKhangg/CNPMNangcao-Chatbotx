import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Category } from 'src/categories/entities/category.entity';
import { Supplier } from 'src/suppliers/entities/supplier.entity';

export type ProductDocument = Product & Document;

/**
 * 1. Schema con: Dinh dưỡng
 * _id: false -> Không tạo ID riêng cho từng dòng dinh dưỡng.
 */
@Schema({ _id: false })
class Nutrition {
  @Prop() label: string; // VD: "Calo"
  @Prop() value: string; // VD: "32 kcal"
}

/**
 * 2. Schema chính: Product
 * timestamps: true -> Tự động thêm createdAt, updatedAt
 */
@Schema({ timestamps: true })
export class Product {
  // --- THÔNG TIN CƠ BẢN ---

  // trim: true -> Tự động cắt khoảng trắng đầu cuối (VD: " Tao " -> "Tao")
  @Prop({ required: true, trim: true })
  name: string;

  // unique: true -> Đảm bảo đường dẫn là duy nhất, tốt cho SEO
  // lowercase: true -> Tự động chuyển về chữ thường
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  // SKU phải duy nhất để quản lý kho không bị nhầm lẫn
  @Prop({ required: true, unique: true })
  sku: string;

  /**
   * LIÊN KẾT BẢNG (RELATIONSHIP)
   * type: Types.ObjectId -> Lưu ID của Category
   * ref: 'Category' -> Tham chiếu sang bảng Category để dùng hàm .populate()
   */
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Category | string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  // --- HÌNH ẢNH ---
  @Prop({ required: true })
  thumbnail: string;

  @Prop([String])
  images: string[];

  // --- GIÁ & KHO ---
  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  originalPrice: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: 'kg' })
  unit: string;

  // --- CHI TIẾT SẢN PHẨM ---
  @Prop()
  shortDescription: string;

  @Prop()
  description: string;

  @Prop()
  origin: string;

  @Prop()
  brand: string;

  @Prop()
  preservation: string;

  // Lưu mảng các object Nutrition đã định nghĩa ở trên
  @Prop({ type: [Nutrition], default: [] })
  nutrition: Nutrition[];

  // --- ĐÁNH GIÁ & TRẠNG THÁI ---
  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewsCount: number;

  @Prop({ default: 0 })
  sold: number;

  // Liên kết với nhà cung cấp
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: false })
  supplier: Supplier | string;

  @Prop({ default: true })
  isAvailable: boolean;

  // Soft Delete
  @Prop({ default: false, index: true }) // Index để lọc sản phẩm chưa xóa nhanh hơn
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

/**
 * TEXT INDEX
 * Tạo chỉ mục văn bản trên 3 trường: name, description, tags.
 * Giúp chức năng tìm kiếm (Search) nhanh hơn.
 */
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
