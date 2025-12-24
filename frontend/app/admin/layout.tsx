"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

// Import Icons
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  UsersRound,
  UserCog,
  Truck,
  ShieldCheck,
  History,
  Boxes,
  Settings,
  LogOut,
  Mail,
  Newspaper,
  TicketPercent,
  List,
  Building2,
} from "lucide-react";

// --- CẤU HÌNH MENU ---
// Định nghĩa danh sách menu
const MENU_ITEMS = [
  {
    group: "Tổng quan",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
      },
    ],
  },
  {
    group: "Kinh doanh",
    items: [
      {
        href: "/admin/orders",
        label: "Đơn hàng",
        icon: <ShoppingCart size={20} />,
      },
      {
        href: "/admin/products",
        label: "Sản phẩm",
        icon: <Package size={20} />,
      },
      {
        href: "/admin/categories",
        label: "Loại sản phẩm",
        icon: <List size={20} />,
      },
      {
        href: "/admin/coupons",
        label: "Mã giảm giá",
        icon: <TicketPercent size={20} />,
      },
      {
        href: "/admin/inventory",
        label: "Kho hàng",
        icon: <Boxes size={20} />,
      },
    ],
  },
  {
    group: "Đối tác & Nhân sự",
    items: [
      {
        href: "/admin/customers",
        label: "Khách hàng",
        icon: <UsersRound size={20} />,
      },
      {
        href: "/admin/staffs",
        label: "Nhân viên",
        icon: <UserCog size={20} />,
      },
      {
        href: "/admin/suppliers",
        label: "Nhà cung cấp",
        icon: <Truck size={20} />,
      },
      {
        href: "/admin/departments",
        label: "Phòng ban",
        icon: <Building2 size={20} />,
      },
      {
        href: "/admin/roles",
        label: "Tạo quyền",
        icon: <ShieldCheck size={20} />,
      },
    ],
  },
  {
    group: "Hệ thống & Nội dung",
    items: [
      {
        href: "/admin/logs",
        label: "Lịch sử hoạt động",
        icon: <History size={20} />,
      },
      {
        href: "/admin/blogs",
        label: "Bài viết (Blog)",
        icon: <Newspaper size={20} />,
      },
      {
        href: "/admin/contacts",
        label: "Thư liên hệ",
        icon: <Mail size={20} />,
      },
      {
        href: "/admin/profile",
        label: "Cấu hình",
        icon: <Settings size={20} />,
      },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại để highlight menu

  // --- HANDLE LOGOUT ---
  const handleLogout = () => {
    // 1. Xóa dữ liệu local
    localStorage.clear();
    Cookies.remove("token");
    Cookies.remove("role");

    // 2. Điều hướng về trang login (window.location force reload xóa state sạch sẽ)
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full shadow-xl z-50">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-green-500 text-2xl">❖</span> AdminPanel
          </h1>
        </div>

        {/* Navigation Scrollable Area */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {MENU_ITEMS.map((section, idx) => (
            <div key={idx} className="mb-6">
              {/* Group Label */}
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3 tracking-wider">
                {section.group}
              </p>

              {/* Menu Links */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  // Kiểm tra xem link này có đang active không
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                        ${
                          isActive
                            ? "bg-green-600 text-white shadow-md shadow-green-900/20 font-medium" // Style khi Active
                            : "hover:bg-slate-800 hover:text-white" // Style mặc định
                        }
                      `}
                    >
                      <span
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white"
                        }
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Sidebar (Logout) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Đăng xuất hệ thống</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 ml-64 p-6 lg:p-8 transition-all duration-300">
        {/* Card chứa nội dung chính */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[calc(100vh-4rem)] p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
