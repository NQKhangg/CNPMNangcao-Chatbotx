"use client";

// --- 1. IMPORTS ---
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Libraries
import { useForm, SubmitHandler } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft } from "lucide-react";

// Internals
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";

// --- 2. TYPES ---
interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  // --- 3. HOOKS & STATES ---
  const { login } = useAuth(); // Context xử lý auth chung
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  // --- 4. HANDLERS ---

  // Xử lý đăng nhập thường (Email/Pass)
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // B1: Gọi API xác thực
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { accessToken, refreshToken, role } = response.data;

      // B2: Lưu Token vào Storage (Client-side usage)
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // B3: Lưu Cookie (Middleware usage & Server-side checks)
      Cookies.set("role", role, { expires: 1 }); // 1 ngày
      Cookies.set("token", accessToken, { expires: 1 });

      // B4: Điều hướng dựa trên Role
      toast.success("Đăng nhập thành công!");
      if (role === "Customer") {
        router.push("/home");
      } else {
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      const msg =
        error.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại";
      setErrorMessage(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng nhập Google
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;

      // Gửi token Google lên Backend để verify và lấy JWT của hệ thống
      const res = await api.post("/auth/google", { token: credential });

      // Sử dụng hàm login từ Context
      login(res.data.access_token);

      toast.success("Đăng nhập Google thành công!");
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Lỗi xác thực Google");
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
          <h2 className="text-3xl font-bold text-white mb-2">Đăng Nhập</h2>
          <p className="text-green-100">Chào mừng trở lại với FreshFood</p>
        </div>

        {/* === BODY === */}
        <div className="p-8">
          {/* Thông báo lỗi (nếu có) */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    required: "Vui lòng nhập mật khẩu",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu tối thiểu 6 ký tự",
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

              <div className="flex justify-end mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs text-green-600 hover:underline font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
                </>
              ) : (
                "Đăng Nhập"
              )}
            </button>
          </form>

          {/* Divider & Social Login */}
          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px bg-gray-200 w-full"></div>
            <span className="text-gray-400 text-xs whitespace-nowrap">
              HOẶC
            </span>
            <div className="h-px bg-gray-200 w-full"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Đăng nhập Google thất bại")}
              useOneTap
            />
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              href="/signup"
              className="text-green-600 font-bold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
