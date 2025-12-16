import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface AuditLog {
  _id: string;
  action: string; // Hành động (CREATE, UPDATE, DELETE)
  collectionName: string; // Tên bảng bị tác động
  documentId: string; // ID của bản ghi bị tác động
  actor: {
    // Người thực hiện
    _id: string;
    email: string;
  };
  oldValue?: any; // Dữ liệu cũ
  newValue?: any; // Dữ liệu mới
  createdAt: string;
}

// --- 2. SERVICE ---

export const logService = {
  /**
   * Lấy danh sách nhật ký hoạt động (Audit Logs)
   * Có hỗ trợ phân trang, tìm kiếm và lọc theo ngày.
   * page Trang hiện tại (Mặc định 1)
   * limit Số lượng bản ghi/trang (Mặc định 10)
   * keyword Từ khóa tìm kiếm (Email người thao tác, Hành động...)
   * fromDate Ngày bắt đầu (Format: YYYY-MM-DD)
   * toDate Ngày kết thúc (Format: YYYY-MM-DD)
   */
  getAll: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = "",
    fromDate: string = "",
    toDate: string = ""
  ) => {
    const params = {
      page,
      limit,
      keyword,
      fromDate,
      toDate,
    };

    const res = await api.get("/audit-logs", { params });

    // { data: AuditLog[], total, page, lastPage }
    return res.data;
  },
};
