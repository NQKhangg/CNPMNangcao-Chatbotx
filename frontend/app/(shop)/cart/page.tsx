"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

// 1. Icons & UI Components
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import RevealOnScroll from "@/app/components/ui/RevealOnScroll";
import { useCart } from "@/contexts/CartContext";

// --- CẤU HÌNH HẰNG SỐ (CONSTANTS) ---
const FREESHIP_THRESHOLD = 500000; // Ngưỡng miễn phí vận chuyển (500k)
const BASE_SHIPPING_FEE = 30000; // Phí ship cơ bản

export default function CartPage() {
  // --- STATE & HOOKS ---
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

  // --- LOGIC TÍNH TOÁN ---
  // 1. Tính phí ship
  const shippingFee = totalPrice >= FREESHIP_THRESHOLD ? 0 : BASE_SHIPPING_FEE;

  // 2. Tính tiền cần mua thêm để freeship (dùng cho Progress Bar)
  const moneyToFreeship = Math.max(0, FREESHIP_THRESHOLD - totalPrice);

  // 3. Tính % tiến độ Freeship (Max 100%)
  const freeshipProgress = Math.min(
    100,
    (totalPrice / FREESHIP_THRESHOLD) * 100
  );

  // --- HELPER: RENDER ẢNH SẢN PHẨM ---
  const renderItemImage = (item: any) => {
    const isValidUrl =
      item.image &&
      (item.image.startsWith("http") || item.image.startsWith("data:"));

    if (isValidUrl) {
      return (
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain p-2"
        />
      );
    }
    // Fallback nếu không có ảnh hoặc ảnh lỗi
    return <span>{item.image || "📦"}</span>;
  };

  // --- RENDER: EMPTY STATE (GIỎ HÀNG TRỐNG) ---
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4 animate-fade-up">
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={64} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-gray-500 mb-8">
          Hãy chọn thêm vài món ngon cho bữa ăn hôm nay nhé!
        </p>
        <Link
          href="/products"
          className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition transform hover:scale-105"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  // --- RENDER: MAIN CONTENT ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          Giỏ hàng{" "}
          <span className="text-lg font-normal text-gray-500">
            ({cart.length} sản phẩm)
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ========================================= */}
          {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
          {/* ========================================= */}
          <div className="lg:w-2/3 space-y-4">
            {cart.map((item, index) => (
              <RevealOnScroll key={item.id}>
                <div
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md duration-300 ease-in-out transform hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* 1. Hình ảnh */}
                  <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                    {renderItemImage(item)}
                  </div>

                  {/* 2. Thông tin chi tiết */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        {/* Category Name */}
                        <p className="text-xs text-green-600 font-bold uppercase">
                          {typeof item.category === "object"
                            ? (item.category as any).name
                            : item.category}
                        </p>
                        <h3 className="font-bold text-slate-800 text-lg line-clamp-1">
                          {item.name}
                        </h3>
                      </div>

                      {/* Nút Xóa */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <p className="text-green-700 font-bold text-lg">
                        {item.price.toLocaleString()}đ
                      </p>

                      {/* Bộ điều chỉnh số lượng (+/-) */}
                      <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, "dec")}
                          className="w-8 h-full flex items-center justify-center hover:bg-gray-100 rounded-l-lg transition active:bg-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-bold select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, "inc")}
                          className="w-8 h-full flex items-center justify-center hover:bg-gray-100 rounded-r-lg transition active:bg-gray-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* ========================================= */}
          {/* CỘT PHẢI: TỔNG QUAN ĐƠN HÀNG (STICKY) */}
          {/* ========================================= */}
          <div className="lg:w-1/3 animate-fade-up">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-xl text-slate-800 mb-6">
                Tổng quan đơn hàng
              </h3>

              <div className="space-y-4 mb-6 text-sm text-gray-600">
                {/* Tạm tính */}
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-medium text-slate-900">
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>

                {/* Progress Bar Freeship */}
                {shippingFee > 0 ? (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700 mb-3">
                      Mua thêm{" "}
                      <span className="font-bold">
                        {moneyToFreeship.toLocaleString()}đ
                      </span>{" "}
                      để được{" "}
                      <span className="font-bold uppercase">FreeShip</span>
                    </p>
                    <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${freeshipProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2 text-green-700 font-bold text-sm">
                    🎉 Chúc mừng! Đơn hàng được FreeShip
                  </div>
                )}

                {/* Phí vận chuyển */}
                <div className="flex justify-between items-center">
                  <span>Phí vận chuyển</span>
                  <span
                    className={
                      shippingFee === 0
                        ? "text-green-600 font-bold"
                        : "font-medium"
                    }
                  >
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString()}đ`}
                  </span>
                </div>

                {/* Tổng cộng */}
                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between text-lg font-bold text-slate-900">
                  <span>Tổng cộng</span>
                  <span className="text-green-700 text-xl">
                    {(totalPrice + shippingFee).toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Nút Checkout */}
              <Link
                href="/checkout"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-green-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Tiến hành thanh toán <ArrowRight size={20} />
              </Link>

              {/* Footer Note */}
              <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs">
                <ShieldCheckIcon /> Bảo mật thanh toán 100%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
function ShieldCheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
