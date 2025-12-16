import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
