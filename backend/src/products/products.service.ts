import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { isValidObjectId, Model } from 'mongoose';
import { InventoryService } from 'src/inventory/inventory.service';
import {
  Category,
  CategoryDocument,
} from 'src/categories/entities/category.entity';
import { UpdateProductDto } from './dtos/update-product.dto';
import { InventoryType } from 'src/inventory/enums/inventory_type.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private inventoryService: InventoryService, // Để ghi log kho
  ) {}

  /**
   * Tạo sản phẩm mới
   * Đồng thời tạo log nhập kho (Inventory Log) khởi tạo
   */
  async create(createProductDto: CreateProductDto, actor: any) {
    const createProduct = await this.productModel.create(createProductDto);

    // Ghi log Inventory: Khởi tạo tồn kho = 0 (Hoặc số lượng nếu DTO có)
    await this.inventoryService.adjustStock(
      createProduct._id.toString(),
      createProductDto.stock ? createProductDto.stock : 0,
      InventoryType.IMPORT,
      'Khởi tạo sản phẩm mới',
      {
        userId: actor?.userId || 'Unknown',
        email: actor?.email || 'Unknown',
        role: actor?.role || 'Unknown',
      },
      undefined,
      createProductDto.supplier
        ? createProductDto.supplier.toString()
        : undefined,
      createProductDto.sku,
    );
    return createProduct;
  }

  /**
   * Lấy danh sách sản phẩm (Advanced Search)
   * Tìm theo tên, giá, sao, danh mục...
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    keyword?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    category?: string,
    sort: string = 'newest',
    role: string = 'Customer',
  ) {
    // 1. Tạo bộ lọc cơ bản (Chỉ lấy SP chưa xóa)
    const filter: any = { isDeleted: false };
    if (role === 'Customer') filter.isAvailable = true;

    // 2. Logic tìm kiếm từ khóa (Keyword)
    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword, 'i'); // Regex không phân biệt hoa thường
      const isNumber = !isNaN(Number(keyword));

      // Mặc định tìm theo Tên hoặc SKU
      filter.$or = [{ name: regex }, { sku: regex }];

      // Nếu keyword là số -> Tìm thêm theo Giá hoặc Tồn kho
      if (isNumber) {
        filter.$or.push({ price: Number(keyword) }, { stock: Number(keyword) });
      }
    }

    // 3. Lọc theo khoảng giá (Min - Max)
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // 4. Lọc theo đánh giá sao (Rating)
    if (minRating && minRating > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    // 5. Lọc theo Danh mục (Category Name -> ID)
    if (category && category.trim() !== '' && category !== 'Tất cả') {
      // Tìm Category ID dựa trên tên (Regex cho phép tìm gần đúng)
      const foundCat = await this.categoryModel.findOne({
        name: { $regex: new RegExp(`^${category}$`, 'i') },
      });

      if (foundCat) {
        filter.category = foundCat._id; // Lọc theo ID tìm được
      } else {
        // Nếu tên danh mục không tồn tại -> Trả về rỗng luôn
        return { data: [], total: 0, page, lastPage: 0 };
      }
    }

    // 6. Xử lý Sắp xếp (Sort)
    let sortOption: any = { createdAt: -1, _id: -1 }; // Mặc định: Mới nhất

    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break; // Giá tăng
      case 'price_desc':
        sortOption = { price: -1 };
        break; // Giá giảm
      case 'oldest':
        sortOption = { createdAt: 1 };
        break; // Cũ nhất
      case 'best_selling':
        sortOption = { sold: -1 };
        break; // Bán chạy nhất (Thêm cái này nếu cần)
    }

    const skip = (page - 1) * limit;

    // 7. Chạy Query song song (Data + Count)
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .populate('category', 'name slug') // Join bảng Category lấy tên
        .populate('supplier', 'name') // Join bảng Supplier lấy tên
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Xem chi tiết
  async findOne(idOrSlug: string) {
    // Validate ID
    // Kiểm tra xem chuỗi gửi lên có phải là ID (ObjectId) không?
    if (isValidObjectId(idOrSlug)) {
      const product = await this.productModel
        .findById(idOrSlug)
        .populate('category', 'name slug')
        .populate('supplier', 'name')
        .exec();
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
      return product;
    }

    // Nếu không phải ID -> Tìm theo Slug
    const product = this.productModel
      .findOne({ slug: idOrSlug, isDeleted: false })
      .populate('category', 'name slug')
      .populate('supplier', 'name')
      .exec();

    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

    return product;
  }

  /**
   * Tìm sản phẩm khuyến mãi (On Sale)
   * Logic: Giá bán < Giá gốc
   */
  async findOnSale(page: number, limit: number = 12) {
    const skip = (page - 1) * limit;

    // 1. Tạo bộ lọc
    const filter: any = {
      isDeleted: false,
      isAvailable: true,
      originalPrice: { $gt: 0 }, // Giá gốc phải > 0

      // $expr
      // Cho phép so sánh 2 field trong cùng 1 document ngay trong lệnh find()
      $expr: { $lt: ['$price', '$originalPrice'] },
    };

    // 2. Lấy dữ liệu + Đếm tổng
    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug')
        .populate('supplier', 'name')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    // 3. Trả về kết quả
    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Cập nhật sản phẩm
   * Trả về { oldData, newData } để Audit Log ghi lại sự thay đổi
   */
  async update(id: string, updateProductDto: UpdateProductDto, actor: any) {
    const oldProduct = await this.productModel.findById(id).lean();

    const newProduct = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true },
    );

    return { oldData: oldProduct, newData: newProduct };
  }

  /**
   * Xóa mềm sản phẩm
   */
  async remove(id: string) {
    const deletedProduct = await this.productModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });

    return deletedProduct;
  }
}
