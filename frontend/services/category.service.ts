import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload khi tạo/sửa: Loại bỏ các trường hệ thống không được phép gửi lên
type CategoryPayload = Omit<Category, "_id" | "createdAt" | "updatedAt">;

// --- 2. SERVICE ---

export const categoryService = {
  // ==========================================
  // PUBLIC (Dành cho Customer/Guest)
  // ==========================================

  /**
   * Lấy danh sách danh mục (Thường dùng cho Menu/Trang chủ)
   * Chỉ lấy các danh mục đang Active
   */
  getAll: async () => {
    const res = await api.get<Category[]>("/categories");
    return res.data;
  },

  // ==========================================
  // ADMIN (Dành cho Quản trị viên)
  // ==========================================

  /**
   * Lấy danh sách danh mục có phân trang & tìm kiếm
   * Bao gồm cả danh mục ẩn để quản lý
   */
  getAllAdmin: async (page = 1, limit = 10, keyword = "") => {
    const res = await api.get("/categories/admin", {
      params: { page, limit, keyword },
    });
    return res.data; // Trả về { data, total, page, lastPage }
  },

  /**
   * Tạo danh mục mới
   */
  create: async (data: Partial<CategoryPayload>) => {
    const res = await api.post("/categories", data);
    return res.data;
  },

  /**
   * Cập nhật thông tin danh mục
   */
  update: async (id: string, data: any) => {
    // 1. Loại bỏ các trường hệ thống để tránh lỗi 400
    const { _id, isDeleted, createdAt, updatedAt, __v, ...safeData } = data;

    // 2. Gửi dữ liệu sạch lên server
    const res = await api.put(`/categories/${id}`, safeData);
    return res.data;
  },

  /**
   * Cập nhật nhanh trạng thái (Ẩn/Hiện)
   */
  updateActive: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/categories/${id}/active`, { isActive });
    return res.data;
  },

  /**
   * Xóa danh mục
   */
  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
