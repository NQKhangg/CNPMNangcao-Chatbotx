"use client";

import React, { useState, useEffect } from "react";
import { categoryService, Category } from "@/services/category.service";
import { uploadService } from "@/services/user.service";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Unlock,
  Lock,
  X,
  Save,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";

// --- KHỞI TẠO DỮ LIỆU ---
const INITIAL_FORM = {
  _id: "",
  name: "",
  slug: "",
  image: "",
  description: "",
  isActive: true,
};

export default function AdminCategoriesPage() {
  // --- STATE DATA ---
  const [categories, setCategories] = useState<Category[]>([]);

  // --- STATE FORM & UI ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- STATE PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- API: LOAD DATA ---
  const loadData = async () => {
    try {
      // Gọi API lấy danh sách danh mục
      const res: any = await categoryService.getAllAdmin(page, 12, searchQuery);

      if (res && Array.isArray(res.data)) {
        setCategories(res.data);
        setTotalPages(res.lastPage);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      toast.error("Không thể tải danh sách danh mục");
    }
  };

  // Reload khi page hoặc searchQuery thay đổi
  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  // --- HANDLER: SUBMIT FORM (CREATE / UPDATE) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn reload trang
    try {
      // 1. Auto generate slug nếu rỗng
      const payload = { ...formData };
      if (!payload.slug) {
        payload.slug = payload.name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      }

      // 2. Gọi API tương ứng
      if (isEditing) {
        await categoryService.update(formData._id, payload);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const { _id, ...safePayload } = payload;
        await categoryService.create(safePayload);
        toast.success("Tạo danh mục mới thành công!");
      }

      // 3. Reset form & Reload data
      setShowForm(false);
      loadData();
    } catch (error) {
      toast.error("Lỗi khi lưu danh mục!");
    }
  };

  // --- HANDLER: UPLOAD IMAGE ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadService.uploadImage(file);
        setFormData((prev) => ({ ...prev, image: url }));
      } catch (error) {
        toast.error("Lỗi upload ảnh");
      }
    }
  };

  // --- HANDLER: UPDATE STATUS (ACTIVE/INACTIVE) ---
  const updateActive = async (cat: any) => {
    const newStatus = !cat.isActive;
    try {
      await categoryService.updateActive(cat._id, newStatus);
      loadData(); // Reload lại để cập nhật giao diện
      toast.success(newStatus ? "Đã hiện danh mục" : "Đã ẩn danh mục");
    } catch (e) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- HANDLER: DELETE ---
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await categoryService.delete(id);
        loadData();
        toast.success("Đã xóa danh mục");
      } catch (error) {
        toast.error("Xóa thất bại");
      }
    }
  };

  // --- HELPER: OPEN FORM ---
  const openAddForm = () => {
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (cat: Category) => {
    setFormData(cat);
    setIsEditing(true);
    setShowForm(true);
  };

  return (
    <div className="text-slate-800 pb-20 animate-fade-in">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý Danh mục
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Phân loại sản phẩm để khách hàng dễ tìm kiếm.
          </p>
        </div>

        {/* TOOLBAR */}
        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên, slug..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={loadData}
          />
          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={20} />{" "}
            <span className="hidden sm:inline">Thêm mới</span>
          </button>
        </div>
      </div>

      {/* --- MODAL FORM (Overlay) --- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">
                {isEditing ? (
                  <Edit className="text-blue-500" size={20} />
                ) : (
                  <Plus className="text-green-500" size={20} />
                )}
                {isEditing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload Area */}
              <div className="flex justify-center mb-2">
                <div className="relative group w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-green-500 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer transition-all">
                  {formData.image ? (
                    <>
                      <img
                        src={formData.image}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon size={24} className="mx-auto mb-1" />
                      <span className="text-[10px]">Upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleUpload}
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  placeholder="VD: Rau củ quả..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              {/* Slug Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-500 font-mono text-sm outline-none"
                  placeholder="tu-dong-tao-tu-ten"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                  placeholder="Mô tả ngắn về danh mục này..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={18} /> Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!showForm && categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <ImageIcon size={48} className="text-gray-300" />
          </div>
          <p className="font-medium">Chưa có danh mục nào.</p>
          <button
            onClick={openAddForm}
            className="text-green-600 font-bold text-sm hover:underline mt-2"
          >
            Tạo danh mục đầu tiên
          </button>
        </div>
      )}

      {/* --- GRID LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((cat, index) => (
          <div
            key={cat._id}
            className={`bg-white p-5 rounded-2xl border transition-all duration-300 group relative
              ${
                !cat.isActive
                  ? "border-gray-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  : "border-gray-100 hover:border-green-300 hover:shadow-xl hover:-translate-y-1"
              } animate-fade-up`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Top: Image & Info */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                <img
                  src={cat.image || "https://placehold.co/100?text=No+Img"}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="font-bold text-slate-800 truncate text-lg group-hover:text-green-600 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || "Chưa có mô tả"}
                </p>
              </div>
            </div>

            {/* Bottom: Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
              <div className="flex items-center gap-1">
                {/* Edit Button */}
                <button
                  onClick={() => openEditForm(cat)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit size={18} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Status Toggle Button */}
              <button
                onClick={() => updateActive(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer
                    ${
                      cat.isActive
                        ? "bg-green-50 text-green-700 border border-green-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                        : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-100"
                    }`}
                title={
                  cat.isActive
                    ? "Đang hiện (Nhấn để ẩn)"
                    : "Đang ẩn (Nhấn để hiện)"
                }
              >
                {cat.isActive ? <Unlock size={14} /> : <Lock size={14} />}
                {cat.isActive ? "Active" : "Hidden"}
              </button>
            </div>
          </div>
        ))}
      </div>

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
