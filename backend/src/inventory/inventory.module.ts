import { forwardRef, Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryLog, InventoryLogSchema } from './entities/inventory.entity';
import { Product, ProductSchema } from 'src/products/entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { OrdersModule } from 'src/orders/orders.module';
import { SuppliersModule } from 'src/suppliers/suppliers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    UsersModule,
    forwardRef(() => OrdersModule),
    SuppliersModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
