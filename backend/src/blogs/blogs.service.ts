import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dtos/create-blog.dto';
import { UpdateBlogDto } from './dtos/update-blog.dto';
import { Blog, BlogDocument } from './entities/blog.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class BlogsService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  /**
   * Tạo bài viết mới
   * userId của tác giả (lấy từ Token)
   */
  async create(createBlogDto: CreateBlogDto, userId: string) {
    return this.blogModel.create({
      ...createBlogDto,
      author: userId, // Gắn ID tác giả vào bài viết
    });
  }

  /**
   * Lấy danh sách bài viết đã xuất bản (Dành cho trang chủ/Khách)
   * Chỉ lấy bài có isPublished: true và chưa bị xóa
   */
  async findPublished(page: number, limit: number) {
    // 1. Xử lý phân trang
    const skip = (page - 1) * limit;

    // 2. Điều kiện lọc: Đã xuất bản & Chưa xóa
    const filter = {
      isDeleted: false,
      isPublished: true,
    };

    // 3. Chạy song song 2 câu lệnh để tối ưu tốc độ (Promise.all)
    const [data, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('author', 'name email avatar') // Lấy thông tin tác giả
        .sort({ createdAt: -1, _id: -1 }) // Sắp xếp mới nhất (kèm _id để ổn định sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(filter), // Đếm tổng số bài viết thỏa điều kiện
    ]);

    // 4. Trả về kết quả
    return {
      data,
      total,
      page: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy tất cả bài viết (Dành cho Admin quản lý)
   * Bao gồm cả bài Nháp (Draft), hỗ trợ tìm kiếm
   */
  async findAll(page: number, limit: number, keyword: string) {
    // 1. Xử lý phân trang
    const skip = (page - 1) * limit;

    // 2. Tạo bộ lọc cơ bản
    const filter: any = { isDeleted: false };

    // 3. Nếu có từ khóa -> Thêm điều kiện tìm kiếm ($or)
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), 'i'); // 'i': Không phân biệt hoa thường
      filter.$or = [
        { title: regex }, // Tìm trong tiêu đề
        { shortDescription: regex }, // Tìm trong mô tả ngắn
        { category: regex }, // Tìm trong danh mục
        { tags: regex }, // Tìm trong tags
        { slug: regex }, // Tìm trong slug
      ];
    }

    // 4. Chạy Query song song
    const [data, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .populate('author', 'name email avatar')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Xem chi tiết một bài viết
   */
  async findOne(idOrSlug: string) {
    // Validate ID
    // Kiểm tra xem chuỗi gửi lên có phải là ID (ObjectId) không?
    if (isValidObjectId(idOrSlug)) {
      const blog = await this.blogModel
        .findById(idOrSlug)
        .populate('author', 'name email avatar') // Lấy thông tin tác giả
        .exec();
      if (!blog || blog.isDeleted) {
        throw new NotFoundException('Bài viết không tồn tại');
      }
      return blog;
    }

    // Nếu không phải ID -> Tìm theo Slug
    const blog = this.blogModel
      .findOne({ slug: idOrSlug, isDeleted: false })
      .populate('author', 'name email avatar') // Lấy thông tin tác giả
      .exec();

    if (!blog) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    return blog;
  }

  /**
   * Cập nhật bài viết
   * { new: true } -> Trả về dữ liệu MỚI sau khi update
   */
  async update(id: string, updateBlogDto: UpdateBlogDto) {
    if (!isValidObjectId(id)) throw new NotFoundException('ID không hợp lệ');
    const oldBlog = await this.blogModel.findById(id).lean().exec();
    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      id,
      updateBlogDto,
      { new: true },
    );

    if (!updatedBlog)
      throw new NotFoundException('Không tìm thấy bài viết để sửa');
    return {
      oldData: oldBlog,
      newData: updatedBlog,
    };
  }

  /**
   * Xóa mềm bài viết (Soft Delete)
   * Set isDeleted = true không xóa khỏi DB
   */
  async remove(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('ID không hợp lệ');

    // Đồng thời set isPublished = false để ẩn khỏi trang chủ
    const deletedBlog = await this.blogModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isPublished: false,
    });

    if (!deletedBlog)
      throw new NotFoundException('Không tìm thấy bài viết để xóa');
    return deletedBlog;
  }
}
