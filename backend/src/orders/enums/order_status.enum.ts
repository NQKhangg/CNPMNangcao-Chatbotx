export enum OrderStatus {
  PENDING = 'PENDING', // Mới đặt, chờ xác nhận
  CONFIRMED = 'CONFIRMED', // Đã xác nhận, đang đóng gói
  SHIPPING = 'SHIPPING', // Đã giao cho shipper
  COMPLETED = 'COMPLETED', // Khách đã nhận
  CANCELLED = 'CANCELLED', // Hủy đơn
  RETURNED = 'RETURNED', // Trả hàng
}
