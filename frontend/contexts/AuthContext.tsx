"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES & INTERFACES) ---

// Cấu trúc dữ liệu User trả về từ Backend
interface User {
  _id: string;
  email: string;
  name: string;
  role: { _id: string; name: string } | string;
  avatar?: string;
}

// Cấu trúc của Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// Khởi tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 2. AUTH PROVIDER COMPONENT ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State quản lý
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Mặc định là true để chặn render cho đến khi check xong
  const router = useRouter();

  // --- Helpers: Hàm gọi API lấy thông tin User ---
  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      setUser(res.data);
    } catch (error) {
      console.error("Lỗi xác thực người dùng:", error);
      // Nếu token lỗi/hết hạn -> Xóa sạch để tránh vòng lặp
      handleClearAuth();
    }
  };

  // Hàm dọn dẹp localStorage và state
  const handleClearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  // --- Effects: Kiểm tra đăng nhập khi F5 trang ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false); // Không có token -> Dừng loading -> App hiểu là chưa login
        return;
      }

      // Có token -> Gọi API lấy thông tin mới nhất
      await fetchUserProfile();
      setLoading(false);
    };

    checkAuth();
  }, []);

  // --- Handlers: Các hành động Login / Logout ---

  // 1. Đăng nhập
  const login = async (token: string) => {
    setLoading(true);
    // Lưu token
    localStorage.setItem("accessToken", token);

    // Fetch thông tin user để cập nhật UI
    await fetchUserProfile();

    setLoading(false);
    router.push("/home");
  };

  // 2. Đăng xuất
  const logout = () => {
    handleClearAuth();
    router.push("/login");
  };

  // --- Render ---
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- 3. CUSTOM HOOK ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};
