export enum InventoryType {
  IMPORT = 'IMPORT', // Nhập hàng từ nhà cung cấp (+ tồn kho)
  SALE = 'SALE', // Xuất bán cho khách (- tồn kho)
  RETURN = 'RETURN', // Khách trả lại hàng (+ tồn kho)
  DAMAGED = 'DAMAGED', // Hàng hư hỏng/hết hạn (- tồn kho)
  ADJUST = 'ADJUST', // Admin hủy đơn
}
