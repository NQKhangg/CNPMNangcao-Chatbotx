import api from "@/lib/axios";
import { User } from "./user.service";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Department {
  _id: string;
  name: string;
  description?: string;
  manager?: User | string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload dùng cho Create/Update (Loại bỏ các trường hệ thống)
export type DepartmentPayload = Omit<
  Department,
  "_id" | "createdAt" | "updatedAt"
>;

// --- 2. SERVICE ---

export const departmentService = {
  /**
   * Lấy danh sách phòng ban
   * page Trang hiện tại (mặc định 1)
   * limit Số lượng/trang (mặc định 10)
   * keyword Từ khóa tìm kiếm
   */
  getAll: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get("/departments", {
      params: {
        page: page,
        limit: limit,
        keyword: keyword,
      },
    });
    // { data: Department[], total, page, lastPage }
    return res.data;
  },

  /**
   * Tạo phòng ban mới
   */
  create: async (data: Partial<DepartmentPayload>) => {
    const res = await api.post("/departments", data);
    return res.data;
  },

  /**
   * Cập nhật thông tin phòng ban
   * id ID phòng ban
   * data Dữ liệu cần sửa
   */
  update: async (id: string, data: Partial<DepartmentPayload>) => {
    // Đảm bảo không gửi _id trong body update để tránh lỗi
    const { ...payload } = data as any;
    delete payload._id;

    const res = await api.put(`/departments/${id}`, payload);
    return res.data;
  },

  /**
   * Cập nhật nhanh trạng thái (Kích hoạt / Khóa)
   */
  updateActive: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/departments/${id}/active`, { isActive });
    return res.data;
  },

  /**
   * Xóa phòng ban
   */
  delete: async (id: string) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};
