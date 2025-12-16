import api from "@/lib/axios";
import { Product } from "./product.service";

// ==========================================
// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES)
// ==========================================

// Sub-document: Địa chỉ giao hàng
export interface UserAddress {
  label?: string; // VD: Nhà riêng, Công ty
  address: string;
  phone: string;
  receiverName: string;
  isDefault: boolean;
}

// Main Document: User
export interface User {
  _id: string;
  name: string;
  email: string;
  roleId: { _id: string; name: string } | string;

  // Thông tin cá nhân
  phone?: string;
  avatar?: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string; // ISO Date String
  addresses?: UserAddress[];

  // Thông tin nhân viên
  employeeCode?: string;
  department?: string;

  // Trạng thái hệ thống
  isActive: boolean;
  isDelete: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Payload khi tạo/sửa User (Loại bỏ các trường hệ thống)
type UserPayload = Partial<
  Omit<User, "_id" | "createdAt" | "updatedAt" | "roleId">
>;

// Response cho danh sách phân trang
interface UserResponse {
  data: User[];
  total: number;
  page: number;
  lastPage: number;
}

// ==========================================
// 2. USER SERVICE
// ==========================================

export const userService = {
  // ------------------------------------------------
  // A. CÁ NHÂN (CURRENT USER PROFILE)
  // ------------------------------------------------

  /**
   * Lấy thông tin cá nhân của người đang đăng nhập
   * Endpoint: GET /users/profile
   */
  getProfile: async () => {
    const res = await api.get<User>("/users/profile");
    return res.data;
  },

  /**
   * Người dùng tự cập nhật hồ sơ
   * Endpoint: PUT /users/profile
   */
  updateProfile: async (data: UserPayload) => {
    const res = await api.put("/users/profile", data);
    return res.data;
  },

  /**
   * Lấy danh sách yêu thích
   */
  getWishlist: async (page: number, limit: number = 8) => {
    const res = await api.get<Product[]>("/users/wishlist", {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * Thêm/Xóa sản phẩm khỏi danh sách yêu thích
   */
  toggleWishlist: async (productId: string) => {
    const res = await api.post(`/users/wishlist/${productId}`);
    return res.data;
  },

  // ------------------------------------------------
  // B. QUẢN LÝ KHÁCH HÀNG (ADMIN/MANAGER)
  // ------------------------------------------------

  /**
   * Lấy danh sách khách hàng (Có phân trang)
   */
  getCustomers: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get<UserResponse>("/users/customers", {
      params: { page, limit, keyword },
    });
    return res.data;
  },

  // ------------------------------------------------
  // C. QUẢN LÝ NHÂN VIÊN (ADMIN ONLY)
  // ------------------------------------------------

  /**
   * Lấy danh sách nhân viên
   */
  getStaffs: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get("/users/staffs", {
      params: { page, limit, keyword },
    });
    return res.data; // { data: User[], total... }
  },

  /**
   * Tạo nhân viên mới
   */
  createStaff: async (userData: UserPayload) => {
    const res = await api.post("/users/staff", userData);
    return res.data;
  },

  // ------------------------------------------------
  // D. THAO TÁC CHUNG / QUẢN TRỊ (COMMON ADMIN ACTIONS)
  // ------------------------------------------------

  /**
   * Lấy tất cả user
   */
  getAll: async () => {
    const res = await api.get<User[]>("/users");
    return res.data;
  },

  /**
   * Lấy chi tiết user theo ID
   */
  getById: async (id: string) => {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },

  /**
   * Admin sửa thông tin user bất kỳ
   */
  updateUser: async (id: string, data: UserPayload) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },

  /**
   * Khóa / Mở khóa tài khoản
   */
  updateStatus: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/users/${id}/status`, { isActive });
    return res.data;
  },

  /**
   * Phân quyền (Đổi Role)
   */
  updateRole: async (id: string, roleId: string) => {
    const res = await api.put(`/users/${id}/role`, { role: roleId });
    return res.data;
  },

  /**
   * Xóa user
   */
  remove: async (id: string) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  // ------------------------------------------------
  // E. BẢO MẬT & MẬT KHẨU (ACCOUNT SECURITY)
  // ------------------------------------------------

  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (data: { newPassword: string; resetToken: string }) => {
    const res = await api.put("/auth/reset-password", data);
    return res.data;
  },
};

// ==========================================
// 3. UPLOAD SERVICE
// ==========================================

export const uploadService = {
  /**
   * Upload ảnh lên server
   * file File ảnh từ input
   */
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(res.data.url);
    return res.data.url; // Backend trả về { url: "https://..." }
  },
};
