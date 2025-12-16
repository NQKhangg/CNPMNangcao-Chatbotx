import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentStatus } from '../enums/payment_status.enum';

/**
 * 1. Validate Địa chỉ chi tiết
 * validate object 'address' nằm bên trong.
 */
class AddressDto {
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  city: string;

  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  ward: string;

  @IsNotEmpty({ message: 'Số nhà/Tên đường không được để trống' })
  @IsString()
  street: string;
}

/**
 * 2. Validate thông tin khách hàng
 * Chứa tên, sđt và lồng thêm AddressDto bên trong.
 */
class CustomerInfoDto {
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString()
  phone: string;

  /**
   * --- KỸ THUẬT VALIDATE OBJECT LỒNG NHAU ---
   * @ValidateNested(): Báo cho class-validator biết cần chui vào trong để validate tiếp.
   * @Type(() => AddressDto): Báo cho class-transformer biết object này thuộc class nào
   * để chuyển đổi dữ liệu JSON thành instance của class đó trước khi validate.
   */
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * 3. Validate từng món hàng trong giỏ
 */
class OrderItemDto {
  @IsNotEmpty({ message: 'ID sản phẩm là bắt buộc' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'Số lượng phải ít nhất là 1' })
  quantity: number;
}

/**
 * 4. DTO CHÍNH (Gửi từ Frontend)
 */
export class CreateOrderDto {
  // Validate thông tin khách hàng (Lồng nhau cấp 1)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  // Validate danh sách hàng hóa (Mảng object)
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true }) // each: true -> Validate từng phần tử trong mảng
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Phương thức thanh toán
  @IsNotEmpty({ message: 'Phương thức thanh toán là bắt buộc' })
  @IsString()
  paymentMethod: string; // 'COD' | 'ZALOPAY'...

  // Mã giảm giá (nếu có)
  @IsOptional()
  @IsArray()
  couponCodes?: string[];

  // Trạng thái thanh toán (Thường backend tự set, nhưng cho phép override nếu cần)
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
