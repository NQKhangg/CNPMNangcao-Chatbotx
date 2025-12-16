import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsNotEmpty,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 1. DTO con cho Nutrition (Thành phần dinh dưỡng)
 * validate các object nằm bên trong mảng nutrition[]
 */
class NutritionDto {
  @IsString()
  @IsOptional() // Field này có thể không gửi
  label?: string; // Tên thành phần (VD: Protein)

  @IsString()
  @IsOptional()
  value?: string; // Giá trị (VD: 10g)
}

/**
 * 2. DTO Chính: CreateProductDto
 */
export class CreateProductDto {
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @IsNumber()
  @Min(0, { message: 'Giá không được âm' })
  price: number;

  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsMongoId({ message: 'Category ID không hợp lệ' }) // Kiểm tra phải là ID chuẩn MongoDB
  category: string;

  // --- CÁC TRƯỜNG TÙY CHỌN (OPTIONAL) ---

  @IsOptional()
  @IsString()
  slug?: string; // Thường Backend tự generate từ name nếu Frontend không gửi

  @IsOptional()
  @IsString()
  sku?: string; // Mã kho (Stock Keeping Unit)

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Quan trọng: Kiểm tra từng phần tử trong mảng phải là string
  tags?: string[];

  @IsOptional()
  @IsString()
  thumbnail?: string; // URL ảnh đại diện

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]; // Mảng URL ảnh chi tiết

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  unit?: string; // Đơn vị tính (kg, gram, hộp...)

  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number; // Giá gốc (để hiển thị khuyến mãi)

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  origin?: string; // Xuất xứ

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  preservation?: string; // Hướng dẫn bảo quản

  /**
   * --- VALIDATE OBJECT LỒNG NHAU (NESTED OBJECT) ---
   * 1. @IsArray: Xác định đây là mảng.
   * 2. @ValidateNested: Báo cho NestJS biết cần vào trong để validate tiếp.
   * 3. @Type(() => NutritionDto): Giúp chuyển đổi JSON thuần thành instance của class NutritionDto
   * thì các decorator trong NutritionDto mới hoạt động được.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionDto)
  nutrition?: NutritionDto[];

  // --- CÁC CHỈ SỐ THỐNG KÊ & TRẠNG THÁI ---

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsNumber()
  reviewsCount?: number;

  @IsOptional()
  @IsNumber()
  sold?: number;

  @IsOptional()
  @IsMongoId({ message: 'Supplier ID không hợp lệ' })
  supplier?: string; // ID nhà cung cấp

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
