import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateDepartmentDto {
  /**
   * Tên phòng ban
   */
  @IsNotEmpty({ message: 'Tên phòng ban không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên phòng ban không quá 100 ký tự' })
  name: string;

  /**
   * Mô tả (Tùy chọn)
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * ID của Trưởng phòng
   */
  @IsOptional()
  @IsMongoId({ message: 'ID trưởng phòng không hợp lệ' })
  manager?: string;

  /**
   * Trạng thái (Mặc định true nếu không gửi)
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
