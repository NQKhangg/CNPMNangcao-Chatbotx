import api from "@/lib/axios";
import { Supplier } from "./supplier.service";
import { Category } from "./category.service";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Nutrition {
  label: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  category: Category | string;
  supplier?: Supplier | string;
  tags?: string[];
  thumbnail: string;
  images: string[];
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string;
  shortDescription: string;
  description?: string;
  origin?: string;
  brand?: string;
  preservation?: string;
  nutrition?: Nutrition[];
  rating?: number;
  reviewsCount?: number;
  sold?: number;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload dùng cho Create/Update (Loại bỏ các trường hệ thống không được phép sửa thủ công)
type ProductPayload = Omit<
  Product,
  | "_id"
  | "createdAt"
  | "updatedAt"
  | "__v"
  | "slug"
  | "rating"
  | "reviewsCount"
  | "sold"
>;

// Interface cho Response trả về từ API
interface ProductResponse {
  data: Product[];
  total: number;
  page: number;
  lastPage: number;
}

// Interface cho các tham số lọc/tìm kiếm
interface ProductParams {
  page?: number;
  limit?: number;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  category?: string;
  sort?: string;
}

// --- 2. SERVICE ---

export const productService = {
  // ==========================================
  // READ (Lấy dữ liệu)
  // ==========================================

  /**
   * Lấy danh sách sản phẩm
   */
  getAll: async (params: ProductParams) => {
    // Xử lý logic lọc Category "Tất cả" trước khi gửi request
    const categoryFilter = params.category === "Tất cả" ? "" : params.category;

    const res = await api.get<ProductResponse>("/products", {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        keyword: params.keyword || "",
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        minRating: params.minRating,
        category: categoryFilter,
        sort: params.sort || "newest",
      },
    });
    return res.data;
  },

  /**
   * Lấy chi tiết sản phẩm theo ID
   */
  getById: async (id: string) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Lấy danh sách sản phẩm đang giảm giá (On Sale)
   */
  getProductSale: async (page: number, limit: number = 12) => {
    const res = await api.get("/products/on-sale", {
      params: { page, limit },
    });
    return res.data;
  },

  // ==========================================
  // WRITE (Thêm, Sửa, Xóa - Admin)
  // ==========================================

  /**
   * Tạo sản phẩm mới
   */
  create: async (data: Partial<ProductPayload>) => {
    // data Partial<ProductPayload> để tránh lỗi thiếu field optional
    const response = await api.post<Product>("/products", data);
    return response.data;
  },

  /**
   * Cập nhật sản phẩm
   */
  update: async (id: string, data: any) => {
    // 1. Tách các trường hệ thống ra khỏi dữ liệu update
    const { _id, __v, createdAt, updatedAt, slug, ...updateData } = data;

    // 2. Làm sạch dữ liệu Nutrition (Lọc bỏ các dòng rỗng label hoặc value)
    if (updateData.nutrition && Array.isArray(updateData.nutrition)) {
      updateData.nutrition = updateData.nutrition.filter(
        (n: Nutrition) => n.label?.trim() && n.value?.trim()
      );
    }

    const response = await api.put<Product>(`/products/${id}`, updateData);
    return response.data;
  },

  /**
   * Xóa sản phẩm
   */
  remove: async (id: string) => {
    const response = await api.delete<void>(`/products/${id}`);
    return response.data;
  },
};
