import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Action } from 'src/roles/enums/action.enum';

export class CreateAuditLogDto {
  /**
   * Hành động (VD: CREATE, UPDATE...)
   */
  @IsNotEmpty({ message: 'Hành động không được để trống' })
  @IsString()
  @IsEnum(Action)
  action: string;

  /**
   * Tên Resource (VD: Product, Order)
   */
  @IsNotEmpty({ message: 'Tên tài nguyên không được để trống' })
  @IsString()
  resource: string;

  /**
   * ID của đối tượng (Phải là MongoID chuẩn 24 ký tự)
   */
  @IsNotEmpty({ message: 'ID đối tượng không được để trống' })
  @IsMongoId({ message: 'ID đối tượng không đúng định dạng MongoDB' })
  resourceId: string;

  /**
   * ID người thực hiện (Lấy từ req.user.userId)
   */
  @IsNotEmpty({ message: 'Người thực hiện không được để trống' })
  @IsMongoId({ message: 'ID người dùng không đúng định dạng' })
  performedBy: string;

  /**
   * Dữ liệu cũ (Optional)
   */
  @IsOptional()
  @IsObject()
  oldValue?: any;

  /**
   * Dữ liệu mới (Optional)
   */
  @IsOptional()
  @IsObject()
  newValue?: any;

  /**
   * IP (Optional)
   */
  @IsOptional()
  @IsString()
  ip?: string;

  /**
   * User Agent (Optional)
   */
  @IsOptional()
  @IsString()
  userAgent?: string;
}
