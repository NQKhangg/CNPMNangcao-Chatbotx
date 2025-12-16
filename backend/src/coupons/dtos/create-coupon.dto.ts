import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
  Max,
  ValidateIf,
  IsBoolean,
  Matches,
} from 'class-validator';
import { CouponType } from '../enums/coupon_type.enum';

export class CreateCouponDto {
  /**
   * Mã Code: chuỗi, không dấu cách
   */
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Mã giảm giá chỉ được chứa chữ và số' })
  code: string;

  /**
   * Loại: Phải thuộc Enum (PERCENT hoặc AMOUNT)
   */
  @IsNotEmpty()
  @IsEnum(CouponType, { message: 'Loại giảm giá phải là PERCENT hoặc AMOUNT' })
  type: CouponType;

  /**
   * Giá trị giảm: Phải là số dương
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Giá trị giảm không được âm' })
  // Validate nâng cao: Nếu là %, giá trị không được quá 100
  @ValidateIf((o) => o.type === CouponType.PERCENT)
  @Max(100, { message: 'Giảm giá phần trăm không được quá 100%' })
  value: number;

  /**
   * Giới hạn lượt dùng (Optional, mặc định 0)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  /**
   * Giá trị đơn hàng tối thiểu để áp dụng mã.
   * Mặc định là 0 (Không yêu cầu tối thiểu).
   */
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Giá trị đơn tối thiểu không được âm' })
  minOrderValue?: number;

  /**
   * Ngày hết hạn (Gửi lên dạng chuỗi ISO 8601: "2025-12-31T23:59:59Z")
   */
  @IsOptional()
  @IsDateString({}, { message: 'Ngày hết hạn không đúng định dạng ISO' })
  expiryDate?: Date;

  /**
   * Trạng thái (Mặc định true)
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
