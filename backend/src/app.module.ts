import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RolesModule } from './roles/roles.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ContactModule } from './contacts/contacts.module';
import { BlogsModule } from './blogs/blogs.module';
import { StatisticsModule } from './statistics/statistics.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CategoriesModule } from './categories/categories.module';
import { DepartmentsModule } from './departments/departments.module';
import { WebhookModule } from './webhook/webhook.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // 1. Cấu hình ConfigModule đọc file .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Cấu hình Mongoose (MongoDB) dùng ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Cách lấy biến chuẩn: configService.get('KEY')
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    // 3. Cấu hình JWT Global
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),

    // CẤU HÌNH ĐỂ PUBLIC THƯ MỤC UPLOADS
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Trỏ ra thư mục uploads ở root
      serveRoot: '/uploads', // Ví dụ đường dẫn truy cập: http://localhost:4000/uploads/ten-file.jpg
      serveStaticOptions: {
        // Cho phép CORS cho file tĩnh (ảnh)
        setHeaders: (res) => {
          res.set('Access-Control-Allow-Origin', '*');
        },
      },
    }),
    AuthModule,
    RolesModule,
    ProductsModule,
    OrdersModule,
    UsersModule,
    MailModule,
    UploadModule,
    AuditLogsModule,
    InventoryModule,
    SuppliersModule,
    ContactModule,
    BlogsModule,
    StatisticsModule,
    CouponsModule,
    ReviewsModule,
    CategoriesModule,
    DepartmentsModule,
    WebhookModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
