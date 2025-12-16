import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookies
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // =========================================================
  // 1. BẢO VỆ CÁC ROUTE ADMIN (/admin/*)
  // =========================================================
  if (pathname.startsWith("/admin")) {
    // 1.1. Chưa đăng nhập -> Chuyển hướng về trang Login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      // Lưu lại trang hiện tại để redirect lại sau khi login xong
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 1.2. Đã đăng nhập nhưng là KHÁCH HÀNG -> Stop truy cập, trở về Home
    if (role === "Customer") {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // 1.3. Là Admin hoặc Staff -> Cho phép đi tiếp
    return NextResponse.next();
  }

  // =========================================================
  // 2. XỬ LÝ TRANG AUTH (LOGIN / REGISTER)
  // Ngăn người dùng đã đăng nhập quay lại các trang này
  // =========================================================
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      // Nếu là Admin/Staff -> Đến Dashboard
      if (role !== "Customer") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }

      // Nếu là Khách hàng -> Về trang chủ
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // =========================================================
  // 3. CHO PHÉP CÁC ROUTE KHÁC
  // =========================================================
  return NextResponse.next();
}

// Cấu hình matcher để middleware chạy trên các route cụ thể
export const config = {
  matcher: [
    // Chạy trên tất cả route con của /admin
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
