import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MaxLength(200, { message: 'Tiêu đề không quá 200 ký tự' })
  subject: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  message: string;

  // customerId lấy từ Token (req.user)
  @IsOptional()
  customerId?: string;
}
