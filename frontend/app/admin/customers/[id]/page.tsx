"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Package,
  ArrowLeft,
  Calendar,
  Loader2,
  ShoppingBag,
  CreditCard,
} from "lucide-react";

// Services
import { userService, User } from "@/services/user.service";
import { orderService } from "@/services/order.service";

// --- HELPER: MÀU TRẠNG THÁI ĐƠN HÀNG ---
const getOrderStatusStyle = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "SHIPPING":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export default function CustomerDetailPage() {
  // 1. Lấy ID từ URL
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  // 2. State quản lý dữ liệu
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. Fetch Data (User + Orders)
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // Chạy song song 2 API để tối ưu tốc độ
        const [userData, ordersData] = await Promise.all([
          userService.getById(userId),
          orderService.getAllOrdersByUserId(userId),
        ]);

        setUser(userData);
        setOrders(ordersData);
      } catch (error) {
        console.error("Lỗi tải chi tiết khách hàng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // --- RENDER LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
        <p>Đang tải hồ sơ khách hàng...</p>
      </div>
    );
  }

  // --- RENDER ERROR / NOT FOUND STATE ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <UserIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">
          Không tìm thấy thông tin khách hàng
        </p>
        <Link
          href="/admin/customers"
          className="text-blue-600 hover:underline mt-2"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // --- RENDER MAIN CONTENT ---
  return (
    <div className="text-slate-800 pb-20 animate-fade-in font-sans">
      {/* HEADER: Breadcrumb & Title */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/customers"
          className="p-2 rounded-full hover:bg-white hover:shadow-sm transition text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Hồ sơ khách hàng
          </h1>
          <p className="text-sm text-gray-500">
            Xem thông tin chi tiết và lịch sử mua hàng.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- CỘT TRÁI: THÔNG TIN CÁ NHÂN --- */}
        <div className="lg:col-span-1 space-y-6 animate-fade-right">
          {/* Card: Profile Header */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-50 to-indigo-50 z-0"></div>

            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto bg-white rounded-full p-1 shadow-md mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                      alt={user.name}
                    />
                  ) : (
                    <UserIcon size={40} className="text-gray-400" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                  Thành viên
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    user.isActive
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {user.isActive ? "Hoạt động" : "Đã khóa"}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Contact Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <UserIcon size={18} className="text-blue-500" /> Thông tin liên hệ
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-gray-400 mt-1 shrink-0" />
                <div className="break-all">
                  <span className="block text-gray-500 text-xs uppercase font-bold">
                    Email
                  </span>
                  <span className="font-medium text-slate-700">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-gray-400 mt-1 shrink-0" />
                <div>
                  <span className="block text-gray-500 text-xs uppercase font-bold">
                    Điện thoại
                  </span>
                  <span className="font-medium text-slate-700">
                    {user.phone || "Chưa cập nhật"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-1 shrink-0" />
                <div>
                  <span className="block text-gray-500 text-xs uppercase font-bold">
                    Ngày tham gia
                  </span>
                  <span className="font-medium text-slate-700">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "--/--/----"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Addresses */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-orange-500" /> Sổ địa chỉ
            </h3>

            {user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-white border border-gray-200 px-1.5 rounded text-gray-600">
                        {addr.label || "Khác"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] text-green-600 font-bold">
                          (Mặc định)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {addr.address}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                Chưa có địa chỉ nào
              </div>
            )}
          </div>
        </div>

        {/* --- CỘT PHẢI: LỊCH SỬ ĐƠN HÀNG --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] animate-fade-down">
            {/* Header Card */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Package className="text-green-600" /> Lịch sử đơn hàng
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  {orders.length}
                </span>
              </h3>

              <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <ShoppingBag size={14} />
                  <span>
                    Tổng đơn: <b>{orders.length}</b>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard size={14} />
                  <span>
                    Tổng chi tiêu:{" "}
                    <b className="text-slate-800">
                      {orders
                        .reduce((acc, cur) => acc + (cur.totalAmount || 0), 0)
                        .toLocaleString()}
                      đ
                    </b>
                  </span>
                </div>
              </div>
            </div>

            {/* Order Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-200">
                  <tr>
                    <th className="p-4 w-32">Mã đơn</th>
                    <th className="p-4">Ngày đặt</th>
                    <th className="p-4">Phương thức</th>
                    <th className="p-4">Tổng tiền</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr
                        key={order._id}
                        className="hover:bg-blue-50/50 transition duration-200 animate-fade-up"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/orders/${order._id}`}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                          >
                            #{order._id.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td className="p-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </div>
                          <div className="text-xs text-gray-400 pl-6">
                            {new Date(order.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          {order.paymentMethod === "COD"
                            ? "Thanh toán khi nhận"
                            : "Chuyển khoản / VNPAY"}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {order.totalAmount.toLocaleString()}đ
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getOrderStatusStyle(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            href={`/profile/orders/${order._id}`}
                            target="_blank"
                            className="text-xs font-bold text-gray-500 bg-gray-200 hover:text-blue-600 border-1 px-2 py-1 rounded-full hover:bg-blue-200"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Package size={48} className="mb-2 opacity-20" />
                          <p>Khách hàng này chưa có đơn hàng nào.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
