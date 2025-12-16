import axios from "axios";

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
// Tự động gắn Access Token vào mọi request gửi đi
api.interceptors.request.use(
  (config) => {
    // Kiểm tra môi trường Browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- 3. RESPONSE INTERCEPTOR ---
// Xử lý kết quả trả về và Tự động Refresh Token khi gặp lỗi 401
api.interceptors.response.use(
  (response) => response, // Nếu thành công, trả về data nguyên bản
  async (error) => {
    const originalRequest = error.config;

    // Điều kiện: Lỗi 401 (Unauthorized) VÀ Request này chưa từng được retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu để tránh vòng lặp vô hạn

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        if (!refreshToken) {
          throw new Error("Không tìm thấy Refresh Token");
        }

        // --- LƯU Ý ---
        // Phải dùng 'axios' gốc để gọi API refresh.
        // Nếu dùng 'api' (instance hiện tại), nó sẽ lại chạy qua interceptor này
        // và có thể gây ra vòng lặp vô tận nếu API refresh cũng bị lỗi.
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        if (accessToken) {
          // 1. Lưu token mới vào Storage
          localStorage.setItem("accessToken", accessToken);

          // Nếu server trả về cả Refresh Token mới, hãy cập nhật luôn
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          // 2. Gắn token mới vào header của request cũ
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

          // 3. Thực hiện lại request cũ với token mới
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Nếu Refresh Token cũng hết hạn hoặc không hợp lệ -> Buộc đăng xuất
        console.error("Phiên đăng nhập hết hạn:", refreshError);
        handleLogout();
      }
    }

    return Promise.reject(error);
  }
);

// --- 4. HÀM HỖ TRỢ ---
const handleLogout = () => {
  if (typeof window !== "undefined") {
    localStorage.clear(); // Xóa sạch toàn bộ data phiên làm việc
    // Dùng window.location để reload lại trang, đảm bảo xóa sạch state của React/Next.js
    window.location.href = "/login";
  }
};

export default api;
