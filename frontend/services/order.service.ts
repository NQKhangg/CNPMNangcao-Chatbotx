import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

export interface OrderAddress {
  city: string;
  district: string;
  ward: string;
  street: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: OrderAddress;
  note?: string;
}

// Item trong đơn hàng
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  customerInfo: CustomerInfo;
  items: OrderItem[] | any[];
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID";
  totalAmount: number;
  createdAt?: string;
}

// Payload khi tạo đơn
export interface CreateOrderDto {
  customerInfo: CustomerInfo;
  items: { productId: string; quantity: number }[];
  paymentMethod: string;
  couponCodes?: string[];
}

// Response khi lấy danh sách phân trang
interface OrderResponse {
  data: Order[];
  total: number;
  page: number;
  lastPage: number;
}

// --- 2. SERVICE ---

export const orderService = {
  // ==========================================
  // CUSTOMER (Dành cho Khách hàng)
  // ==========================================

  /**
   * Tạo đơn hàng mới
   * Endpoint: POST /orders
   */
  createOrder: async (orderData: CreateOrderDto) => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  /**
   * Lấy danh sách đơn hàng của tôi
   * Endpoint: GET /orders/my-orders
   */
  findByUser: async () => {
    const response = await api.get("/orders/my-orders");
    return response.data;
  },

  /**
   * Lấy chi tiết đơn hàng
   * Endpoint: GET /orders/:id
   */
  getOrderById: async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Khách hàng tự hủy đơn (Khi đơn chưa được xác nhận)
   * Endpoint: PUT /orders/:id/cancel
   */
  cancelOrder: async (orderId: string) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
  },

  // ==========================================
  // ADMIN (Dành cho Quản trị viên)
  // ==========================================

  /**
   * Lấy tất cả đơn hàng
   */
  getAllOrders: async (page = 1, limit = 10, keyword = "") => {
    const response = await api.get<OrderResponse>("/orders", {
      params: { page, limit, keyword },
    });
    return response.data;
  },

  /**
   * Lấy lịch sử đơn hàng của một User cụ thể
   */
  getAllOrdersByUserId: async (userId: string) => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  /**
   * Cập nhật trạng thái đơn hàng (Ví dụ: Duyệt đơn, Đang giao...)
   */
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Cập nhật trạng thái thanh toán (Ví dụ: Đã thanh toán)
   */
  updatePaymentStatus: async (id: string, paymentStatus: string) => {
    const response = await api.put(`/orders/${id}/payment-status`, {
      paymentStatus,
    });
    return response.data;
  },

  /**
   * Admin hủy đơn hàng
   */
  adminCancelOrder: async (id: string) => {
    const response = await api.put(`/orders/${id}/admin-cancel`);
    return response.data;
  },
};
