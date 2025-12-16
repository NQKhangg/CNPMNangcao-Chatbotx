"use client";

// --- 1. IMPORTS ---
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Libraries
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  ArrowLeft,
} from "lucide-react";

// Internals
import { authService } from "@/services/auth.service";

// --- 2. TYPES ---
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  // --- 3. HOOKS & STATES ---
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  // --- 4. HANDLERS ---
  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Gọi API đăng ký qua Service
      const res = await authService.signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Xử lý sau khi đăng ký thành công
      if (res) {
        // Trường hợp 1: Backend trả về Token luôn (Auto Login)
        if (res.accessToken) {
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken);

          toast.success("Đăng ký thành công!", {
            description: "Chào mừng bạn đến với FreshFood.",
            duration: 5000,
          });

          router.push("/home");
        }
        // Trường hợp 2: Chỉ trả về success (Cần đăng nhập lại)
        else {
          toast.success("Đăng ký thành công!", {
            description: "Vui lòng đăng nhập để tiếp tục.",
            duration: 5000,
          });
          router.push("/login");
        }
      }
    } catch (error: any) {
      // Xử lý lỗi từ Backend trả về
      console.error("Signup Error:", error);
      const msg =
        error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại";
      setErrorMessage(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. RENDER ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-up">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* === HEADER === */}
        <div className="bg-green-600 p-8 text-center relative">
          <Link
            href="/home"
            className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
            title="Về trang chủ"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Đăng Ký</h2>
          <p className="text-green-100">Tham gia cộng đồng thực phẩm sạch</p>
        </div>

        {/* === FORM BODY === */}
        <div className="p-8">
          {/* Thông báo lỗi (nếu có) */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
              <span className="font-bold">Lỗi:</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  {...register("name", { required: "Vui lòng nhập họ tên" })}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition
                    ${
                      errors.name
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-500"
                    }`}
                />
              </div>
              {errors.name && (
                <span className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  {...register("email", {
                    required: "Vui lòng nhập email",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Email không hợp lệ",
                    },
                  })}
                  type="email"
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition
                    ${
                      errors.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-500"
                    }`}
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  {...register("password", {
                    required: "Vui lòng tạo mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải từ 6 ký tự trở lên",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 outline-none transition
                    ${
                      errors.password
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-500"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang tạo tài
                  khoản...
                </>
              ) : (
                "Đăng Ký"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="text-green-600 font-bold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
