import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  thumbnail: string;
  category: string;
  tags?: string[];
  isPublished: boolean;
  author?: { _id: string; name: string; avatar?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

// DTO (Data Transfer Object) cho Create/Update
// Omit loại bỏ các trường hệ thống không được phép sửa thủ công
type BlogPayload = Omit<
  Blog,
  "_id" | "createdAt" | "updatedAt" | "author" | "__v"
>;

// --- 2. HELPERS (Hàm hỗ trợ) ---

/**
 * Hàm lọc bỏ các trường hệ thống (System fields) khỏi payload
 * Giúp tránh lỗi 400 Bad Request khi gửi nhầm _id hoặc author lên server
 */
const sanitizePayload = (data: any): BlogPayload => {
  const { _id, createdAt, updatedAt, __v, author, ...cleanData } = data;
  return cleanData;
};

// --- 3. SERVICE ---

export const blogService = {
  // ==========================================
  // ADMIN (QUẢN LÝ)
  // ==========================================

  /**
   * Lấy danh sách bài viết (Có phân trang & tìm kiếm)
   * page Trang hiện tại
   * limit Số lượng mỗi trang
   * keyword Từ khóa tìm kiếm (Title)
   */
  getAll: async (page: number, limit: number, keyword: string) => {
    const res = await api.get("/blogs", {
      params: { page, limit, keyword },
    });
    return res.data; // Trả về { data: Blog[], total, lastPage... }
  },

  /**
   * Tạo bài viết mới
   */
  create: async (data: Partial<Blog>) => {
    const payload = sanitizePayload(data);
    const res = await api.post("/blogs", payload);
    return res.data;
  },

  /**
   * Cập nhật bài viết
   */
  update: async (id: string, data: Partial<Blog>) => {
    const payload = sanitizePayload(data);
    const res = await api.put(`/blogs/${id}`, payload);
    return res.data;
  },

  /**
   * Xóa bài viết
   */
  delete: async (id: string) => {
    const res = await api.delete(`/blogs/${id}`);
    return res.data;
  },

  // ==========================================
  // PUBLIC / CUSTOMER (HIỂN THỊ)
  // ==========================================

  /**
   * Lấy danh sách bài viết ĐÃ XUẤT BẢN (Cho trang tin tức khách hàng)
   */
  getPublished: async (page: number, limit: number = 9) => {
    const res = await api.get<Blog[]>("/blogs/published", {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * Xem chi tiết bài viết (Theo ID)
   */
  getById: async (id: string) => {
    const res = await api.get<Blog>(`/blogs/${id}`);
    return res.data;
  },

  /**
   * (Tùy chọn) Xem chi tiết theo Slug cho URL
   * VD: api.get('/blogs/slug/tieu-de-bai-viet')
   */
  getBySlug: async (slug: string) => {
    const res = await api.get<Blog>(`/blogs/slug/${slug}`);
    return res.data;
  },
};
