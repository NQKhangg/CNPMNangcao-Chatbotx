import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardStats() {
    // Tổng doanh thu
    const revenue = await this.orderModel.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    // Tổng số đơn hàng
    const totalOrders = await this.orderModel.countDocuments();

    // Tổng số khách hàng
    const totalUsers = await this.userModel.countDocuments({
      isActive: true,
      isDeleted: false,
    });

    // Sản phẩm sắp hết hàng (stock < 10)
    const lowStockProducts = await this.productModel.countDocuments({
      stock: { $lt: 10 },
      isDeleted: false,
    });

    // Biểu đồ doanh thu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueChart = await this.orderModel.aggregate([
      {
        $match: {
          status: 'COMPLETED',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Sắp xếp tăng dần theo ngày
    ]);

    // Top 5 sản phẩm bán chạy
    const topProducts = await this.productModel
      .find({ isDeleted: false })
      .sort({ sold: -1 })
      .limit(5)
      .select('name sold thumbnail');

    // 5 Đơn hàng mới nhất
    const recentOrders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerInfo totalAmount status createdAt');

    return {
      summary: {
        revenue: revenue[0]?.total || 0,
        orders: totalOrders,
        users: totalUsers,
        lowStock: lowStockProducts,
      },
      charts: {
        revenue: revenueChart,
      },
      topProducts,
      recentOrders,
    };
  }
}
