import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument } from './entities/review.entity';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ReplyReviewDto } from './dto/reply-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}
  async create(createReviewDto: CreateReviewDto, userId) {
    // Lưu Review
    const review = await this.reviewModel.create({
      ...createReviewDto,
      userId: new Types.ObjectId(userId), // Lưu ObjectId để dễ populate
      productId: new Types.ObjectId(createReviewDto.productId),
    });

    // Tính toán lại rating trung bình cho Product
    await this.updateProductRating(createReviewDto.productId);

    return review;
  }

  async updateProductRating(productId: string) {
    const stats = await this.reviewModel.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isHidden: false,
        },
      },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      // Có đánh giá -> Cập nhật số liệu thật
      await this.productModel.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avgRating * 10) / 10, // Làm tròn 1 chữ số thập phân (VD: 4.66 -> 4.7)
        reviewsCount: stats[0].nRating,
      });
    } else {
      // Không có đánh giá (hoặc đã xóa hết) -> Reset về 0
      await this.productModel.findByIdAndUpdate(productId, {
        rating: 0, // Hoặc 5 (nếu muốn mặc định đẹp)
        reviewsCount: 0,
      });
    }
  }

  // Lấy list review
  async findByProduct(productId: string) {
    return this.reviewModel
      .find({ productId: new Types.ObjectId(productId) })
      .populate('userId', 'name avatar email role')
      .sort({ createdAt: -1, _id: -1 })
      .exec();
  }

  /**
   * User tự sửa đánh giá của mình
   */
  async updateByUser(
    reviewId: string,
    updateDto: UpdateReviewDto,
    userId: string,
  ) {
    console.log(reviewId);
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      userId: new Types.ObjectId(userId), // Quan trọng: Đảm bảo chỉ sửa bài của chính mình
    });

    if (!review) {
      throw new NotFoundException(
        'Không tìm thấy đánh giá hoặc bạn không có quyền sửa',
      );
    }

    // Cập nhật
    if (updateDto.rating) review.rating = updateDto.rating;
    if (updateDto.comment) review.comment = updateDto.comment;
    if (updateDto.images) review.images = updateDto.images;

    const savedReview = await review.save();

    // Tính lại rating trung bình nếu có sửa điểm số
    if (updateDto.rating) {
      await this.updateProductRating(review.productId.toString());
    }

    return savedReview;
  }

  /**
   * Trả lời đánh giá
   */
  async replyReview(
    reviewId: string,
    replyDto: ReplyReviewDto,
    adminUser: any,
  ) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá này');
    }

    // Cập nhật thông tin trả lời
    review.replyComment = replyDto.replyComment;
    review.repliedBy = adminUser.userId; // Lưu ID người trả lời
    review.repliedAt = new Date(); // Lưu thời gian hiện tại

    return await review.save();
  }

  /**
   * Ẩn / Hiện đánh giá
   */
  async toggleHidden(reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá này');
    }

    // Đảo ngược trạng thái hiện tại (True -> False, False -> True)
    review.isHidden = !review.isHidden;
    const savedReview = await review.save();

    // Quan trọng: Tính lại rating sản phẩm sau khi ẩn/hiện
    // (Vì hàm updateProductRating của bạn đã có điều kiện $match isHidden: false)
    await this.updateProductRating(review.productId.toString());

    return savedReview;
  }
}
