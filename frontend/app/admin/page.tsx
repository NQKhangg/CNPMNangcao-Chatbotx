"use client";

import React, { useEffect, useState } from "react";
// 1. Icons & UI Libs
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// 2. Services
import { statisticsService } from "@/services/statistics.service";

// --- HELPERS (Hàm hỗ trợ) ---
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value
  );

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// --- SUB-COMPONENTS (Component con) ---
const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color}`}
    >
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function AdminDashboard() {
  // --- A. STATE ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- B. API CALLS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await statisticsService.getDashboard();
        setData(res);
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- C. LOADING STATE ---
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-3 text-gray-500">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-medium">Đang tổng hợp dữ liệu...</p>
      </div>
    );
  }

  // --- D. EMPTY STATE ---
  if (!data)
    return (
      <div className="p-8 text-center text-gray-500">
        Không có dữ liệu hiển thị.
      </div>
    );

  const { summary, charts, topProducts, recentOrders } = data;

  // --- E. RENDER ---
  return (
    <div className="text-slate-800 pb-20 animate-fade-in font-sans">
      {/* 1. HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Tổng quan</h2>
        <p className="text-sm text-gray-500 mt-1">
          Báo cáo hoạt động kinh doanh hôm nay.
        </p>
      </div>

      {/* 2. STATS CARDS (Thẻ thống kê) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-down">
        <StatCard
          title="Doanh thu"
          value={formatCurrency(summary.revenue)}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
          subtext="Tổng doanh thu thực tế"
        />
        <StatCard
          title="Đơn hàng"
          value={summary.orders}
          icon={ShoppingBag}
          color="bg-blue-100 text-blue-600"
          subtext="Đơn hàng đã đặt"
        />
        <StatCard
          title="Khách hàng"
          value={summary.users}
          icon={Users}
          color="bg-purple-100 text-purple-600"
          subtext="Thành viên hệ thống"
        />
        <StatCard
          title="Cảnh báo kho"
          value={summary.lowStock}
          icon={Package}
          color="bg-red-100 text-red-600"
          subtext="Sản phẩm sắp hết hàng"
        />
      </div>

      {/* 3. CHARTS & TOP PRODUCTS (Biểu đồ & Top SP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 animate-fade-up">
        {/* Left: Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <TrendingUp size={20} className="text-green-600" />
              Doanh thu 7 ngày qua
            </h3>
          </div>

          <div className="h-80 w-full duration-200 hover:shadow-md hover:-translate-y-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee"
                />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#888" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Doanh thu",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#16a34a",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-slate-800">
            Top Bán Chạy
          </h3>
          <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {topProducts.map((p: any, i: number) => (
              <div key={p._id} className="flex items-center gap-4 group">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 3
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden shrink-0">
                  <img
                    src={p.thumbnail || "/placeholder.png"}
                    className="w-full h-full object-cover"
                    alt={p.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Đã bán:{" "}
                    <span className="font-bold text-slate-800">{p.sold}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. RECENT ORDERS TABLE (Đơn hàng mới) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-up">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-slate-800">
            Đơn hàng mới nhất
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => (
                <tr
                  key={order._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700">
                      {order.customerInfo.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.customerInfo.phone || "No Phone"}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        order.status === "PENDING"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : order.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : order.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs flex items-center gap-2">
                    <Calendar size={14} /> {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
