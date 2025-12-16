import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface Permission {
  resource: string; // VD: 'products', 'users'
  actions: string[]; // VD: ['CREATE', 'READ', 'UPDATE']
}

export interface Role {
  _id: string;
  name: string;
  permissions: Permission[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload khi tạo/sửa Role
export interface CreateRoleDto {
  name: string;
  permissions: Permission[];
}

// --- 2. SERVICE ---

export const roleService = {
  /**
   * Lấy danh sách Tài nguyên hệ thống (Resources)
   * VD: Products, Orders, Customers...
   */
  getResource: async () => {
    const res = await api.get("/roles/resource");
    return res.data; // Trả về Enum Resource
  },

  /**
   * Lấy danh sách Hành động (Actions)
   * VD: CREATE, READ, UPDATE, DELETE
   */
  getAction: async () => {
    const res = await api.get("/roles/action");
    return res.data; // Trả về Enum Action
  },

  // ==========================================
  // CRUD ROLES (Quản lý vai trò)
  // ==========================================

  /**
   * Lấy tất cả Roles
   */
  getAll: async () => {
    const res = await api.get<Role[]>("/roles");
    return res.data;
  },

  /**
   * Tạo Role mới
   */
  create: async (data: CreateRoleDto) => {
    const res = await api.post("/roles", data);
    return res.data;
  },

  /**
   * Cập nhật Role (Tên và Quyền hạn)
   */
  update: async (roleId: string, data: CreateRoleDto) => {
    const res = await api.put(`/roles/${roleId}`, data);
    return res.data;
  },

  /**
   * Xóa Role
   */
  delete: async (roleId: string) => {
    const res = await api.delete(`/roles/${roleId}`);
    return res.data;
  },
};
