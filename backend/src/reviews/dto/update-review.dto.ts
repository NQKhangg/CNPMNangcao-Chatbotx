import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

// Kế thừa nhưng bỏ productId (không cho sửa sản phẩm)
export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  images?: string[];
}
