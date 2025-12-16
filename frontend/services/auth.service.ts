import api from "@/lib/axios";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACES) ---

// Response khi login thành công
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
}

// Payload cho các hành động
interface SignupDto {
  name: string;
  email: string;
  password: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

interface ResetPasswordDto {
  resetToken: string;
  newPassword: string;
}

// --- 2. AUTH SERVICE ---

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * Endpoint: POST /auth/signup
   */
  signup: async (data: SignupDto) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  /**
   * Đăng nhập
   * Endpoint: POST /auth/login
   */
  login: async (data: LoginDto) => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  /**
   * Làm mới Access Token bằng Refresh Token
   * Endpoint: POST /auth/refresh
   */
  refreshToken: async (token: string) => {
    const response = await api.post("/auth/refresh", {
      refreshToken: token,
    });
    return response.data;
  },

  /**
   * Đổi mật khẩu (Yêu cầu đang đăng nhập)
   * Endpoint: PUT /auth/change-password
   */
  changePassword: async (data: ChangePasswordDto) => {
    console.log(data);
    const response = await api.put("/auth/change-password", data);
    return response.data;
  },

  /**
   * Quên mật khẩu - Gửi email chứa link reset
   * Endpoint: POST /auth/forgot-password
   */
  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * Đặt lại mật khẩu mới (Dùng token từ email)
   * Endpoint: PUT /auth/reset-password
   */
  resetPassword: async (data: ResetPasswordDto) => {
    const response = await api.put("/auth/reset-password", data);
    return response.data;
  },
};
