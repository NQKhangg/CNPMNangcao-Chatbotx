import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO con: Địa chỉ nhận hàng
 */
class AddressDto {
  @IsNotEmpty({ message: 'Tên gợi nhớ không được để trống (VD: Nhà riêng)' })
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  receiverName: string;

  @IsBoolean()
  isDefault: boolean;
}

/**
 * DTO chính: Cập nhật thông tin cá nhân
 */
export class UpdateProfileDto {
  // Các trường thông tin cơ bản
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  // Dùng IsDateString để validate chuỗi
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  // --- DÀNH CHO ADMIN QUẢN LÝ NHÂN VIÊN ---
  @IsOptional()
  @IsString()
  employeeCode?: string; // Mã nhân viên

  // --- DÀNH CHO KHÁCH HÀNG (Sổ địa chỉ) ---
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validate từng phần tử trong mảng
  @Type(() => AddressDto) // Transform JSON object thành AddressDto instance
  addresses?: AddressDto[];
}
