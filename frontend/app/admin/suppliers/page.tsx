"use client";

import React, { useState, useEffect } from "react";
// 1. Icons & UI Libs
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Phone,
  MapPin,
  Mail,
  X,
  Save,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

// 2. Services
import { supplierService, Supplier } from "@/services/supplier.service";

// 3. Components
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";

// --- CONSTANTS ---
const INITIAL_FORM: Partial<Supplier> = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

export default function AdminSuppliersPage() {
  // --- A. STATE MANAGEMENT ---

  // 1. Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Form & UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>(INITIAL_FORM);

  // 3. Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- B. API CALLS ---

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierService.getAll(page, 12, searchQuery);
      if (res && Array.isArray(res.data)) {
        setSuppliers(res.data);
        setTotalPages(res.lastPage);
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error("Lỗi tải NCC:", error);
      toast.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, searchQuery]);

  // --- C. HANDLERS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cơ bản
    if (!formData.name || !formData.phone) {
      return toast.warning("Vui lòng nhập Tên và SĐT nhà cung cấp");
    }

    try {
      // Lọc bỏ các trường hệ thống không cho gửi lên
      const { _id, createdAt, updatedAt, ...payload } = formData as any;

      if (isEditing && _id) {
        await supplierService.update(_id, payload);
        toast.success("Cập nhật thành công!");
      } else {
        await supplierService.create(payload as Supplier);
        toast.success("Thêm mới thành công!");
      }

      closeForm();
      fetchSuppliers();
    } catch (err) {
      toast.error("Lỗi khi lưu dữ liệu");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
      try {
        await supplierService.delete(id);
        toast.success("Đã xóa nhà cung cấp");
        fetchSuppliers();
      } catch (e) {
        toast.error("Xóa thất bại");
      }
    }
  };

  // Form Helpers
  const handleEdit = (s: Supplier) => {
    setFormData(s);
    setIsEditing(true);
    setShowForm(true);
  };

  const openAddForm = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(INITIAL_FORM);
  };

  // --- D. RENDER ---
  return (
    <div className="text-slate-800 pb-20 animate-fade-in font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Nhà cung cấp</h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý đối tác cung ứng hàng hóa.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên, SĐT..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={fetchSuppliers}
          />
          <button
            onClick={openAddForm}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Thêm mới
          </button>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {isEditing ? (
                  <Edit className="text-blue-600" />
                ) : (
                  <Plus className="text-green-600" />
                )}
                {isEditing ? "Cập nhật thông tin" : "Thêm nhà cung cấp mới"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-red-500 transition p-1 rounded-full hover:bg-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tên Doanh Nghiệp */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Tên Doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                  <input
                    required
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Công ty TNHH ABC..."
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    autoFocus
                  />
                </div>
              </div>

              {/* Grid 2 Cột */}
              <div className="grid grid-cols-2 gap-5">
                {/* Người liên hệ */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Người liên hệ
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={16}
                    />
                    <input
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="Mr. A"
                      value={formData.contactPerson || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* SĐT */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-2.5 text-gray-400"
                      size={16}
                    />
                    <input
                      required
                      className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                      placeholder="09xxx..."
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Email liên hệ
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={16}
                  />
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="contact@company.com"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Địa chỉ kho/văn phòng
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={16}
                  />
                  <input
                    className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Số nhà, đường, quận/huyện..."
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition active:scale-95"
                >
                  <Save size={18} /> Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- LIST SUPPLIERS --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Building2 size={48} className="mx-auto mb-2 opacity-20" />
          <p>Chưa có nhà cung cấp nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s, index) => (
            <div
              key={s._id}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:scale-101 transition-all duration-300 group relative animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header Card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4
                      className="font-bold text-lg text-slate-800 line-clamp-1"
                      title={s.name}
                    >
                      {s.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <UserIcon size={12} /> {s.contactPerson || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition"
                    title="Sửa"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Body Card */}
              <div className="space-y-2 text-sm text-gray-600 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2 py-1">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-medium text-slate-700">{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{s.email || "Chưa có email"}</span>
                </div>
                <div className="flex items-start gap-2 py-1">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 text-xs leading-relaxed">
                    {s.address || "Chưa cập nhật địa chỉ"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PAGINATION --- */}
      <div className="mt-8 flex justify-end">
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
