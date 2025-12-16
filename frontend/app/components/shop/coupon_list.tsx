"use client";

import React, { useEffect, useState } from "react";
import { couponService, Coupon } from "@/services/coupon.service";
import { Copy, TicketPercent, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// --- HELPERS ---
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Vô thời hạn";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

export default function CouponList() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await couponService.getActiveCoupons();
        setCoupons(data || []);
      } catch (error) {
        console.error("Lỗi tải mã giảm giá:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Đã lưu mã: ${code}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-400 animate-pulse flex justify-center gap-2">
        <TicketPercent size={16} /> Đang tải ưu đãi...
      </div>
    );
  }

  if (coupons.length === 0) return null;

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <TicketPercent className="text-orange-500" size={20} />
        <h3 className="text-lg font-bold text-slate-800">
          Mã giảm giá có thể dùng
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon._id}
            className="group relative flex bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 overflow-hidden"
          >
            {/* --- CỘT TRÁI: TÊN TRƯỜNG DỮ LIỆU --- */}
            <div className="bg-orange-50 w-24 flex flex-col items-center justify-center border-r border-dashed border-orange-200 p-2 shrink-0">
              <span className="text-xl font-black text-orange-600">
                {coupon.type === "PERCENT"
                  ? `${coupon.value}%`
                  : `${coupon.value / 1000}k`}
              </span>
              <span className="text-[10px] font-bold text-orange-400 uppercase">
                OFF
              </span>
            </div>

            <div className="flex-1 p-3 flex flex-col justify-between relative">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-700 text-sm font-mono tracking-wide">
                    {coupon.code}
                  </span>
                  <button
                    onClick={() => handleCopy(coupon._id, coupon.code)}
                    className="text-gray-400 hover:text-orange-600 transition p-1 hover:bg-orange-50 rounded"
                    title="Sao chép mã"
                  >
                    {copiedId === coupon._id ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <p
                  className="text-xs text-gray-500 mt-1 line-clamp-1"
                  title={coupon.description}
                >
                  {coupon.description}
                </p>
              </div>

              {/* --- ĐIỀU KIỆN --- */}
              <div className="mt-2 flex justify-between items-end">
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-100">
                  Đơn từ {formatCurrency(coupon.minOrderValue || 0)}
                </span>
                <span className="text-[10px] text-orange-500 font-medium">
                  HSD: {formatDate(coupon.expiryDate)}
                </span>
              </div>
            </div>

            {/* Trang trí */}
            <div className="absolute top-0 left-24 w-3 h-3 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 border-b border-gray-200 z-10 group-hover:border-orange-200 transition-colors"></div>
            <div className="absolute bottom-0 left-24 w-3 h-3 bg-white rounded-full -translate-x-1/2 translate-y-1/2 border-t border-gray-200 z-10 group-hover:border-orange-200 transition-colors"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
