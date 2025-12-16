import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  /**
   * Tên danh mục
   */
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên danh mục không được quá 100 ký tự' })
  name: string;

  /**
   * Slug được backend tự generate từ name.
   */
  @IsOptional()
  @IsString()
  slug?: string;

  /**
   * URL ảnh (Optional)
   */
  @IsOptional()
  @IsString()
  image?: string;

  /**
   * Mô tả (Optional)
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Trạng thái hiển thị.
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
