import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Action } from '../enums/action.enum';
import { Resource } from '../enums/resource.enum';

/**
 * Class phụ dùng để validate từng object Permission trong mảng
 * VD: { resource: 'Products', actions: ['Create', 'Update'] }
 */
export class Permission {
  // Kiểm tra resource có nằm trong danh sách Resource hợp lệ không
  @IsEnum(Resource, { message: 'Resource không hợp lệ' })
  resource: Resource;

  // 1. IsEnum(..., { each: true }): Kiểm tra TỪNG phần tử trong mảng phải là Action hợp lệ
  // 2. ArrayUnique: Đảm bảo không có action trùng lặp (VD: không được ['READ', 'READ'])
  @IsEnum(Action, { each: true, message: 'Action không hợp lệ' })
  @ArrayUnique({ message: 'Action không được trùng lặp' })
  actions: Action[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên Role không được để trống' })
  name: string; // VD: "Admin", "Staff", "Customer"

  /**
   * --- VALIDATE MẢNG OBJECT (QUAN TRỌNG) ---
   * 1. @IsArray: Phải là một mảng []
   * 2. @ValidateNested: Báo cho NestJS biết cần "chui" vào trong từng phần tử để validate tiếp
   * 3. @Type(() => Permission): Biến đổi JSON thuần thành instance của class Permission
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Permission)
  permissions: Permission[];

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}
