import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  IsArray,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  /**
   * ID sản phẩm muốn đánh giá
   */
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  @IsMongoId({ message: 'ID sản phẩm không hợp lệ' })
  productId: string;

  /**
   * Số sao (1 - 5)
   */
  @IsNotEmpty({ message: 'Vui lòng chọn số sao đánh giá' })
  @IsNumber()
  @Min(1, { message: 'Đánh giá thấp nhất là 1 sao' })
  @Max(5, { message: 'Đánh giá cao nhất là 5 sao' })
  rating: number;

  /**
   * Nội dung bình luận
   */
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  @IsString()
  @MaxLength(500, { message: 'Nội dung đánh giá không quá 500 ký tự' })
  comment: string;

  /**
   * Hình ảnh đính kèm (Tùy chọn)
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Đường dẫn hình ảnh phải là chuỗi' })
  images?: string[];
}
