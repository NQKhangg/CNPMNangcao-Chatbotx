"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Libraries
import { toast } from "sonner";
import Cookies from "js-cookie";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Save,
  Camera,
  Loader2,
  LogOut,
  ShoppingBag,
  Lock,
  X,
} from "lucide-react";

// Services & Types
import { userService, User, uploadService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import axios from "axios";

// =========================================
// 2. MAIN COMPONENT
// =========================================

export default function ProfilePage() {
  // --- A. HOOKS & STATE ---
  const router = useRouter();

  // Data State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form Profile State (Mở rộng thêm các trường địa chỉ chi tiết)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "Male",
    dateOfBirth: "",
    avatar: "",
    // Các trường cho địa chỉ
    street: "",
    cityName: "",
    districtName: "",
    wardName: "",
    fullAddressDisplay: "",
  });

  // Location State (Dữ liệu danh sách Tỉnh/Huyện/Xã)
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [wards, setWards] = useState<Location[]>([]);

  // State để điều khiển select box
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Modal Change Password State
  const [showPasswordModel, setShowPasswordModel] = useState(false);
  const [passData, setPassData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);

  // --- B. INITIAL DATA FETCHING ---
  useEffect(() => {
    // 1. Fetch User Profile
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setUser(data);

        // Lấy địa chỉ mặc định để hiển thị (nếu có)
        const defaultAddr =
          data.addresses?.find((a) => a.isDefault) || data.addresses?.[0];

        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          phone: data.phone || "",
          gender: (data as any).gender || "Male",
          dateOfBirth: (data as any).dateOfBirth
            ? new Date((data as any).dateOfBirth).toISOString().split("T")[0]
            : "",
          avatar: (data as any).avatar || "",
          fullAddressDisplay: defaultAddr?.address || "", // Hiển thị chuỗi địa chỉ đã lưu
        }));
      } catch (error) {
        console.error("Lỗi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Fetch Provinces (Tỉnh/Thành)
    const fetchProvinces = async () => {
      try {
        const res = await axios.get("https://esgoo.net/api-tinhthanh/1/0.htm");
        if (res.data.error === 0) setProvinces(res.data.data);
      } catch (error) {
        console.error("Lỗi lấy tỉnh thành:", error);
      }
    };

    fetchProfile();
    fetchProvinces();
  }, [router]);

  // --- C. LOGIC HELPER ---

  // Kiểm tra quyền (Nếu role != Customer => Staff/Admin)
  const isStaff =
    user?.roleId &&
    typeof user.roleId !== "string" &&
    user.roleId.name !== "Customer";

  // --- D. HANDLERS: LOCATION CHANGE ---
  const handleProvinceChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);

    // Reset District & Ward
    setDistricts([]);
    setWards([]);
    setSelectedDistrict("");

    // Cập nhật tên Tỉnh vào form data
    const provinceName = provinces.find((p) => p.id === provinceId)?.name || "";
    setFormData((prev) => ({
      ...prev,
      cityName: provinceName,
      districtName: "",
      wardName: "",
    }));

    // Load Districts
    if (provinceId) {
      const res = await axios.get(
        `https://esgoo.net/api-tinhthanh/2/${provinceId}.htm`
      );
      if (res.data.error === 0) setDistricts(res.data.data);
    }
  };

  const handleDistrictChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);

    // Reset Ward
    setWards([]);

    // Cập nhật tên Huyện vào form data
    const districtName = districts.find((d) => d.id === districtId)?.name || "";
    setFormData((prev) => ({
      ...prev,
      districtName: districtName,
      wardName: "",
    }));

    // Load Wards
    if (districtId) {
      const res = await axios.get(
        `https://esgoo.net/api-tinhthanh/3/${districtId}.htm`
      );
      if (res.data.error === 0) setWards(res.data.data);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value;
    const wardName = wards.find((w) => w.id === wardId)?.name || "";
    setFormData((prev) => ({ ...prev, wardName: wardName }));
  };

  // --- E. HANDLERS: SAVE & UPLOAD ---

  // 1. Cập nhật hồ sơ (Ghép địa chỉ thành chuỗi)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Logic ghép địa chỉ:
      // Nếu người dùng có chọn địa chỉ mới từ dropdown -> Ghép lại.
      // Nếu không chọn gì -> Giữ nguyên, hoặc nếu muốn xóa thì phải xử lý riêng.
      let finalAddress = formData.fullAddressDisplay;

      // Nếu người dùng đang nhập địa chỉ mới (có chọn Tỉnh/Thành)
      if (
        formData.cityName &&
        formData.districtName &&
        formData.wardName &&
        formData.street
      ) {
        finalAddress = `${formData.street}, ${formData.wardName}, ${formData.districtName}, ${formData.cityName}`;
      } else if (
        formData.cityName ||
        formData.districtName ||
        formData.wardName
      ) {
        // Nếu chọn thiếu
        toast.warning(
          "Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và Tên đường"
        );
        setIsSaving(false);
        return;
      }

      // Payload gửi lên server
      const payload = {
        name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        avatar: formData.avatar,
        // Tạo mảng addresses như cấu trúc Backend yêu cầu
        addresses: finalAddress
          ? [
              {
                label: "Nhà riêng",
                address: finalAddress,
                phone: formData.phone,
                receiverName: formData.name,
                isDefault: true,
              },
            ]
          : [],
      };

      await userService.updateProfile(payload);

      // Update lại UI
      setFormData((prev) => ({ ...prev, fullAddressDisplay: finalAddress }));
      // Reset dropdowns sau khi lưu xong
      setSelectedProvince("");
      setSelectedDistrict("");
      setDistricts([]);
      setWards([]);
      setFormData((prev) => ({
        ...prev,
        street: "",
        cityName: "",
        districtName: "",
        wardName: "",
      }));

      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error("Cập nhật thất bại, vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Upload Ảnh đại diện
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side
    if (file.size > 5 * 1024 * 1024)
      return toast.warning("File quá lớn (>5MB)");
    if (!file.type.startsWith("image/"))
      return toast.warning("Chỉ chấp nhận file ảnh");

    try {
      const toastId = toast.loading("Đang tải ảnh lên...");
      const imageUrl = await uploadService.uploadImage(file);

      setFormData((prev) => ({ ...prev, avatar: imageUrl }));
      toast.dismiss(toastId);
      toast.success("Tải ảnh thành công!");
    } catch (error) {
      toast.error("Lỗi upload ảnh.");
    }
  };

  // 3. Đổi mật khẩu
  const handleChangePassword = async () => {
    // Validate cơ bản
    if (!passData.oldPassword || !passData.newPassword)
      return toast.warning("Vui lòng nhập đầy đủ thông tin");
    if (passData.oldPassword === passData.newPassword)
      return toast.warning("Mật khẩu mới không được trùng mật khẩu cũ");
    if (passData.newPassword !== passData.confirmPassword)
      return toast.warning("Mật khẩu xác nhận không khớp");
    if (passData.newPassword.length < 6)
      return toast.warning("Mật khẩu tối thiểu 6 ký tự");

    try {
      await authService.changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      handleLogout();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Đổi mật khẩu thất bại";
      toast.error(msg);
    }
  };

  // 4. Đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    Cookies.remove("token");
    Cookies.remove("role");
    window.location.href = "/login";
  };

  // --- E. RENDER ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans text-slate-800 relative">
      <div className="container mx-auto px-4 max-w-5xl animate-fade-up">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">
          Tài khoản của tôi
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* === SIDEBAR === */}
          <div className="md:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md">
              <div className="p-6 text-center border-b border-gray-50">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-700 mb-3 overflow-hidden">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-lg truncate">{user?.name}</h3>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              <nav className="p-2 space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-medium transition"
                >
                  <UserIcon size={18} /> Hồ sơ cá nhân
                </Link>

                {!isStaff && (
                  <Link
                    href="/profile/orders"
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition"
                  >
                    <ShoppingBag size={18} /> Đơn mua
                  </Link>
                )}

                <button
                  onClick={() => setShowPasswordModel(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition text-left"
                >
                  <Lock size={18} /> Đổi mật khẩu
                </button>

                <div className="h-px bg-gray-100 my-2 mx-4"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition text-left"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          {/* === MAIN CONTENT FORM === */}
          <div className="md:w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition hover:shadow-md">
              <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">
                Thông tin hồ sơ
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Row 1: Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone & DOB */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <Calendar className="absolute top-2.5 left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender Radio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <div className="flex gap-6">
                    {["Male", "Female", "Other"].map((g) => (
                      <label
                        key={g}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm">
                          {g === "Male"
                            ? "Nam"
                            : g === "Female"
                            ? "Nữ"
                            : "Khác"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Address (Customer Only) */}
                {!isStaff && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                        <MapPin size={16} className="text-green-600" /> Địa chỉ
                        giao hàng mặc định
                      </label>
                    </div>

                    {/* Hiển thị địa chỉ hiện tại nếu có */}
                    {formData.fullAddressDisplay && (
                      <div className="mb-4 p-3 bg-white border border-green-200 rounded-lg text-sm text-gray-700 flex items-start gap-2">
                        <span className="shrink-0 mt-0.5 text-green-600">
                          ✔
                        </span>
                        <div>
                          <span className="font-bold text-gray-900">
                            Địa chỉ hiện tại:
                          </span>{" "}
                          {formData.fullAddressDisplay}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mb-3 uppercase font-bold tracking-wide">
                      Cập nhật địa chỉ mới:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Select Tỉnh/Thành */}
                      <div>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm"
                          onChange={handleProvinceChange}
                          value={selectedProvince}
                        >
                          <option value="">-- Tỉnh/Thành --</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Select Quận/Huyện */}
                      <div>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm disabled:bg-gray-100"
                          onChange={handleDistrictChange}
                          disabled={!selectedProvince}
                          value={selectedDistrict}
                        >
                          <option value="">-- Quận/Huyện --</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Select Phường/Xã */}
                      <div>
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm disabled:bg-gray-100"
                          onChange={handleWardChange}
                          disabled={!selectedDistrict}
                        >
                          <option value="">-- Phường/Xã --</option>
                          {wards.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Input Số nhà */}
                    <div>
                      <input
                        type="text"
                        value={formData.street}
                        onChange={(e) =>
                          setFormData({ ...formData, street: e.target.value })
                        }
                        placeholder="Số nhà, tên đường (VD: 123 Nguyễn Huệ)"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Staff Only */}

                {isStaff && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 transition delay-150 duration-300 ease-in-out transform hover:scale-103 animate-fade-up">
                    <h3 className="font-bold text-blue-800 mb-3 text-sm uppercase">
                      Thông tin nhân viên
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">
                          Mã nhân viên
                        </label>

                        <p className="font-medium">
                          {user?.employeeCode || "Chưa cập nhật"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">
                          Phòng ban
                        </label>

                        <p className="font-medium">
                          {user.department ? (
                            <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">
                              {typeof user.department === "object"
                                ? (user.department as any).name
                                : user.department}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              Chưa phân bổ
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500">
                          Vai trò
                        </label>

                        <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-bold">
                          {typeof user?.roleId !== "string"
                            ? user?.roleId?.name
                            : "Staff"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Avatar Upload Section */}
                <div className="pt-4 border-t border-gray-50">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Ảnh đại diện
                  </label>
                  <div className="flex items-center gap-6">
                    {/* Preview */}
                    <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border-2 border-white shadow-md relative group">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          className="w-full h-full object-cover"
                          alt="Avatar"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-green-700 bg-green-100">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Button Upload */}
                    <div>
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm inline-flex items-center gap-2"
                      >
                        <Camera size={16} /> Tải ảnh lên
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Hỗ trợ JPG, PNG. Tối đa 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-bold transition flex items-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-green-200"
                  >
                    {isSaving ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Save size={18} />
                    )}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* === MODAL CHANGE PASSWORD === */}
      {showPasswordModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl relative">
            <button
              onClick={() => setShowPasswordModel(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="text-green-600" size={20} /> Đổi mật khẩu
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={passData.oldPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, oldPassword: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={passData.newPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, newPassword: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  value={passData.confirmPassword}
                  onChange={(e) =>
                    setPassData({
                      ...passData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPass"
                  className="w-4 h-4 accent-green-600 cursor-pointer"
                  checked={showPass}
                  onChange={(e) => setShowPass(e.target.checked)}
                />
                <label
                  htmlFor="showPass"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Hiển thị mật khẩu
                </label>
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition mt-4 shadow-lg hover:shadow-green-200"
              >
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
