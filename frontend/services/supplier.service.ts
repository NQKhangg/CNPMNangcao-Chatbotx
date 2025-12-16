import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  taxCode?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload dùng cho Create/Update (Loại bỏ các trường hệ thống)
export type SupplierPayload = Omit<
  Supplier,
  "_id" | "isDeleted" | "createdAt" | "updatedAt"
>;

// --- 2. SERVICE ---

export const supplierService = {
  /**
   * Lấy danh sách nhà cung cấp
   * page Trang hiện tại (Mặc định 1)
   * limit Số lượng/trang (Mặc định 10)
   * keyword Từ khóa tìm kiếm (Tên, SĐT, Email...)
   */
  getAll: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get("/suppliers", {
      params: {
        page,
        limit,
        keyword,
      },
    });
    // { data: Supplier[], total, page, lastPage }
    return res.data;
  },

  /**
   * Tạo nhà cung cấp mới
   */
  create: async (data: SupplierPayload) => {
    const res = await api.post("/suppliers", data);
    return res.data;
  },

  /**
   * Cập nhật thông tin nhà cung cấp
   */
  update: async (id: string, data: Partial<SupplierPayload>) => {
    // Đảm bảo không gửi _id lên body
    const { ...safeData } = data as any;
    delete safeData._id;

    const res = await api.put(`/suppliers/${id}`, safeData);
    return res.data;
  },

  /**
   * Xóa nhà cung cấp
   */
  delete: async (id: string) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  },
};
