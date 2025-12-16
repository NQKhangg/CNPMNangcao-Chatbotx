import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyReviewDto {
  @IsNotEmpty({ message: 'Nội dung trả lời không được để trống' })
  @IsString()
  @MaxLength(1000, { message: 'Nội dung trả lời không quá 1000 ký tự' })
  replyComment: string;
}
