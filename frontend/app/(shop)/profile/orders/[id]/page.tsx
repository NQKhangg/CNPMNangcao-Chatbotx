"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Calendar,
  CreditCard,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";

import { orderService } from "@/services/order.service";

// =========================================
// 2. HELPER FUNCTIONS
// =========================================

// Helper: Xác định vị trí của trạng thái trong quy trình (Timeline)
const getStatusStep = (status: string) => {
  const steps = ["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED"];
  // Nếu status là CANCELLED thì index = -1
  const currentIndex = steps.indexOf(status);
  return { steps, currentIndex };
};

// Helper: Format địa chỉ
const formatAddress = (addr: any) => {
  if (!addr) return "---";
  if (typeof addr === "string") return addr;

  // Nối các trường địa chỉ lại
  return [addr.street, addr.ward, addr.district, addr.cityName || addr.city]
    .filter(Boolean) // Lọc bỏ giá trị rỗng/null
    .join(", ");
};

// =========================================
// 3. MAIN COMPONENT
// =========================================

export default function OrderDetailPage() {
  // --- A. HOOKS & STATE ---
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- B. EFFECTS (LOAD DATA) ---
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Lỗi tải chi tiết đơn:", error);
      toast.error("Không tìm thấy đơn hàng");
      router.push("/profile/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // --- C. HANDLERS ---

  // Xử lý hủy đơn hàng
  const handleCancel = () => {
    toast("Xác nhận hủy đơn hàng?", {
      description: "Hành động này không thể hoàn tác.",
      duration: Infinity,
      action: {
        label: "Hủy đơn ngay",
        onClick: async () => {
          const promise = orderService.cancelOrder(orderId);
          toast.promise(promise, {
            loading: "Đang xử lý...",
            success: () => {
              fetchOrder(); // Reload lại dữ liệu
              return "Đơn hàng đã hủy thành công!";
            },
            error: "Không thể hủy đơn hàng này. Vui lòng liên hệ CSKH.",
          });
        },
      },
      cancel: {
        label: "Đóng",
        onClick: () => {},
      },
      icon: <AlertTriangle className="text-red-500" />,
    });
  };

  // --- D. RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-green-600 gap-2">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="text-sm font-medium">Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (!order) return null;

  const { steps, currentIndex } = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans text-slate-800 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 1. Header Navigation */}
        <div className="mb-6">
          <Link
            href="/profile/orders"
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 w-fit transition duration-200 hover:-translate-x-1"
          >
            <ArrowLeft size={18} /> Quay lại danh sách
          </Link>
        </div>

        {/* 2. Order Status Card (Timeline) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 transition transform hover:shadow-md duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-50 pb-4">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Chi tiết đơn hàng{" "}
                <span className="font-mono text-green-600 text-lg">
                  #{order._id.slice(-6).toUpperCase()}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Calendar size={14} /> Ngày đặt:{" "}
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            {/* Badge Trạng thái lớn */}
            <div className="mt-4 md:mt-0">
              {order.status === "CANCELLED" ? (
                <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold text-sm flex items-center gap-2">
                  <XCircle size={16} /> ĐÃ HỦY
                </span>
              ) : order.status === "COMPLETED" ? (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm flex items-center gap-2">
                  <CheckCircle size={16} /> HOÀN THÀNH
                </span>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">
                    {order.status === "PENDING" && "Đang xử lý"}
                    {order.status === "CONFIRMED" && "Đã xác nhận"}
                    {order.status === "SHIPPING" && "Đang giao hàng"}
                  </span>

                  {/* Nút Hủy Đơn (Chỉ hiện khi PENDING) */}
                  {order.status === "PENDING" && (
                    <button
                      onClick={handleCancel}
                      className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full font-medium transition"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Process (Ẩn nếu đã hủy) */}
          {order.status !== "CANCELLED" && (
            <div className="relative flex items-center justify-between w-full mt-8 px-2 md:px-10">
              {/* Line background */}
              <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded"></div>
              {/* Line active (Tiến độ) */}
              <div
                className="absolute left-0 top-1/2 h-1 bg-green-500 -z-10 rounded transition-all duration-700 ease-out"
                style={{
                  width: `${(currentIndex / (steps.length - 1)) * 100}%`,
                }}
              ></div>

              {/* Steps Icons */}
              {[
                { label: "Đã đặt", icon: <Clock size={16} />, activeIdx: 0 },
                {
                  label: "Xác nhận",
                  icon: <CheckCircle size={16} />,
                  activeIdx: 1,
                },
                { label: "Đang giao", icon: <Truck size={16} />, activeIdx: 2 },
                { label: "Đã nhận", icon: <Package size={16} />, activeIdx: 3 },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center bg-white px-2 z-10"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                      currentIndex >= step.activeIdx
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-gray-300 text-gray-300"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 ${
                      currentIndex >= step.activeIdx
                        ? "text-green-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Detail Columns */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG & THANH TOÁN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full hover:shadow-md transition duration-300">
              <h3 className="font-bold text-lg mb-4 border-b border-gray-50 pb-2">
                Thông tin nhận hàng
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-0.5 shrink-0" size={16} />
                  <p className="font-bold text-slate-700">
                    {order.customerInfo.name}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="text-gray-400 mt-0.5 shrink-0" size={16} />
                  <p className="text-slate-600 font-mono">
                    {order.customerInfo.phone}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                  <p className="text-slate-600 leading-relaxed">
                    {formatAddress(order.customerInfo.address)}
                  </p>
                </div>

                {order.customerInfo.note && (
                  <div className="bg-yellow-50 p-3 rounded-lg text-yellow-800 text-xs border border-yellow-100 mt-2">
                    <span className="font-bold block mb-1">Ghi chú:</span>
                    {order.customerInfo.note}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-lg mt-8 mb-4 border-b border-gray-50 pb-2">
                Thanh toán
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CreditCard className="text-gray-400" size={16} />
                <span>
                  {order.paymentMethod === "COD"
                    ? "Thanh toán khi nhận (COD)"
                    : "Chuyển khoản ngân hàng"}
                </span>
              </div>

              {/* Payment Status Badge */}
              <div className="mt-3 ml-7">
                {order.paymentStatus === "PAID" ? (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    Đã thanh toán
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                    Chưa thanh toán
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: DANH SÁCH SẢN PHẨM & TỔNG TIỀN */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
              <h3 className="font-bold text-lg mb-4 border-b border-gray-50 pb-2">
                Sản phẩm ({order.items.length})
              </h3>

              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {order.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-4 py-2 hover:bg-gray-50 rounded-lg p-2 transition"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      <img
                        src={item.productImage || "/placeholder.png"}
                        className="w-full h-full object-contain p-1"
                        alt={item.productName}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2">
                        {item.productName}
                      </h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-mono">
                          x{item.quantity}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-green-700 block">
                            {item.price.toLocaleString()}đ
                          </span>
                          {/* Giá gốc nếu có */}
                          {item.originalPrice > item.price && (
                            <span className="text-xs text-gray-400 line-through">
                              {item.originalPrice.toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              <div className="border-t border-gray-100 mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tiền hàng</span>
                  <span>{order.subTotal?.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span>
                    {order.shippingFee === 0
                      ? "Miễn phí"
                      : `${order.shippingFee?.toLocaleString()}đ`}
                  </span>
                </div>

                {/* Discount */}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>
                      Giảm giá{" "}
                      {order.appliedCoupons?.length > 0 &&
                        `(${order.appliedCoupons
                          .map((c: any) => c.code)
                          .join(", ")})`}
                    </span>
                    <span>-{order.discountAmount.toLocaleString()}đ</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t border-gray-100 mt-2 items-end">
                  <span className="text-base font-normal text-gray-600">
                    Tổng thanh toán
                  </span>
                  <span className="text-green-600 text-2xl">
                    {order.totalAmount.toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
