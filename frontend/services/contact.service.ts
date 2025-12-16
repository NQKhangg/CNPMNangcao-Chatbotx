import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

// Cấu trúc dữ liệu của một liên hệ trong Database
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "PENDING" | "REPLIED"; // Trạng thái xử lý
  replyContent?: string; // Nội dung admin đã trả lời
  createdAt: string;
  updatedAt: string;
}

// Payload khi khách hàng gửi liên hệ (DTO)
export interface CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// --- 2. SERVICE ---

export const contactService = {
  // ==========================================
  // PUBLIC (Dành cho Khách hàng)
  // ==========================================

  /**
   * Gửi thư liên hệ mới
   * Endpoint: POST /contacts
   */
  create: async (data: CreateContactDto) => {
    const res = await api.post("/contacts", data);
    return res.data;
  },

  // ==========================================
  // ADMIN (Dành cho Quản trị viên)
  // ==========================================

  /**
   * Lấy danh sách liên hệ
   * page Trang hiện tại (Mặc định 1)
   * limit Số lượng mỗi trang (Mặc định 10)
   * keyword Từ khóa tìm kiếm (Tên hoặc Email)
   */
  getAll: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get("/contacts", {
      params: { page, limit, keyword },
    });
    return res.data; // Trả về { data: Contact[], total, page, lastPage }
  },

  /**
   * Trả lời thư liên hệ (Gửi email phản hồi)
   * Endpoint: POST /contacts/:id/reply
   * id ID của liên hệ
   * content Nội dung trả lời
   */
  reply: async (id: string, content: string) => {
    const res = await api.post(`/contacts/${id}/reply`, { content });
    return res.data;
  },

  /**
   * Xóa liên hệ
   */
  delete: async (id: string) => {
    const res = await api.delete(`/contacts/${id}`);
    return res.data;
  },
};
