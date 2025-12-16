"use client";

import React, { useState, useEffect } from "react";
import { userService, User } from "@/services/user.service";
import {
  Lock,
  Trash2,
  Unlock,
  User as UserIcon,
  Eye,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";

export default function AdminCustomersPage() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- API: LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách khách hàng
      const res = await userService.getCustomers(page, 10, searchQuery);

      if (res && Array.isArray(res.data)) {
        setCustomers(res.data);
        setTotalPages(res.lastPage);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // Tự động reload khi page hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  // --- HANDLER: KHÓA / MỞ KHÓA TÀI KHOẢN ---
  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateStatus(user._id, !user.isActive);
      toast.success(
        user.isActive ? "Đã khóa tài khoản" : "Đã kích hoạt lại tài khoản"
      );
      loadData(); // Reload để cập nhật UI
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- HANDLER: XÓA TÀI KHOẢN ---
  const handleDelete = async (id: string) => {
    if (
      confirm("Cảnh báo: Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng này?")
    ) {
      try {
        await userService.remove(id);
        toast.success("Đã xóa tài khoản khách hàng.");
        loadData();
      } catch (e) {
        toast.error("Lỗi xóa khách hàng");
      }
    }
  };

  return (
    <div className="font-sans text-slate-800 pb-20 animate-fade-in">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý Khách hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách người dùng đã đăng ký thành viên.
          </p>
        </div>

        {/* TOOLBAR: SEARCH */}
        <div className="w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên, email..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1); // Reset về trang 1 khi tìm kiếm
            }}
            onRefresh={loadData}
          />
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 w-1/3">Thông tin khách hàng</th>
              <th className="p-4 w-1/3">Email liên hệ</th>
              <th className="p-4 text-center w-32">Trạng thái</th>
              <th className="p-4 text-center w-40">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Đang tải dữ
                    liệu...
                  </div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-gray-400 italic"
                >
                  Không tìm thấy khách hàng nào.
                </td>
              </tr>
            ) : (
              customers.map((user, index) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-colors duration-200 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Cột 1: Avatar & Tên */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 text-gray-400 border border-gray-200 shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon size={20} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {user._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Email */}
                  <td className="p-4">
                    <span className="text-slate-600 font-medium">
                      {user.email}
                    </span>
                  </td>

                  {/* Cột 3: Trạng thái (Badge) */}
                  <td className="p-4 text-center">
                    {user.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        Đã khóa
                      </span>
                    )}
                  </td>

                  {/* Cột 4: Hành động */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Xem chi tiết */}
                      <Link
                        href={`/admin/customers/${user._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-100"
                        title="Xem chi tiết hồ sơ"
                      >
                        <Eye size={18} />
                      </Link>

                      {/* Khóa / Mở khóa */}
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition border border-transparent cursor-pointer 
                          ${
                            user.isActive
                              ? "text-orange-500 hover:bg-orange-50 hover:border-orange-100"
                              : "text-green-600 hover:bg-green-50 hover:border-green-100"
                          }`}
                        title={
                          user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"
                        }
                      >
                        {user.isActive ? (
                          <Lock size={18} />
                        ) : (
                          <Unlock size={18} />
                        )}
                      </button>

                      {/* Xóa */}
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100 cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="mt-6 flex justify-end">
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
