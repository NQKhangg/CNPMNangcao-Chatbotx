"use client";

import React, { useState, useEffect } from "react";
// 1. Icons & UI Libs
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  ImageIcon,
  Unlock,
  Lock,
  User as UserIcon,
  Phone,
  MapPin,
  Mail,
  Briefcase,
  Key,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

// 2. Services
import { userService, User, uploadService } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import { Department, departmentService } from "@/services/department.service";

// 3. Components
import Pagination from "@/app/components/pagination";
import AdminSearch from "@/app/components/admin/search";

// --- CONSTANTS ---
const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  avatar: "",
  phone: "",
  gender: "Male",
  dateOfBirth: "",
  address: "",
  employeeCode: "",
  department: "",
};

export default function AdminStaffsPage() {
  // --- A. STATE MANAGEMENT ---

  // 1. Data State
  const [staffs, setStaffs] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Form & UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  // 3. Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- B. API CALLS ---

  // Load Data (Staffs, Roles, Departments)
  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, rData, dData] = await Promise.all([
        userService.getStaffs(page, 10, searchQuery),
        roleService.getAll(),
        departmentService.getAll(1, 1000, ""),
      ]);

      if (uData && Array.isArray(uData.data)) {
        // Flatten address để hiển thị dễ hơn
        setStaffs(
          uData.data.map((u) => ({
            ...u,
            address: u.addresses?.[0]?.address || "",
          }))
        );
        setTotalPages(uData.lastPage);
      }

      if (rData && Array.isArray(rData)) setRoles(rData);
      if (dData && Array.isArray(dData.data)) setDepartments(dData.data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, searchQuery]);

  // --- C. HANDLERS ---

  // 1. Upload Avatar
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      toast.error("Lỗi upload ảnh");
    }
  };

  // 2. Toggle Status (Lock/Unlock)
  const handleToggleStatus = async (user: User) => {
    try {
      await userService.updateStatus(user._id, !user.isActive);
      toast.success(
        user.isActive ? "Đã khóa tài khoản" : "Đã kích hoạt tài khoản"
      );
      loadData();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // 3. Submit Form (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn reload trang mặc định

    // Validate
    if (!formData.name || !formData.email || !formData.roleId) {
      return toast.warning("Vui lòng nhập đủ Họ tên, Email và Vai trò");
    }

    try {
      // Chuẩn hóa dữ liệu
      const { address, password, ...rest } = formData;
      const payload: any = {
        ...rest,
        // Map address string -> array object
        addresses: address
          ? [
              {
                label: "Địa chỉ thường trú",
                address: address,
                phone: formData.phone,
                receiverName: formData.name,
                isDefault: true,
              },
            ]
          : [],
        ...(formData.department ? { department: formData.department } : {}),
      };

      if (isEditing && editId) {
        // UPDATE
        if (password) payload.password = password; // Chỉ gửi pass nếu có nhập
        await userService.updateUser(editId, payload);
        toast.success("Cập nhật hồ sơ thành công!");
      } else {
        // CREATE
        if (!password)
          return toast.warning("Vui lòng nhập mật khẩu cho nhân viên mới");
        payload.password = password;
        await userService.createStaff(payload);
        toast.success("Tạo nhân viên mới thành công!");
      }

      closeForm();
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Lỗi xảy ra (Email có thể bị trùng)"
      );
    }
  };

  // 4. Delete (Soft Delete)
  const handleDelete = async (id: string) => {
    if (
      confirm("CẢNH BÁO: Bạn có chắc muốn xóa (khóa vĩnh viễn) nhân viên này?")
    ) {
      try {
        await userService.remove(id);
        toast.success("Đã xóa nhân viên");
        loadData();
      } catch (e) {
        toast.error("Xóa thất bại");
      }
    }
  };

  // 5. Form Helpers
  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditId(user._id);

    // Xử lý ID (khi field là Object hoặc String)
    const depId =
      typeof user.department === "object"
        ? (user.department as any)._id
        : user.department || "";
    const roleId =
      typeof user.roleId === "object"
        ? (user.roleId as any)._id
        : user.roleId || "";

    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Không hiển thị pass cũ
      roleId: roleId,
      avatar: user.avatar || "",
      phone: user.phone || "",
      gender: (user as any).gender || "Male",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      address: user.address || user.addresses?.[0]?.address || "",
      employeeCode: user.employeeCode || "",
      department: depId,
    });
    setShowForm(true);
  };

  const openAddForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(INITIAL_FORM);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(INITIAL_FORM);
  };

  // --- D. RENDER ---
  return (
    <div className="font-sans text-slate-800 pb-20 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Quản lý Nhân sự</h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách nhân viên và phân quyền truy cập hệ thống.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <AdminSearch
            placeholder="Tìm tên, mã NV, email..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={loadData}
          />
          <button
            onClick={openAddForm}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* --- FORM MODAL --- */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {isEditing ? (
                  <Edit className="text-blue-600" />
                ) : (
                  <Plus className="text-green-600" />
                )}
                {isEditing
                  ? "Cập nhật hồ sơ nhân sự"
                  : "Tạo hồ sơ nhân viên mới"}
              </h3>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-white rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-8 bg-white"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUMN 1: Avatar & Basic Info */}
                <div className="lg:col-span-1 flex flex-col items-center text-center space-y-6">
                  {/* Avatar Upload */}
                  <div className="relative group w-40 h-40">
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          className="w-full h-full object-cover"
                          alt="Avatar"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                          <UserIcon size={64} />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-transform hover:scale-110">
                      <ImageIcon size={18} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="text-left">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Mã nhân viên
                      </label>
                      <div className="relative">
                        <Key
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                        <input
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="AUTO"
                          value={formData.employeeCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employeeCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Vai trò hệ thống <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.roleId}
                        onChange={(e) =>
                          setFormData({ ...formData, roleId: e.target.value })
                        }
                      >
                        <option value="">-- Chọn Role --</option>
                        {roles.map(
                          (r) =>
                            r.name !== "Customer" && (
                              <option key={r._id} value={r._id}>
                                {r.name}
                              </option>
                            )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2 & 3: Details Form */}
                <div className="lg:col-span-2 space-y-5">
                  <h4 className="font-bold text-slate-800 border-b pb-2 mb-4">
                    Thông tin chi tiết
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-sm font-semibold mb-1 block">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                        <input
                          required
                          type="email"
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          disabled={isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                        <input
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Mật khẩu{" "}
                        {isEditing && (
                          <span className="text-xs font-normal text-gray-400">
                            (Trống nếu không đổi)
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                        placeholder={
                          isEditing ? "••••••••" : "Nhập mật khẩu..."
                        }
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Phòng ban
                      </label>
                      <div className="relative">
                        <Briefcase
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                        <select
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none bg-white appearance-none"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Chưa phân bổ --</option>
                          {departments.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Giới tính
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none bg-white"
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                      >
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-1 block">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm font-semibold mb-1 block">
                        Địa chỉ thường trú
                      </label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-2.5 text-gray-400"
                          size={16}
                        />
                        <input
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:border-blue-500 outline-none"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          placeholder="Số nhà, đường, phường/xã..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeForm}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-white hover:shadow-sm transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95 flex items-center gap-2"
              >
                <Save size={18} />{" "}
                {isEditing ? "Lưu thay đổi" : "Tạo nhân viên"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- STAFF TABLE LIST --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 w-[280px]">Thông tin nhân viên</th>
              <th className="p-4">Mã NV</th>
              <th className="p-4">Phòng ban</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-center w-[160px]">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" /> Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : (
              staffs.map((user, index) => (
                <tr
                  key={user._id}
                  className="hover:bg-blue-50/30 transition-colors duration-200 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Cột 1: Info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${user.name}&background=random`
                          }
                          className="w-full h-full object-cover"
                          alt={user.name}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Code */}
                  <td className="p-4 font-mono text-slate-600">
                    {user.employeeCode || "---"}
                  </td>

                  {/* Cột 3: Department */}
                  <td className="p-4">
                    {user.department ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <Briefcase size={12} className="mr-1" />
                        {typeof user.department === "object"
                          ? (user.department as any).name
                          : "Unknown"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">
                        Chưa phân bổ
                      </span>
                    )}
                  </td>

                  {/* Cột 4: Role */}
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                      <Shield size={12} className="mr-1" />
                      {(user.roleId as any)?.name || "Guest"}
                    </span>
                  </td>

                  {/* Cột 5: Status */}
                  <td className="p-4 text-center">
                    {user.isActive ? (
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                        Locked
                      </span>
                    )}
                  </td>

                  {/* Cột 6: Actions */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg transition ${
                          user.isActive
                            ? "text-orange-500 hover:bg-orange-100"
                            : "text-green-600 hover:bg-green-100"
                        }`}
                        title={user.isActive ? "Khóa" : "Mở khóa"}
                      >
                        {user.isActive ? (
                          <Lock size={18} />
                        ) : (
                          <Unlock size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="mt-6 flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
