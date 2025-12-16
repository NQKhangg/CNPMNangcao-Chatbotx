import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (DTOs) ---

// Payload khi nhập hàng
export interface ImportGoodsDto {
  productId: string;
  quantity: number;
  supplierId?: string; // Tùy chọn: Nhập từ nhà cung cấp nào
  importPrice?: number; // Tùy chọn: Giá nhập
  note?: string;
}

// Payload khi hủy/xuất hủy hàng
export interface DiscardGoodsDto {
  productId: string;
  quantity: number;
  reason: string; // Lý do hủy (hỏng, hết hạn...)
  note?: string;
}

// --- 2. SERVICE ---

export const inventoryService = {
  // ==========================================
  // THAO TÁC KHO (ACTIONS)
  // ==========================================

  /**
   * Nhập hàng vào kho (Inbound)
   * Endpoint: POST /inventory/import
   */
  importGoods: async (data: ImportGoodsDto) => {
    const res = await api.post("/inventory/import", data);
    return res.data;
  },

  /**
   * Hủy hàng / Xuất hủy (Outbound - Discard)
   * Endpoint: POST /inventory/discard
   */
  discardGoods: async (data: DiscardGoodsDto) => {
    const res = await api.post("/inventory/discard", data);
    return res.data;
  },

  // ==========================================
  // TRA CỨU (QUERIES)
  // ==========================================

  /**
   * Lấy lịch sử biến động kho (Logs)
   * page Trang hiện tại
   * limit Số lượng record/trang
   * keyword Tìm kiếm theo tên sản phẩm hoặc mã SKU
   */
  getLogs: async (
    page: number = 1,
    limit: number = 10,
    keyword: string = ""
  ) => {
    const res = await api.get("/inventory/logs", {
      params: {
        page,
        limit,
        keyword,
      },
    });
    // { data: Log[], total, page, lastPage }
    return res.data;
  },
};
