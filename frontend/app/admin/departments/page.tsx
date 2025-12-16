"use client";

import React, { useState, useEffect } from "react";
import { departmentService, Department } from "@/services/department.service";
import { userService, User } from "@/services/user.service";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  UserCheck,
  Briefcase,
  Unlock,
  Lock,
  Loader2,
} from "lucide-react";
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";
import { toast } from "sonner";

// --- KHỞI TẠO STATE ---
const INITIAL_FORM = {
  name: "",
  description: "",
  manager: "",
  isActive: true,
};

export default function AdminDepartmentsPage() {
  // --- STATE DATA ---
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffs, setStaffs] = useState<User[]>([]); // Danh sách nhân viên để chọn manager
  const [loading, setLoading] = useState(true);

  // --- STATE FORM & UI ---
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- STATE PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- API: LOAD DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dData, uData] = await Promise.all([
        departmentService.getAll(page, 9, searchQuery),
        userService.getStaffs(1, 10000, ""),
      ]);

      if (dData && Array.isArray(dData.data)) {
        setDepartments(dData.data);
        setTotalPages(dData.lastPage);
      }

      if (uData && Array.isArray(uData.data)) {
        setStaffs(uData.data);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại khi page hoặc search thay đổi
  useEffect(() => {
    fetchData();
  }, [page, searchQuery]);

  // --- HANDLER: SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Chuẩn hóa dữ liệu trước khi gửi
      const payload = {
        ...formData,
        manager: formData.manager || undefined,
      };

      if (isEditing && editId) {
        await departmentService.update(editId, payload);
        toast.success("Cập nhật phòng ban thành công!");
      } else {
        await departmentService.create(payload);
        toast.success("Tạo phòng ban mới thành công!");
      }

      closeForm();
      fetchData();
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu!");
    }
  };

  // --- HANDLER: EDIT ---
  const handleEdit = (dep: Department) => {
    setIsEditing(true);
    setEditId(dep._id);

    // Lấy ID manager an toàn (xử lý populate)
    const managerId =
      dep.manager && typeof dep.manager === "object"
        ? dep.manager._id
        : (dep.manager as string) || "";

    setFormData({
      name: dep.name,
      description: dep.description || "",
      manager: managerId,
      isActive: dep.isActive,
    });
    setShowForm(true);
  };

  // --- HANDLER: DELETE ---
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
      try {
        await departmentService.delete(id);
        toast.success("Đã xóa phòng ban");
        fetchData();
      } catch (error) {
        toast.error("Xóa thất bại");
      }
    }
  };

  // --- HANDLER: TOGGLE STATUS ---
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await departmentService.updateActive(id, !currentStatus);
      toast.success(currentStatus ? "Đã khóa phòng ban" : "Đã kích hoạt lại");
      fetchData();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- HELPER: RESET FORM ---
  const closeForm = () => {
    setShowForm(false);
    setFormData(INITIAL_FORM);
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="text-slate-800 pb-20 animate-fade-in font-sans">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Quản lý Phòng ban
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cấu trúc tổ chức và nhân sự quản lý.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên phòng ban..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={fetchData}
          />
          <button
            onClick={() => {
              closeForm();
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus size={20} /> Tạo phòng ban
          </button>
        </div>
      </div>

      {/* --- MODAL FORM --- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {isEditing ? (
                  <Edit className="text-blue-500" />
                ) : (
                  <Plus className="text-green-500" />
                )}
                {isEditing ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-red-500 transition cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Tên phòng ban <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="VD: Phòng Kế toán"
                />
              </div>

              {/* Manager Select */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Trưởng phòng (Manager)
                </label>
                <div className="relative">
                  <UserCheck
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none transition bg-white appearance-none cursor-pointer"
                    value={formData.manager}
                    onChange={(e) =>
                      setFormData({ ...formData, manager: e.target.value })
                    }
                  >
                    <option value="">-- Chưa bổ nhiệm --</option>
                    {staffs.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} - {s.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Mô tả nhiệm vụ
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả ngắn gọn về chức năng của phòng ban..."
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={18} /> Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DATA LIST (GRID) --- */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-500 gap-2 items-center">
          <Loader2 className="animate-spin" /> Đang tải dữ liệu...
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
          <p>Chưa có phòng ban nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {departments.map((dep, index) => (
            <div
              key={dep._id}
              className={`
                bg-white p-6 rounded-2xl border transition-all duration-300 relative group animate-fade-up
                ${
                  !dep.isActive
                    ? "border-gray-200 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                    : "border-blue-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1"
                }
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header Card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">
                      {dep.name}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        dep.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {dep.isActive ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(dep)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Sửa"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => toggleStatus(dep._id, dep.isActive)}
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      dep.isActive
                        ? "text-orange-500 hover:bg-orange-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                    title={dep.isActive ? "Khóa" : "Kích hoạt"}
                  >
                    {dep.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(dep._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Body Card */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                  {dep.description ||
                    "Chưa có mô tả chi tiết cho phòng ban này."}
                </p>

                {/* Manager Box */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border shadow-sm text-gray-400">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      Trưởng phòng
                    </span>
                    <span className="text-sm font-bold text-slate-800 truncate block max-w-[150px]">
                      {dep.manager && typeof dep.manager === "object"
                        ? (dep.manager as any).name
                        : "---"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PAGINATION --- */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
