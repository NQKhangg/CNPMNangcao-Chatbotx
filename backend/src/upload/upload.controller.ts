import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigService } from '@nestjs/config';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Thư mục lưu file (Tạo thủ công thư mục này ở root backend)
        filename: (req, file, callback) => {
          // Đổi tên file ngẫu nhiên để tránh trùng
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Giới hạn 5MB
          // new FileTypeValidator({ fileType: 'image' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // Trả về đường dẫn file để Frontend hiển thị
    return {
      url: `${this.configService.get<string>('BACKEND_URL')}/${file.filename}`,
    };
  }
}
