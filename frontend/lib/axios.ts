import axios from "axios";
import Cookies from "js-cookie";

// --- 1. CẤU HÌNH CHUNG ---
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// --- 2. REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken") || Cookies.get("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 3. RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Điều kiện: Lỗi 401 VÀ Request chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        if (!refreshToken) {
          throw new Error("Không tìm thấy Refresh Token");
        }

        // Gọi API Refresh
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        if (accessToken) {
          // Cập nhật Token mới vào Storage & Cookie
          localStorage.setItem("accessToken", accessToken);
          Cookies.set("token", accessToken);

          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          // Retry request cũ
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Phiên đăng nhập hết hạn:", refreshError);

        if (typeof window !== "undefined") {
          // 1. Xóa sạch token cũ
          localStorage.clear();
          Cookies.remove("token");
          Cookies.remove("role");

          // 2. Kiểm tra trang hiện tại
          const path = window.location.pathname;

          // Danh sách các trang "An toàn" (Không cần login vẫn xem được)
          // Bao gồm: Trang chủ, Danh sách sản phẩm, Blog...
          const publicPaths = ["/", "/home", "/products", "/blogs"];

          // Logic: Nếu đang ở trang public HOẶC trang con của products/blogs
          const isPublicPage = publicPaths.some(
            (p) =>
              path === p ||
              path.startsWith("/products") ||
              path.startsWith("/blogs")
          );

          if (isPublicPage) {
            // NẾU LÀ TRANG PUBLIC: Không redirect!
            // Chỉ trả về lỗi để Component (Header) biết mà ẩn thông tin user đi
            return Promise.reject(refreshError);
          }
        }

        // NẾU LÀ TRANG CẦN BẢO MẬT (Profile, Cart...): --> Login
        handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

// --- 4. HÀM HỖ TRỢ ---
const handleLogout = () => {
  if (typeof window !== "undefined") {
    localStorage.clear();
    Cookies.remove("token");
    Cookies.remove("role");
    window.location.href = "/login";
  }
};

export default api;
