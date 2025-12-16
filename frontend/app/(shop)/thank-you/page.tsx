"use client";

// --- 1. IMPORTS ---
import React, { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Libraries
import confetti from "canvas-confetti";
import {
  CheckCircle,
  Home,
  ShoppingBag,
  Truck,
  PackageCheck,
} from "lucide-react";

export default function ThankYouPage() {
  // --- 2. HOOKS & STATE ---
  const searchParams = useSearchParams();
  // Lấy mã đơn hàng từ URL (?orderId=654abc...)
  const orderId = searchParams.get("orderId");

  // --- 3. EFFECTS (CONFETTI ANIMATION) ---
  useEffect(() => {
    // Cấu hình thời gian bắn pháo (3 giây)
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    // Hàm random helper
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    // Tạo interval để bắn pháo liên tục trong thời gian duration
    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Bắn pháo từ 2 bên góc trái và phải màn hình
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []);

  // --- 4. RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-up">
        {/* === SECTION A: HEADER XANH === */}
        <div className="bg-green-600 p-10 text-center relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
              <CheckCircle
                className="w-10 h-10 text-green-600"
                strokeWidth={3}
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-green-100">
              Cảm ơn bạn đã tin tưởng và mua sắm tại FreshFood.
            </p>
          </div>
        </div>

        {/* === SECTION B: NỘI DUNG CHÍNH === */}
        <div className="p-8">
          {/* 1. Mã đơn hàng */}
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm mb-1">Mã đơn hàng của bạn</p>
            <div className="text-2xl font-bold text-slate-800 tracking-wider bg-gray-100 py-2 px-4 rounded-lg inline-block border border-gray-200 border-dashed">
              {orderId ? `#${orderId.slice(-6).toUpperCase()}` : "#MỚI_NHẤT"}
            </div>
          </div>

          {/* 2. Timeline trạng thái (Visual Flow) */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-100 pb-2">
              Trạng thái đơn hàng
            </h3>

            <div className="relative flex justify-between">
              {/* Progress Bar Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 -z-0"></div>
              {/* Progress Bar Active (33% - Step 1) */}
              <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-green-500 -translate-y-1/2 -z-0"></div>

              {/* Step 1: Đã đặt */}
              <div className="relative z-10 bg-white px-2 flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle size={16} />
                </div>
                <span className="text-xs font-bold text-green-700">Đã đặt</span>
              </div>

              {/* Step 2: Xác nhận */}
              <div className="relative z-10 bg-white px-2 flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-green-100 text-green-600 border-2 border-green-600 rounded-full flex items-center justify-center">
                  <PackageCheck size={16} />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Xác nhận
                </span>
              </div>

              {/* Step 3: Giao hàng */}
              <div className="relative z-10 bg-white px-2 flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                  <Truck size={16} />
                </div>
                <span className="text-xs text-gray-500">Giao hàng</span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6 italic">
              Chúng tôi sẽ sớm liên hệ để xác nhận thông tin giao hàng của bạn.
            </p>
          </div>

          {/* 3. Nút điều hướng */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/home"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Home size={18} />
              Về trang chủ
            </Link>
            <Link
              href={`/profile/orders/${orderId}`}
              className="flex-1 bg-slate-900 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-slate-200"
            >
              <ShoppingBag size={18} />
              Xem đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
