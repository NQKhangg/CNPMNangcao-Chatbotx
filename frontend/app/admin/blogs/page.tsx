"use client";

import React, { useState, useEffect } from "react";
import { blogService, Blog } from "@/services/blog.service";
import { uploadService } from "@/services/user.service";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Eye,
  EyeOff,
  UploadCloud,
  Hash,
  ArrowLeft,
  FileText,
} from "lucide-react";
import Pagination from "@/app/components/pagination";
import AdminSearch from "@/app/components/admin/search";

// --- KHỞI TẠO DỮ LIỆU ---
const INITIAL_BLOG: Blog = {
  title: "",
  slug: "",
  shortDescription: "",
  content: "",
  thumbnail: "",
  category: "Tin tức",
  tags: [],
  isPublished: true,
  author: { _id: "", name: "", avatar: "" },
};

export default function AdminBlogsPage() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UI & FORM ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Blog>(INITIAL_BLOG);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState(""); // State riêng cho ô nhập tag

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- API: TẢI DANH SÁCH BLOG ---
  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await blogService.getAll(page, 10, searchQuery);
      setBlogs(res.data || []);
      setTotalPages(res.lastPage || 1);
    } catch (error) {
      console.error("Lỗi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại khi trang hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    fetchBlogs();
  }, [page, searchQuery]);

  // --- HANDLER: UPLOAD ẢNH ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadService.uploadImage(file);
        setFormData((prev) => ({ ...prev, thumbnail: url }));
      } catch (error) {
        alert("Lỗi upload ảnh.");
      }
    }
  };

  // --- HANDLER: XỬ LÝ TAGS ---
  const removeTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(",", "");
      if (newTag && !formData.tags?.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
        setTagInput("");
      }
    }
  };

  // --- HANDLER: SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Auto generate slug nếu người dùng không nhập
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.slug) {
        dataToSubmit.slug = dataToSubmit.title
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "");
      }

      if (isEditing && editId) {
        await blogService.update(editId, dataToSubmit);
        alert("Cập nhật bài viết thành công!");
      } else {
        await blogService.create(dataToSubmit);
        alert("Đã tạo bài viết mới!");
      }
      closeForm();
      fetchBlogs();
    } catch (error) {
      alert("Đã có lỗi xảy ra khi lưu.");
    }
  };

  // --- HANDLER: ACTION (SỬA/XÓA) ---
  const handleEdit = (blog: Blog) => {
    setFormData(blog);
    setEditId(blog._id!);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await blogService.delete(id);
        fetchBlogs();
      } catch (error) {
        alert("Xóa thất bại.");
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(INITIAL_BLOG);
    setIsEditing(false);
    setEditId(null);
  };

  // --- STYLE CHUNG CHO INPUT  ---
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder-gray-400";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <div className="font-sans text-slate-800 pb-20 animate-fade-in">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Quản lý Tin tức</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chia sẻ kiến thức và thông tin hữu ích tới khách hàng.
          </p>
        </div>

        {/* Chỉ hiện công cụ tìm kiếm khi không mở form */}
        {!showForm && (
          <div className="flex gap-3 w-full md:w-auto">
            <AdminSearch
              placeholder="Tìm theo tiêu đề..."
              onSearch={(q) => {
                setSearchQuery(q);
                setPage(1);
              }}
              onRefresh={fetchBlogs}
            />
            <button
              onClick={() => {
                setFormData(INITIAL_BLOG);
                setIsEditing(false);
                setShowForm(true);
              }}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Viết bài mới</span>
            </button>
          </div>
        )}
      </div>

      {/* --- FORM EDITOR (HIỆN KHI BẤM THÊM/SỬA) --- */}
      {showForm ? (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 mb-10 animate-slide-down">
          {/* Header Form */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-xl text-slate-700 flex items-center gap-2">
              {isEditing ? (
                <Edit className="text-blue-500" />
              ) : (
                <Plus className="text-green-500" />
              )}
              {isEditing ? "Chỉnh sửa bài viết" : "Soạn bài viết mới"}
            </h3>
            <button
              onClick={closeForm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={18} /> Quay lại
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* CỘT TRÁI: NỘI DUNG CHÍNH */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tiêu đề */}
              <div>
                <label className={labelClass}>
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className={`${inputClass} font-medium text-lg`}
                  placeholder="Nhập tiêu đề bài viết..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              {/* Slug */}
              <div>
                <label className={labelClass}>Đường dẫn (Slug)</label>
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                  <span className="px-3 py-2.5 text-gray-500 bg-gray-100 border-r border-gray-300 text-sm font-mono">
                    /blog/
                  </span>
                  <input
                    className="w-full px-4 py-2.5 bg-transparent outline-none text-sm font-mono text-slate-700"
                    placeholder="tieu-de-bai-viet-tu-dong-tao"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className={labelClass}>Mô tả ngắn (SEO)</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="Tóm tắt nội dung bài viết (khoảng 2-3 câu)..."
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortDescription: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              {/* Nội dung HTML */}
              <div>
                <label className={labelClass}>Nội dung chi tiết (HTML)</label>
                <div className="relative">
                  <textarea
                    className={`${inputClass} font-mono text-sm leading-relaxed`}
                    rows={15}
                    placeholder="<p>Nội dung bài viết...</p>"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                  ></textarea>
                  <div className="absolute top-2 right-2 p-1 bg-gray-100 rounded text-gray-400">
                    <FileText size={16} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">
                  * Hỗ trợ nhập mã HTML hoặc văn bản thuần.
                </p>
              </div>
            </div>

            {/* CỘT PHẢI: SIDEBAR CÀI ĐẶT */}
            <div className="space-y-6">
              {/* Box 1: Phân loại & Tags */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <label className={labelClass}>Danh mục</label>
                <select
                  className={`${inputClass} bg-white mb-5 cursor-pointer`}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="Tin tức">Tin tức</option>
                  <option value="Sức khỏe">Sức khỏe</option>
                  <option value="Mẹo vặt">Mẹo vặt</option>
                  <option value="Khuyến mãi">Khuyến mãi</option>
                </select>

                <label className={`${labelClass} flex items-center gap-1`}>
                  <Hash size={14} /> Tags
                </label>
                <div className="bg-white border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-green-500 transition-all">
                  {/* Hiển thị Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(idx)}
                          className="hover:bg-green-200 rounded-full p-0.5 transition"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Input nhập Tag */}
                  <input
                    className="w-full outline-none text-sm px-1"
                    placeholder="Nhập tag rồi Enter..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                </div>
              </div>

              {/* Box 2: Ảnh đại diện */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <label className={labelClass}>Ảnh bìa (Thumbnail)</label>
                <div className="relative w-full aspect-video bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer shadow-sm">
                  {formData.thumbnail ? (
                    <>
                      <img
                        src={formData.thumbnail}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        alt="Thumbnail"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 p-4">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <span className="text-xs font-medium">
                        Nhấn để tải ảnh lên
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleUpload}
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Box 3: Trạng thái & Action (Sticky) */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-sm text-slate-700">
                    Trạng thái
                  </span>
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Save size={18} /> Lưu lại
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* --- BẢNG DANH SÁCH (HIỆN KHI KHÔNG MỞ FORM) --- */
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-slate-600 font-bold uppercase text-xs tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-4 w-24 text-center">Ảnh</th>
                  <th className="p-4">Thông tin bài viết</th>
                  <th className="p-4 w-40">Danh mục</th>
                  <th className="p-4 w-32 text-center">Trạng thái</th>
                  <th className="p-4 w-32 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : blogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center flex flex-col items-center justify-center text-gray-400"
                    >
                      <div className="bg-gray-50 p-4 rounded-full mb-3">
                        <ImageIcon size={32} />
                      </div>
                      Chưa có bài viết nào.
                    </td>
                  </tr>
                ) : (
                  blogs.map((blog, index) => (
                    <tr
                      key={blog._id}
                      className="hover:bg-gray-200 transition-colors group transform duration-300 hover:scale-101 animate-fade-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <td className="p-4 text-center">
                        <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
                          {blog.thumbnail ? (
                            <img
                              src={blog.thumbnail}
                              className="w-full h-full object-cover"
                              alt="thumb"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <h4 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
                          {blog.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                            /{blog.slug}
                          </span>
                          {blog.author && <span>• bởi {blog.author.name}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                          {blog.category}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {blog.isPublished ? (
                          <div className="flex items-center justify-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                            <Eye size={12} /> Public
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                            <EyeOff size={12} /> Nháp
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
