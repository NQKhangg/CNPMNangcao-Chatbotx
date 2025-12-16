"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner"; // Dùng toast thay vì alert để UX tốt hơn
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

import { authService } from "@/services/auth.service";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  // --- 2. STATE MANAGEMENT ---
  const [isLoading, setIsLoading] = useState(false); // Trạng thái đang gửi request
  const [isSent, setIsSent] = useState(false); // Trạng thái đã gửi thành công

  // --- 3. FORM HOOK ---
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  // --- 4. HANDLERS ---
  const onSubmit: SubmitHandler<ForgotPasswordForm> = async (data) => {
    setIsLoading(true);
    try {
      // Gọi API gửi email reset password
      await authService.forgotPassword(data.email);

      // Thành công -> Chuyển sang giao diện thông báo
      setIsSent(true);
      toast.success("Đã gửi email thành công!");
    } catch (error: any) {
      // Thất bại -> Hiển thị lỗi
      console.error(error);
      const message =
        error.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. RENDER: GIAO DIỆN THÀNH CÔNG (SUCCESS VIEW) ---
  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-up">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Kiểm tra email
          </h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.{" "}
            <br />
            Vui lòng kiểm tra cả hộp thư <strong>Spam/Rác</strong> nếu không
            thấy.
          </p>
          <Link
            href="/login"
            className="text-green-600 font-bold hover:underline hover:text-green-700 transition"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // --- 6. RENDER: GIAO DIỆN FORM (DEFAULT VIEW) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-center relative">
          <Link
            href="/login"
            className="absolute top-4 left-4 text-white/70 hover:text-white transition-colors"
            title="Quay lại"
          >
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Quên mật khẩu?</h2>
          <p className="text-slate-300 text-sm">
            Nhập email để lấy lại quyền truy cập tài khoản
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email đăng ký
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all duration-200 ${
                    errors.email
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  }`}
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500 mt-1 block font-medium">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-slate-900 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-green-200 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" /> Đang xử lý...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
