import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema }, // Đăng ký Product Model
    ]),
    UsersModule,
    InventoryModule,
    CouponsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
