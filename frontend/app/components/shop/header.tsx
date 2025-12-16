"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Phone,
  MapPin,
  Heart,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user.service";

const NAV_ITEMS = [
  { label: "Trang Chủ", href: "/home" },
  { label: "Sản Phẩm", href: "/products" },
  { label: "Khuyến Mãi", href: "/promotions" },
  { label: "Blog", href: "/blogs" },
  { label: "Liên Hệ", href: "/contact" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 2. State quản lý menu mobile

  const { totalItems } = useCart();
  const router = useRouter();

  // Hiệu ứng cuộn
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load thông tin user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getProfile();
        setCurrentUser(data);
      } catch (error) {
        console.log("Chưa đăng nhập");
      }
    };
    fetchUser();
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && keyword.trim()) {
      router.push(`/products?keyword=${keyword}`);
      setIsMobileMenuOpen(false); // Đóng menu nếu search trên mobile
    }
  };

  return (
    <>
      {/* --- TOP BAR (Ẩn trên mobile) --- */}
      <div className="bg-green-900 text-white text-xs py-2 hidden md:block font-sans">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Phone size={14} /> 1900 1234
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> TP. Hồ Chí Minh
            </span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/profile/orders"
              className="hover:text-green-300 transition"
            >
              Theo dõi đơn hàng
            </Link>
          </div>
        </div>
      </div>

      {/* --- MAIN NAVBAR --- */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 font-sans ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-md py-3"
            : "bg-white py-5 border-b border-gray-100"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition duration-300">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-800 leading-none">
                FreshFood
              </span>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">
                Organic Store
              </span>
            </div>
          </Link>

          {/* Menu Desktop (Ẩn trên Mobile) */}
          <nav className="hidden lg:flex items-center gap-8 font-medium text-slate-600">
            {NAV_ITEMS.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="relative hover:text-green-600 transition py-2 group transform hover:scale-105"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-green-200 transition w-64 transform hover:scale-105">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Tìm rau củ, thịt..."
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-gray-400 "
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            <Link
              href="/profile/wishlist"
              className="p-2 hover:bg-gray-100 rounded-full transition group text-slate-600 relative hidden sm:block" // Ẩn bớt trên mobile cho đỡ chật
              title="Sản phẩm yêu thích"
            >
              <Heart className="w-6 h-6 group-hover:text-red-500 transition transform hover:scale-110" />
            </Link>

            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>

            <Link
              href={currentUser ? "/profile" : "/login"}
              className="p-2 hover:bg-gray-100 rounded-full transition text-slate-600"
            >
              {currentUser && currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-green-200 transform hover:scale-110"
                />
              ) : (
                <div className="p-1 ">
                  <User className="w-6 h-6 transform hover:scale-110" />
                </div>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition text-slate-600 transform hover:scale-110"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* --- 3. NÚT TOGGLE MENU MOBILE --- */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-slate-600 transition cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-red-500" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* --- 4. GIAO DIỆN MENU MOBILE (Hiển thị khi isMobileMenuOpen = true) --- */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 p-4 flex flex-col gap-4 animate-fade-in-up z-40">
            {/* Search Bar cho Mobile */}
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-green-200 transition">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="bg-transparent border-none outline-none text-base w-full text-slate-700 placeholder:text-gray-400"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Danh sách link */}
            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="p-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-slate-700 transition flex justify-between items-center cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)} // Đóng menu khi click
                >
                  {item.label}
                </Link>
              ))}

              {/* Link bổ sung cho Mobile */}
              <Link
                href="/profile/wishlist"
                className="p-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-slate-700 transition flex justify-between items-center cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sản phẩm yêu thích <Heart size={18} />
              </Link>

              <Link
                href="/profile/orders"
                className="p-3 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-slate-700 transition flex justify-between items-center cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Theo dõi đơn hàng
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
