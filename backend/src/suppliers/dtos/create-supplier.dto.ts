import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateSupplierDto {
  /**
   * Tên Nhà cung cấp (Bắt buộc)
   * Đây là định danh chính, không được để trống.
   */
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @IsString()
  name: string;

  /**
   * Người liên hệ đại diện (Tùy chọn)
   * VD: "Anh Nam - Sale Manager"
   */
  @IsOptional()
  @IsString()
  contactPerson?: string;

  /**
   * Số điện thoại
   * Dùng để liên lạc nhập hàng.
   */
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  phone: string;

  /**
   * Email (Tùy chọn)
   */
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;

  /**
   * Địa chỉ (Tùy chọn)
   */
  @IsOptional()
  @IsString()
  address?: string;

  /**
   * Mã số thuế (Tùy chọn)
   * Cần thiết khi xuất hóa đơn đỏ.
   */
  @IsOptional()
  @IsString()
  taxCode?: string;

  /**
   * Ghi chú thêm (Tùy chọn)
   * VD: "NCC này chuyên cung cấp rau củ Đà Lạt, giao sáng sớm"
   */
  @IsOptional()
  @IsString()
  note?: string;
}
