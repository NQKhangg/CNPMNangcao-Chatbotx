"use client";
import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 font-sans text-slate-600">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm mb-12">
        {/* Cột 1: Giới thiệu */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="text-xl font-bold text-slate-800">FreshFood</span>
          </div>
          <p className="text-gray-500 leading-relaxed">
            Chúng tôi cam kết mang đến những sản phẩm thực phẩm sạch, an toàn và
            chất lượng nhất cho gia đình bạn.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full hover:bg-green-600 hover:text-white transition cursor-pointer flex items-center justify-center">
              f
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-full hover:bg-green-600 hover:text-white transition cursor-pointer flex items-center justify-center">
              in
            </div>
          </div>
        </div>

        {/* Cột 2: Công ty */}
        <div>
          <h3 className="text-slate-900 font-bold text-lg mb-4">Công ty</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/about" className="hover:text-green-600 transition">
                Về chúng tôi
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                className="hover:text-green-600 transition"
              >
                Cửa hàng
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-green-600 transition">
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Chính sách */}
        <div>
          <h3 className="text-slate-900 font-bold text-lg mb-4">Chính sách</h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/policy/privacy"
                className="hover:text-green-600 transition"
              >
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link
                href="/policy/terms"
                className="hover:text-green-600 transition"
              >
                Điều khoản sử dụng
              </Link>
            </li>
            <li>
              <Link
                href="/policy/return"
                className="hover:text-green-600 transition"
              >
                Chính sách đổi trả
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div>
          <h3 className="text-slate-900 font-bold text-lg mb-4">Liên hệ</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-green-600 mt-0.5" />
              <span>Tầng 12, Tòa nhà Bitexco, Q1, TP.HCM</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-green-600" />
              <span>1900 1234</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-green-600" />
              <span>support@freshfood.vn</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 text-center pt-8 border-t border-gray-100 text-gray-400 text-xs">
        <p>© 2025 FreshFood. All rights reserved.</p>
      </div>
    </footer>
  );
}
