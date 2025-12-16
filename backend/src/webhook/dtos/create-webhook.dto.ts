import { IsNumber, IsString, IsOptional } from 'class-validator';

export class WebhookDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  gateway?: string;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsNumber()
  @IsOptional()
  transferAmount?: number;

  @IsString()
  @IsOptional()
  transferType?: string;

  @IsOptional() // subAccount có thể là null
  subAccount?: any;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceCode?: string;

  @IsNumber()
  @IsOptional()
  accumulated?: number;
}
