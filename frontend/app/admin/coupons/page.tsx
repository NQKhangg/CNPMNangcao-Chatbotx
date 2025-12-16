"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Edit,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  X,
  ShoppingBag,
} from "lucide-react";
import AdminSearch from "@/app/components/admin/search";
import { toast } from "sonner";
import { couponService } from "@/services/coupon.service";
import Pagination from "@/app/components/pagination";

// --- KHỞI TẠO STATE MẶC ĐỊNH ---
const INITIAL_FORM_STATE = {
  code: "",
  type: "PERCENT", // PERCENT | AMOUNT
  value: 0,
  minOrderValue: 0,
  expiryDate: "",
  usageLimit: 100,
  isActive: true,
};

export default function AdminCouponsPage() {
  // --- STATE DATA ---
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE FORM ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // --- STATE PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- HELPER: FORMAT DATE (ISO -> YYYY-MM-DD) ---
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split("T")[0];
  };

  // --- API: LOAD DATA ---
  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponService.getAll(page, 9, searchQuery);
      if (res && Array.isArray(res.data)) {
        setCoupons(res.data);
        setTotalPages(res.lastPage);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error("Lỗi tải coupon:", error);
      toast.error("Không thể tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  // Reload khi page hoặc search thay đổi
  useEffect(() => {
    loadCoupons();
  }, [page, searchQuery]);

  // --- HANDLER: OPEN FORM (EDIT) ---
  const handleEdit = (coupon: any) => {
    setIsEditing(true);
    setCurrentId(coupon._id);

    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue || 0,
      expiryDate: formatDateForInput(coupon.expiryDate),
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- HANDLER: RESET FORM ---
  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData(INITIAL_FORM_STATE);
  };

  // --- HANDLER: SUBMIT ---
  const handleSubmit = async () => {
    // Validate cơ bản
    if (!formData.code || !formData.expiryDate) {
      return toast.warning("Vui lòng nhập Mã code và Ngày hết hạn");
    }

    if (Number(formData.value) < 0) {
      return toast.warning("Giá trị giảm giá không được nhỏ hơn 0");
    }

    if (Number(formData.minOrderValue) < 0) {
      return toast.warning("Giá trị đơn hàng tối thiểu không được là số âm");
    }

    if (formData.type === "PERCENT" && Number(formData.value) > 100) {
      return toast.warning("Giảm giá phần trăm không được quá 100%");
    }

    try {
      if (isEditing && currentId) {
        // Update
        await couponService.update(currentId, formData);
        toast.success("Cập nhật mã thành công!");
      } else {
        // Create
        await couponService.create(formData);
        toast.success("Tạo mã giảm giá thành công!");
      }
      resetForm();
      loadCoupons();
    } catch (e: any) {
      const msg =
        e.response?.data?.message || "Có lỗi xảy ra (Mã có thể đã tồn tại)";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  // --- HANDLER: ACTIONS (DELETE / TOGGLE) ---
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa vĩnh viễn mã này?")) {
      try {
        await couponService.delete(id);
        toast.success("Đã xóa mã giảm giá");
        loadCoupons();
      } catch {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  const handleToggleStatus = async (coupon: any) => {
    try {
      await couponService.updateActive(coupon._id, !coupon.isActive);
      toast.success(coupon.isActive ? "Đã khóa mã" : "Đã kích hoạt mã");
      loadCoupons();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="text-slate-800 pb-20 font-sans animate-fade-in">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý Mã giảm giá
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Tạo các voucher khuyến mãi để kích cầu mua sắm.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm mã Code..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={loadCoupons}
          />
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={20} /> Tạo mã mới
          </button>
        </div>
      </div>

      {/* --- FORM SECTION --- */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 mb-10 animate-slide-down relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
              {isEditing ? (
                <Edit className="text-blue-500" />
              ) : (
                <Plus className="text-green-500" />
              )}
              {isEditing ? "Cập nhật mã giảm giá" : "Thêm mã giảm giá mới"}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Hàng 1: Mã - Loại - Giá trị */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 1. Mã Code */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Mã Code
              </label>
              <div className="relative">
                <Ticket
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  placeholder="VD: SUMMER2024"
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-4 uppercase font-bold outline-none transition
                    ${
                      isEditing
                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "bg-white border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                    }`}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  disabled={isEditing}
                />
              </div>
            </div>

            {/* 2. Loại giảm */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Loại giảm giá
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-gray-400">
                  {formData.type === "PERCENT" ? (
                    <Percent size={18} />
                  ) : (
                    <DollarSign size={18} />
                  )}
                </div>
                <select
                  className="w-full border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none appearance-none cursor-pointer"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="PERCENT">Giảm theo %</option>
                  <option value="AMOUNT">Giảm tiền mặt (VNĐ)</option>
                </select>
              </div>
            </div>

            {/* 3. Giá trị */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Giá trị giảm
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Hàng 2: Đơn tối thiểu - Ngày hết hạn - Số lượng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 4. Đơn tối thiểu */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Đơn tối thiểu (VNĐ)
              </label>
              <div className="relative">
                <ShoppingBag
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="0 = Không giới hạn"
                  className="w-full border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: Number(e.target.value),
                    })
                  }
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">
                * Nhập 0 nếu áp dụng cho mọi đơn hàng.
              </span>
            </div>

            {/* 5. Ngày hết hạn */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Ngày hết hạn
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition cursor-pointer"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 6. Số lượng */}
            <div>
              <label className="text-sm font-bold mb-1.5 block text-slate-700">
                Số lượng giới hạn
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-xl py-2.5 pl-10 pr-4 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isEditing ? <Edit size={18} /> : <Plus size={18} />}
              {isEditing ? "Cập nhật" : "Lưu mã"}
            </button>
          </div>
        </div>
      )}

      {/* --- LIST COUPONS (GRID LAYOUT) --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {coupons.map((c, index) => {
            // Logic hiển thị badge trạng thái
            const isExpired =
              c.expiryDate && new Date() > new Date(c.expiryDate);
            const isOutOfStock =
              c.usageLimit > 0 && c.usedCount >= c.usageLimit;

            // Xác định style class
            let cardClass =
              "bg-white border-green-200 hover:border-green-400 hover:shadow-lg";
            if (!c.isActive)
              cardClass = "bg-gray-50 border-gray-200 opacity-60 grayscale";
            else if (isExpired || isOutOfStock)
              cardClass = "bg-white border-red-200";

            return (
              <div
                key={c._id}
                className={`
                  relative p-5 rounded-xl border border-dashed flex flex-col justify-between transition-all duration-300 hover:scale-102 animate-fade-up group
                  ${cardClass}
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Visual Effect */}
                <div className="absolute -left-2 top-1/2 w-4 h-4 bg-[#F8F9FA] rounded-full"></div>
                <div className="absolute -right-2 top-1/2 w-4 h-4 bg-[#F8F9FA] rounded-full"></div>

                {/* Top: Code & Action */}
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ticket
                        className={
                          c.isActive ? "text-green-600" : "text-gray-400"
                        }
                        size={20}
                      />
                      <span className="font-black text-xl text-slate-800 tracking-wide">
                        {c.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {!c.isActive && <Badge color="gray">ĐANG KHÓA</Badge>}
                      {c.isActive && isExpired && (
                        <Badge color="red">HẾT HẠN</Badge>
                      )}
                      {c.isActive && isOutOfStock && (
                        <Badge color="orange">HẾT LƯỢT</Badge>
                      )}
                      {c.isActive && !isExpired && !isOutOfStock && (
                        <Badge color="green">HOẠT ĐỘNG</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(c)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-2"></div>

                {/* Bottom: Info Detail */}
                <div className="flex justify-between items-end pl-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Giá trị giảm
                    </p>
                    <p className="text-2xl font-bold text-green-600 leading-none">
                      {c.type === "PERCENT"
                        ? `${c.value}%`
                        : `${c.value.toLocaleString()}đ`}
                    </p>
                    {/* Hiển thị Đơn tối thiểu */}
                    <p className="text-[10px] text-gray-400 mt-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded w-fit">
                      Đơn từ:{" "}
                      {c.minOrderValue > 0
                        ? c.minOrderValue.toLocaleString() + "đ"
                        : "0đ"}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-gray-500">
                      Đã dùng: <b className="text-slate-800">{c.usedCount}</b>/
                      {c.usageLimit === 0 ? "∞" : c.usageLimit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Hạn:{" "}
                      <span
                        className={`font-medium ${
                          isExpired ? "text-red-500" : "text-slate-800"
                        }`}
                      >
                        {c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString("vi-VN")
                          : "Vĩnh viễn"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status Toggle Button */}
                <button
                  onClick={() => handleToggleStatus(c)}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer
                      ${
                        c.isActive
                          ? "border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      }`}
                >
                  {c.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                  {c.isActive ? "KHÓA MÃ NÀY" : "KÍCH HOẠT LẠI"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && coupons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Ticket size={48} className="mb-3 opacity-20" />
          <p>Chưa có mã giảm giá nào được tạo.</p>
        </div>
      )}

      {/* --- PAGINATION --- */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// --- SUB-COMPONENT: BADGE ---
const Badge = ({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "red" | "green" | "gray" | "orange";
}) => {
  const styles = {
    red: "bg-red-100 text-red-600 border-red-200",
    green: "bg-green-100 text-green-700 border-green-200",
    gray: "bg-gray-100 text-gray-500 border-gray-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
  };
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded border font-bold ${styles[color]}`}
    >
      {children}
    </span>
  );
};
