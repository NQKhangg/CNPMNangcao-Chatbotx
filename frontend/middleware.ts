import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookies
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  // =========================================================
  // 0. XỬ LÝ TRANG CHỦ (ROOT /)
  // Tự động chuyển người dùng từ domain.com/ sang domain.com/home
  // =========================================================
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // =========================================================
  // 1. ROUTE ADMIN (/admin/*)
  // =========================================================
  if (pathname.startsWith("/admin")) {
    // 1.1. Chưa đăng nhập (Không có token) -> Login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      // Lưu lại trang đích để sau khi login thì quay lại đúng chỗ
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 1.2. Đã đăng nhập nhưng là KHÁCH HÀNG -> Không có quyền -> Home
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
  // 3. CÁC ROUTE CẦN BẢO VỆ CỦA KHÁCH HÀNG (VD: Giỏ hàng, Profile)
  // Nếu khách vãng lai (chưa login) -> login
  // =========================================================
  const protectedCustomerRoutes = ["/profile", "/checkout", "/order-history"];
  if (protectedCustomerRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // =========================================================
  // 4. CHO PHÉP TẤT CẢ CÁC ROUTE CÒN LẠI (Home, Products...)
  // =========================================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match tất cả các request paths ngoại trừ:
     * 1. /api (API routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. favicon.ico (favicon file)
     * 5. Các file ảnh tĩnh (jpg, png, svg...)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
