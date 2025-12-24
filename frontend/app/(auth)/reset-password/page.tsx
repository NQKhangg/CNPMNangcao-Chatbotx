"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Libraries
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Lock, Key, Loader2, ArrowLeft } from "lucide-react";

// Services
import { authService } from "@/services/auth.service";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface ResetPasswordForm {
  token: string;
  password: string;
}

export default function ResetPasswordPage() {
  // --- 2. HOOKS & STATE ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  // --- 3. EFFECTS ---
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
    }
  }, [searchParams, setValue]);

  // --- 4. HANDLERS ---
  const onSubmit: SubmitHandler<ResetPasswordForm> = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword({
        resetToken: data.token,
        newPassword: data.password,
      });

      toast.success("Đặt lại mật khẩu thành công!", {
        description: "Vui lòng đăng nhập bằng mật khẩu mới.",
        duration: 3000,
      });
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn";
      toast.error(message, { description: "Vui lòng thử lại sau." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. RENDER ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-up">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl relative overflow-hidden">
        {/* === HEADER  === */}
        <div className="bg-green-600 p-8 text-center relative">
          {/* Nút quay lại */}
          <Link
            href="/login"
            className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
            title="Quay lại đăng nhập"
          >
            <ArrowLeft size={24} />
          </Link>

          {/* Icon trung tâm */}
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 shadow-inner border border-white/10">
            <Lock className="w-8 h-8 text-white" />
          </div>

          {/* Tiêu đề & Mô tả */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Đặt lại mật khẩu
          </h2>
          <p className="text-sm text-green-100">
            Tạo mật khẩu mới để bảo vệ tài khoản của bạn
          </p>
        </div>

        {/* === FORM BODY === */}
        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã xác nhận (Token)
              </label>
              <div className="relative group">
                <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  {...register("token", { required: "Vui lòng nhập mã token" })}
                  type="text"
                  placeholder="Dán mã token vào đây"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition
                    ${
                      errors.token
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-500"
                    }`}
                />
              </div>
              {errors.token && (
                <span className="text-xs text-red-500 mt-1">
                  {errors.token.message}
                </span>
              )}
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                <input
                  {...register("password", {
                    required: "Vui lòng nhập mật khẩu mới",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu tối thiểu 6 ký tự",
                    },
                  })}
                  type="password"
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 outline-none transition
                    ${
                      errors.password
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-500"
                    }`}
                />
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
              className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-green-200 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Xác nhận thay đổi"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
