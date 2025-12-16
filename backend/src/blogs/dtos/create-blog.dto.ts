import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBlogDto {
  // Tiêu đề bài viết
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  title: string;

  // Slug (URL thân thiện)
  @IsOptional()
  @IsString()
  slug?: string;

  // Mô tả ngắn: Hiển thị ở danh sách bài viết (SEO meta description)
  @IsOptional()
  @IsString()
  shortDescription?: string;

  // Nội dung chính
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  content: string;

  // Ảnh đại diện
  @IsOptional()
  @IsString()
  thumbnail?: string;

  // Danh mục bài viết (VD: 'Sức khỏe', 'Công nghệ')
  @IsOptional()
  @IsString()
  category?: string;

  // Thẻ tags: Là một mảng các chuỗi
  @IsOptional()
  @IsArray({ message: 'Tags phải là một danh sách (mảng)' })
  @IsString({ each: true, message: 'Mỗi tag phải là một chuỗi ký tự' }) // Validate từng phần tử bên trong mảng
  tags?: string[];

  // Trạng thái hiển thị: True = Công khai, False = Nháp
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  // Xóa mềm (mặc định false)
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
