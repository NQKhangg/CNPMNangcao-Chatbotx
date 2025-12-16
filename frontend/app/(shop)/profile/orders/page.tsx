"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Libraries & Icons
import { toast } from "sonner";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";

// Services & Components
import { orderService } from "@/services/order.service";
import RevealOnScroll from "@/app/components/ui/RevealOnScroll";

// =========================================
// 2. HELPER FUNCTIONS & CONFIG
// =========================================

/**
 * Lấy cấu hình hiển thị (Màu sắc, Icon, Label) dựa trên trạng thái đơn hàng
 */
const getStatusConfig = (status: string) => {
  switch (status) {
    case "PENDING":
      return {
        style: "text-yellow-700 bg-yellow-50 border-yellow-200",
        icon: <Clock size={14} />,
        label: "Chờ xử lý",
      };
    case "CONFIRMED":
      return {
        style: "text-blue-700 bg-blue-50 border-blue-200",
        icon: <CheckCircle size={14} />,
        label: "Đã xác nhận",
      };
    case "SHIPPING":
      return {
        style: "text-purple-700 bg-purple-50 border-purple-200",
        icon: <Truck size={14} />,
        label: "Đang giao hàng",
      };
    case "COMPLETED":
      return {
        style: "text-green-700 bg-green-50 border-green-200",
        icon: <CheckCircle size={14} />,
        label: "Hoàn thành",
      };
    case "CANCELLED":
      return {
        style: "text-red-700 bg-red-50 border-red-200",
        icon: <XCircle size={14} />,
        label: "Đã hủy",
      };
    default:
      return {
        style: "text-gray-700 bg-gray-50 border-gray-200",
        icon: <Package size={14} />,
        label: status,
      };
  }
};

/**
 * Format địa chỉ từ Object/String sang chuỗi
 */
const formatAddress = (addr: any) => {
  if (!addr) return "---";
  if (typeof addr === "string") return addr;
  // Lọc bỏ các giá trị null/undefined/rỗng và nối lại
  return [addr.street, addr.ward, addr.district, addr.cityName || addr.city]
    .filter(Boolean)
    .join(", ");
};

// =========================================
// 3. MAIN COMPONENT
// =========================================

export default function MyOrdersPage() {
  // --- STATE & HOOKS ---
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.findByUser();
        // Sắp xếp đơn mới nhất lên đầu
        const sortedData = Array.isArray(data) ? data.reverse() : [];
        setOrders(sortedData);
      } catch (error: any) {
        console.error("Lỗi tải đơn hàng:", error);

        // Xử lý lỗi 401 (Unauthorized)
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập hết hạn", {
            description: "Vui lòng đăng nhập lại để xem đơn hàng.",
          });
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // --- RENDER: LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-green-600 gap-2">
        <Loader2 className="animate-spin w-6 h-6" />
        <span className="font-medium">Đang tải lịch sử đơn hàng...</span>
      </div>
    );
  }

  // --- RENDER: EMPTY STATE ---
  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center animate-fade-up px-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-5xl shadow-inner">
          📦
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Bạn chưa có đơn hàng nào
          </h2>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Hãy khám phá các sản phẩm tươi ngon tại FreshFood và đặt hàng ngay
            nhé!
          </p>
          <Link
            href="/products"
            className="bg-green-600 text-white px-6 py-3 rounded-full font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
          >
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  // --- RENDER: ORDER LIST ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans text-slate-800">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            <Package className="text-green-600" /> Đơn hàng của tôi
          </h1>
          <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200">
            {orders.length} đơn hàng
          </span>
        </div>

        {/* Orders Grid */}
        <div className="space-y-4">
          {orders.map((order, index) => {
            const statusConfig = getStatusConfig(order.status);

            return (
              <RevealOnScroll key={order._id}>
                <div
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-fade-up group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* === CARD HEADER: ID, DATE, STATUS === */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 pb-4 border-b border-gray-50 gap-4">
                    <div>
                      <div className="flex items-center gap-3 text-sm mb-1.5">
                        <span className="font-mono font-bold text-slate-800 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <Calendar size={12} />
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1">
                          {formatAddress(order.customerInfo.address)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.style}`}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </div>
                  </div>

                  {/* === CARD BODY: PRODUCT PREVIEW === */}
                  <div className="space-y-4 mb-6">
                    {/* Chỉ hiển thị tối đa 2 sản phẩm đầu tiên */}
                    {order.items.slice(0, 2).map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-700 line-clamp-1 mb-1">
                            {item.productName}
                          </h4>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                              x{item.quantity}
                            </span>
                            <span className="font-bold text-slate-600">
                              {item.price.toLocaleString()}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Hiển thị số lượng sản phẩm còn lại nếu có */}
                    {order.items.length > 2 && (
                      <div className="text-center pt-2 border-t border-dashed border-gray-100">
                        <span className="text-xs text-gray-400">
                          Và {order.items.length - 2} sản phẩm khác...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* === CARD FOOTER: TOTAL & ACTION === */}
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Tổng thanh toán
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {order.totalAmount.toLocaleString()}đ
                      </span>
                    </div>

                    <Link
                      href={`/profile/orders/${order._id}`}
                      className="flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-green-600 bg-gray-50 hover:bg-green-50 px-4 py-2 rounded-lg transition-all group-hover:translate-x-1"
                    >
                      Xem chi tiết <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </div>
  );
}
