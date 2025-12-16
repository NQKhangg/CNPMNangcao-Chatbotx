import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: "PERCENT" | "AMOUNT";
  value: number;
  minOrderValue: number;
  expiryDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
}

// Payload khi tạo mới/cập nhật (Loại bỏ các trường hệ thống)
type CouponPayload = Omit<Coupon, "_id" | "usedCount">;

// --- 2. SERVICE ---

export const couponService = {
  // ==========================================
  // PUBLIC / CUSTOMER (Dành cho Khách hàng)
  // ==========================================

  /**
   * Lấy danh sách mã đang hoạt động (Hiển thị ngoài trang chủ/giỏ hàng)
   */
  getActiveCoupons: async () => {
    const res = await api.get<Coupon[]>("/coupons/active");
    return res.data;
  },

  /**
   * Kiểm tra mã giảm giá khi Checkout
   * code Mã voucher người dùng nhập
   */
  validateCode: async (code: string) => {
    // encodeURIComponent giúp xử lý các mã có ký tự đặc biệt (VD: "SALE/2024")
    const safeCode = encodeURIComponent(code.trim());
    const res = await api.get(`/coupons/validate/${safeCode}`);
    return res.data;
  },

  // ==========================================
  // ADMIN (Dành cho Quản trị viên)
  // ==========================================

  /**
   * Lấy danh sách tất cả mã
   */
  getAll: async (page: number, limit: number, keyword: string) => {
    const res = await api.get("/coupons", {
      params: { page, limit, keyword },
    });
    return res.data; // { data: Coupon[], total, lastPage... }
  },

  /**
   * Tạo mã giảm giá mới
   */
  create: async (formData: Partial<CouponPayload>) => {
    const res = await api.post("/coupons", formData);
    return res.data;
  },

  /**
   * Cập nhật thông tin mã
   * ID của mã giảm giá
   * formData Dữ liệu cần sửa
   */
  update: async (id: string, formData: any) => {
    // 1. Tách _id ra khỏi payload để tránh lỗi backend (immutable field)
    // 2. Các trường còn lại (safeData) sẽ được gửi đi
    const { _id, createdAt, updatedAt, ...safeData } = formData;

    const res = await api.put(`/coupons/${id}`, safeData);
    return res.data;
  },

  /**
   * Bật/Tắt trạng thái hoạt động nhanh (Active/Inactive)
   */
  updateActive: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/coupons/${id}/active`, {
      isActive: isActive,
    });
    return res.data;
  },

  /**
   * Xóa mã giảm giá
   */
  delete: async (id: string) => {
    const res = await api.delete(`/coupons/${id}`);
    return res.data;
  },
};
