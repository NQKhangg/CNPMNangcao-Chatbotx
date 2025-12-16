import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateInventoryDto {
  @IsNotEmpty({ message: 'Sản phẩm không được để trống' })
  @IsMongoId({ message: 'ID sản phẩm không hợp lệ' })
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number; // Admin luôn nhập số dương (VD: nhập 5 cái)

  @IsOptional()
  @IsString()
  reason?: string; // Ghi chú (VD: "Hàng vỡ do vận chuyển")

  @IsOptional()
  @IsMongoId()
  supplierId?: string; // Chỉ dùng khi Nhập hàng

  @IsOptional()
  @IsString()
  referenceCode?: string; // Mã phiếu thủ công nếu có
}
