"use client";

import React, { useState, useEffect } from "react";
import { orderService } from "@/services/order.service";
import {
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Package,
  Calendar,
} from "lucide-react";
import AdminSearch from "@/app/components/admin/search";
import { toast } from "sonner";
import Link from "next/link";
import Pagination from "@/app/components/pagination";

// --- 1. HELPERS: BADGES & UI COMPONENTS ---

// Component Badge tái sử dụng
const Badge = ({ color, icon: Icon, children }: any) => {
  const colors: any = {
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
        colors[color] || colors.gray
      }`}
    >
      {Icon && <Icon size={10} />} {children}
    </span>
  );
};

// Helper lấy Badge trạng thái đơn hàng
const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge color="yellow" icon={Clock}>
          Chờ xử lý
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge color="blue" icon={CheckCircle}>
          Đã xác nhận
        </Badge>
      );
    case "SHIPPING":
      return (
        <Badge color="purple" icon={Truck}>
          Đang giao
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge color="green" icon={CheckCircle}>
          Hoàn thành
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge color="red" icon={XCircle}>
          Đã hủy
        </Badge>
      );
    default:
      return <Badge color="gray">{status}</Badge>;
  }
};

// Helper lấy Badge trạng thái thanh toán
const getPaymentBadge = (status: string) => {
  switch (status) {
    case "PAID":
      return (
        <Badge color="green" icon={DollarSign}>
          Đã thanh toán
        </Badge>
      );
    case "REFUNDED":
      return <Badge color="red">Hoàn tiền</Badge>;
    default:
      return <Badge color="gray">Chưa TT</Badge>;
  }
};

// Helper format địa chỉ
const formatAddress = (addr: any) => {
  if (!addr) return "---";
  if (typeof addr === "string") return addr;
  return [addr.street, addr.ward, addr.district, addr.city]
    .filter((part) => part && part.trim() !== "")
    .join(", ");
};

export default function AdminOrdersPage() {
  // --- 2. STATE MANAGEMENT ---
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- 3. DATA FETCHING ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getAllOrders(page, 10, searchQuery);
      if (res && Array.isArray(res.data)) {
        setOrders(res.data);
        setTotalPages(res.lastPage);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, searchQuery]);

  // --- 4. ACTION HANDLERS ---

  // Xử lý hủy đơn (Có confirm)
  const triggerCancelOrder = (id: string) => {
    toast("Xác nhận hủy đơn hàng?", {
      description: "Hành động này sẽ hoàn lại tồn kho và không thể hoàn tác.",
      action: {
        label: "Hủy đơn",
        onClick: async () => {
          const promise = orderService.adminCancelOrder(id);
          toast.promise(promise, {
            loading: "Đang xử lý...",
            success: () => {
              fetchOrders();
              return "Đã hủy đơn thành công!";
            },
            error: "Hủy đơn thất bại",
          });
        },
      },
      cancel: { label: "Đóng", onClick: () => {} },
      icon: <AlertTriangle className="text-red-500" />,
    });
  };

  // Xử lý đổi trạng thái
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === "CANCELLED") {
      triggerCancelOrder(id);
      return;
    }
    toast.promise(orderService.updateStatus(id, newStatus), {
      loading: "Đang cập nhật...",
      success: () => {
        fetchOrders();
        return "Cập nhật thành công!";
      },
      error: "Cập nhật thất bại",
    });
  };

  // Xử lý đổi thanh toán
  const handlePaymentChange = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "UNPAID" ? "PAID" : "UNPAID";
    if (confirm(`Đổi trạng thái thanh toán sang: ${nextStatus}?`)) {
      toast.promise(orderService.updatePaymentStatus(id, nextStatus), {
        loading: "Đang cập nhật...",
        success: () => {
          fetchOrders();
          return "Cập nhật thành công!";
        },
        error: "Lỗi cập nhật",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã copy mã đơn hàng!");
  };

  // --- 5. RENDER UI ---
  return (
    <div className="font-sans text-slate-800 pb-20 animate-fade-in">
      {/* HEADER TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý Đơn hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi đơn hàng và trạng thái vận chuyển.
          </p>
        </div>

        <div className="w-full md:w-auto min-w-[320px]">
          <AdminSearch
            placeholder="Tìm mã đơn, tên khách, SĐT..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={fetchOrders}
          />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {/* Min-width đảm bảo bảng không bị bóp méo trên mobile */}
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-4 w-[100px]">Mã đơn</th>
                <th className="px-4 py-4 w-[20%]">Khách hàng</th>
                <th className="px-4 py-4 w-[25%]">Sản phẩm</th>
                <th className="px-4 py-4 w-[120px] text-right">Tổng tiền</th>
                <th className="px-4 py-4 w-[130px] text-center">Thanh toán</th>
                <th className="px-4 py-4 w-[120px]">Ngày đặt</th>
                <th className="px-4 py-4 w-[130px] text-center">Trạng thái</th>
                <th className="px-4 py-4 w-[80px] text-center">Xử lý</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="text-xs">Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2 opacity-50">
                      <Package size={40} />
                      <span>Không tìm thấy đơn hàng nào khớp với bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr
                    key={order._id}
                    className="hover:bg-blue-50/30 transition-colors duration-200 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* 1. MÃ ĐƠN */}
                    <td className="px-4 py-4 align-top">
                      <div
                        className="font-mono text-xs font-medium text-slate-600 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-fit cursor-pointer hover:border-blue-300 hover:text-blue-600 transition"
                        onClick={() => copyToClipboard(order._id)}
                        title="Sao chép"
                      >
                        #{order._id.slice(-6).toUpperCase()}
                      </div>
                    </td>

                    {/* 2. KHÁCH HÀNG */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                          {order.customerInfo?.name?.charAt(0).toUpperCase() ||
                            "K"}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-bold text-slate-800 text-sm truncate"
                            title={order.customerInfo?.name}
                          >
                            {order.customerInfo?.name || "Vãng lai"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {order.customerInfo?.phone}
                          </div>
                          <div
                            className="text-[10px] text-gray-400 mt-1 truncate"
                            title={formatAddress(order.customerInfo?.address)}
                          >
                            {formatAddress(order.customerInfo?.address)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. SẢN PHẨM */}
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1.5">
                        {order.items
                          ?.slice(0, 2)
                          .map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs text-slate-600"
                            >
                              <span className="mt-1.5 w-1 h-1 bg-slate-400 rounded-full shrink-0"></span>
                              <div className="flex-1 min-w-0">
                                <span
                                  className="font-medium truncate block"
                                  title={item.productName}
                                >
                                  {item.productName}
                                </span>
                              </div>
                              <span className="text-gray-400 text-[10px] whitespace-nowrap bg-gray-50 px-1 rounded">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        {order.items?.length > 2 && (
                          <span className="text-[10px] text-blue-500 font-medium pl-3 cursor-pointer hover:underline block">
                            +{order.items.length - 2} sản phẩm khác...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. TỔNG TIỀN */}
                    <td className="px-4 py-4 text-right align-top">
                      <div className="font-bold text-slate-800 text-sm">
                        {order.totalAmount?.toLocaleString()}đ
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase">
                        {order.paymentMethod === "COD"
                          ? "Tiền mặt"
                          : order.paymentMethod}
                      </div>
                    </td>

                    {/* 5. THANH TOÁN */}
                    <td className="px-4 py-4 text-center align-top">
                      <div
                        className="cursor-pointer hover:opacity-80 transition"
                        onClick={() =>
                          handlePaymentChange(order._id, order.paymentStatus)
                        }
                      >
                        {getPaymentBadge(order.paymentStatus || "UNPAID")}
                      </div>
                    </td>

                    {/* 6. NGÀY ĐẶT */}
                    <td className="px-4 py-4 align-top">
                      <div className="text-xs text-slate-700 font-medium">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* 7. TRẠNG THÁI */}
                    <td className="px-4 py-4 text-center align-top">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* 8. HÀNH ĐỘNG */}
                    <td className="px-4 py-4 text-center align-top">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/profile/orders/${order._id}`}
                          target="_blank"
                          className="p-1.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Link>

                        <div className="relative group/edit">
                          <button
                            className={`p-1.5 rounded-lg border transition shadow-sm
                              ${
                                order.status === "CANCELLED" ||
                                order.status === "COMPLETED"
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                              }`}
                          >
                            <RefreshCw size={16} />
                          </button>

                          <select
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            value={order.status}
                            disabled={
                              order.status === "CANCELLED" ||
                              order.status === "COMPLETED"
                            }
                            onChange={(e) =>
                              handleStatusChange(order._id, e.target.value)
                            }
                          >
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="CONFIRMED">Xác nhận</option>
                            <option value="SHIPPING">Giao hàng</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Hủy đơn</option>
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="mt-6 flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
