import api from "@/lib/axios";
import { Product } from "./product.service";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

// Cấu trúc dữ liệu Review trả về từ Backend
export interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar: string;
  };
  productId: Product | string;
  rating: number;
  comment: string;
  images: string[];
  replyComment?: string; // Phản hồi của admin
  repliedAt?: string; // Thời gian phản hồi
  isHidden?: boolean; // Trạng thái ẩn/hiện
  createdAt: string;
}

// Payload khi tạo đánh giá mới
export interface CreateReviewDto {
  productId: string;
  rating: number;
  comment: string;
  images?: string[]; // Thêm tùy chọn ảnh nếu có
}

// Payload khi sửa đánh giá
export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
  images?: string[];
}

// --- 2. SERVICE ---

export const reviewService = {
  // ==========================================
  // CUSTOMER (Dành cho Khách hàng)
  // ==========================================

  /**
   * Tạo đánh giá mới
   * Endpoint: POST /reviews
   */
  create: async (data: CreateReviewDto) => {
    const res = await api.post("/reviews", data);
    return res.data;
  },

  /**
   * Lấy danh sách đánh giá theo sản phẩm
   * Endpoint: GET /reviews/product/:productId
   */
  getByProduct: async (productId: string) => {
    const res = await api.get<Review[]>(`/reviews/product/${productId}`);
    return res.data;
  },

  /**
   * Cập nhật đánh giá của chính mình
   * Endpoint: PATCH /reviews/:reviewId
   */
  update: async (reviewId: string, data: UpdateReviewDto) => {
    const payload = {
      rating: data.rating,
      comment: data.comment,
      images: data.images,
    };

    const res = await api.patch(`/reviews/${reviewId}`, payload);
    return res.data;
  },

  // ==========================================
  // ADMIN (Dành cho Quản trị viên)
  // ==========================================

  /**
   * Admin trả lời đánh giá
   * Endpoint: PUT /reviews/:reviewId/reply
   */
  reply: async (reviewId: string, replyComment: string) => {
    const res = await api.put(`/reviews/${reviewId}/reply`, { replyComment });
    return res.data;
  },

  /**
   * Admin ẩn/hiện đánh giá (Kiểm duyệt nội dung)
   * Endpoint: PATCH /reviews/:reviewId/toggle-hidden
   */
  toggleHidden: async (reviewId: string) => {
    const res = await api.patch(`/reviews/${reviewId}/toggle-hidden`);
    return res.data;
  },
};
