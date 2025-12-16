"use client";

import React, { useState, useEffect } from "react";
// 1. Icons & UI Libs
import {
  Edit,
  Trash2,
  Plus,
  Shield,
  Save,
  X,
  CheckCircle2,
  Lock,
  Users,
  Package,
  FileText,
  Settings,
  Layers,
  Key,
} from "lucide-react";

// 2. Services
import { roleService, Role, Permission } from "@/services/role.service";

// --- CONSTANTS ---
const RESOURCE_ICONS: Record<string, any> = {
  products: Package,
  users: Users,
  orders: FileText,
  roles: Shield,
  categories: Layers,
  settings: Settings,
};

export default function AdminRolesPage() {
  // --- A. STATE MANAGEMENT ---

  // 1. Data State
  const [roles, setRoles] = useState<Role[]>([]);
  const [RESOURCES, setRESOURCES] = useState<string[]>([]);
  const [ACTIONS, setACTIONS] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Form & UI State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // 3. Input State
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // --- B. API CALLS ---

  // Initial Load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [resData, actData, rolesData] = await Promise.all([
          roleService.getResource(),
          roleService.getAction(),
          roleService.getAll(),
        ]);

        // Convert Enum/Object values to Array
        setRESOURCES(Object.values(resData));
        setACTIONS(Object.values(actData));
        setRoles(rolesData);
      } catch (error) {
        console.error("Lỗi khởi tạo:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Reload Roles Only
  const fetchRoles = async () => {
    try {
      const data = await roleService.getAll();
      setRoles(data);
    } catch (error) {
      console.error("Lỗi tải role:", error);
    }
  };

  // --- C. HANDLERS: PERMISSION LOGIC ---

  // Kiểm tra xem (Resource, Action) đã được chọn chưa
  const isChecked = (res: string, act: string) => {
    const perm = permissions.find((p) => p.resource === res);
    return perm ? perm.actions.includes(act) : false;
  };

  // Xử lý khi tick/untick checkbox
  const handleCheck = (resource: string, action: string, checked: boolean) => {
    let newPerms = [...permissions];
    const existingIndex = newPerms.findIndex((p) => p.resource === resource);

    if (existingIndex > -1) {
      // Đã có Resource này trong list -> Cập nhật actions
      const existing = { ...newPerms[existingIndex] };

      if (checked) {
        if (!existing.actions.includes(action)) existing.actions.push(action);
      } else {
        existing.actions = existing.actions.filter((a) => a !== action);
      }

      // Nếu không còn action nào thì xóa luôn resource khỏi list
      if (existing.actions.length === 0) {
        newPerms.splice(existingIndex, 1);
      } else {
        newPerms[existingIndex] = existing;
      }
    } else if (checked) {
      // Chưa có Resource -> Thêm mới
      newPerms.push({ resource, actions: [action] });
    }

    setPermissions(newPerms);
  };

  // --- D. HANDLERS: FORM ACTIONS ---

  const handleSubmit = async () => {
    if (!roleName.trim()) return alert("Vui lòng nhập tên Role");

    try {
      // Loại bỏ các trường thừa (như _id) nếu có
      const cleanPermissions = permissions.map(({ resource, actions }) => ({
        resource,
        actions,
      }));
      const payload = { name: roleName, permissions: cleanPermissions };

      if (isEditing && editId) {
        await roleService.update(editId, payload);
        alert("Cập nhật thành công!");
      } else {
        await roleService.create(payload);
        alert("Tạo Role mới thành công!");
      }

      closeForm();
      fetchRoles();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu (Có thể tên Role đã tồn tại).");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "CẢNH BÁO: Xóa Role này sẽ ảnh hưởng đến tất cả User đang được gán nó!\nBạn có chắc chắn không?"
      )
    ) {
      try {
        await roleService.delete(id);
        fetchRoles();
        if (editId === id) closeForm();
      } catch (error) {
        alert("Xóa thất bại");
      }
    }
  };

  // Form Control Helpers
  const openAddForm = () => {
    setIsEditing(false);
    setEditId(null);
    setRoleName("");
    setPermissions([]);
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setIsEditing(true);
    setEditId(role._id);
    setRoleName(role.name);
    // Deep clone permissions để tránh tham chiếu đến object gốc trong list
    setPermissions(JSON.parse(JSON.stringify(role.permissions)));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
  };

  // --- E. RENDER ---
  return (
    <div className="font-sans text-slate-800 pb-20 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-green-600" size={32} /> Quản lý Phân quyền
          </h2>
          <p className="text-gray-500 mt-1">
            Thiết lập quyền hạn truy cập tài nguyên (RBAC) cho hệ thống.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-200 active:scale-95"
        >
          <Plus size={20} /> Tạo Role mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: ROLES LIST --- */}
        <div className="lg:col-span-4 space-y-4">
          {loading
            ? // Skeleton Loading
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))
            : roles.map((role, index) => {
                const isActive = editId === role._id;
                const isLocked = ["Admin", "Customer"].includes(role.name); // Các role hệ thống không nên xóa

                return (
                  <div
                    key={role._id}
                    onClick={() => handleEdit(role)}
                    className={`group cursor-pointer relative p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] 
                      ${
                        isActive
                          ? "bg-green-50 border-green-500 ring-1 ring-green-500 shadow-md"
                          : "bg-white border-gray-100 hover:border-green-300 hover:shadow-md"
                      } animate-fade-up`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3
                          className={`font-bold text-lg flex items-center gap-2 ${
                            isActive ? "text-green-800" : "text-slate-700"
                          }`}
                        >
                          {role.name}
                          {isLocked && (
                            <Lock
                              size={14}
                              className="text-gray-400"
                              title="System Role (Protected)"
                            />
                          )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Key size={12} /> {role.permissions.length} nhóm quyền
                        </p>
                      </div>

                      {!isLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(role._id);
                          }}
                          className="p-2 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition shadow-sm opacity-0 group-hover:opacity-100"
                          title="Xóa Role"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-green-50 border-t border-r border-green-500 transform rotate-45 hidden lg:block"></div>
                    )}
                  </div>
                );
              })}
        </div>

        {/* --- RIGHT COLUMN: PERMISSION FORM --- */}
        <div className="lg:col-span-8">
          {showForm ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-6 animate-slide-up">
              {/* Form Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                    {isEditing ? (
                      <Edit size={20} className="text-blue-500" />
                    ) : (
                      <Plus size={20} className="text-green-500" />
                    )}
                    {isEditing
                      ? `Chỉnh sửa: ${roleName}`
                      : "Thiết lập Role mới"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Cấp quyền truy cập chi tiết cho vai trò này.
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 hover:bg-white rounded-full transition text-gray-400 hover:text-red-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {/* 1. Input Name */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tên Role (Vai trò) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition font-medium text-slate-800"
                      placeholder="VD: Content Writer, Sale Manager..."
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      disabled={["Admin", "Customer"].includes(roleName)} // Chặn sửa tên role hệ thống
                    />
                  </div>
                </div>

                {/* 2. Permissions Matrix */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100/80 text-gray-600 font-bold border-b border-gray-200">
                        <tr>
                          <th className="p-4 w-1/3 text-slate-700 uppercase text-xs">
                            Tài nguyên (Resource)
                          </th>
                          {ACTIONS.map((act) => (
                            <th
                              key={act}
                              className="p-4 text-center uppercase text-[10px] tracking-wider"
                            >
                              <span
                                className={`px-2 py-1 rounded border shadow-sm ${
                                  act === "CREATE"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : act === "UPDATE"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : act === "DELETE"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-green-50 text-green-700 border-green-200" // READ or Others
                                }`}
                              >
                                {act}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {RESOURCES.map((res) => {
                          const Icon =
                            RESOURCE_ICONS[res.toLowerCase()] || Layers; // Fallback Icon
                          return (
                            <tr
                              key={res}
                              className="hover:bg-green-50/30 transition-colors group"
                            >
                              <td className="p-4 font-bold text-slate-700 capitalize flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                                  <Icon size={16} />
                                </div>
                                {res}
                              </td>
                              {ACTIONS.map((act) => {
                                const checked = isChecked(res, act);
                                return (
                                  <td
                                    key={act}
                                    className="p-4 text-center relative"
                                  >
                                    <label className="cursor-pointer flex items-center justify-center w-full h-full absolute inset-0 group/check">
                                      <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={checked}
                                        onChange={(e) =>
                                          handleCheck(
                                            res,
                                            act,
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <div
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200
                                            ${
                                              checked
                                                ? "bg-green-500 border-green-500 text-white scale-110 shadow-sm shadow-green-200"
                                                : "bg-white border-gray-200 text-transparent hover:border-green-400 group-hover/check:scale-110"
                                            }`}
                                      >
                                        <CheckCircle2
                                          size={14}
                                          strokeWidth={4}
                                        />
                                      </div>
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={closeForm}
                  className="px-6 py-2.5 text-gray-600 hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 rounded-xl transition font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200 hover:shadow-green-300 active:scale-95 transition-all transform"
                >
                  <Save size={18} /> Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            // EMPTY STATE
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/30 text-gray-400 p-10 text-center animate-fade-in select-none">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Shield size={48} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-500 mb-2">
                Chưa chọn Role nào
              </h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Vui lòng chọn một Role từ danh sách bên trái để xem và chỉnh sửa
                quyền hạn, hoặc nhấn nút
                <span className="font-bold text-green-600 mx-1">
                  Tạo Role mới
                </span>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
