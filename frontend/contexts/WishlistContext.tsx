"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

// Services & Types
import { userService } from "@/services/user.service";
import { Product } from "@/services/product.service";

// --- 1. ĐỊNH NGHĨA TYPES ---
type WishlistContextType = {
  wishlist: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
};

// --- 2. KHỞI TẠO CONTEXT ---
const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

// --- 3. PROVIDER COMPONENT ---
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  // State quản lý danh sách yêu thích
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- A. LOAD DATA (FETCHING) ---
  useEffect(() => {
    const fetchWishlist = async () => {
      // Kiểm tra token (Chỉ load khi đã đăng nhập)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      if (!token) {
        setLoading(false);
        setWishlist([]); // Reset nếu chưa login
        return;
      }

      try {
        // Gọi API lấy danh sách
        const res: any = await userService.getWishlist(1, 10000);

        if (res && Array.isArray(res.data)) {
          setWishlist(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải Wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // --- B. HANDLERS  ---

  // Hàm thêm/xóa yêu thích
  const toggleWishlist = async (product: Product) => {
    const token = localStorage.getItem("accessToken");

    // 1. Validate đăng nhập
    if (!token) {
      toast.error("Vui lòng đăng nhập", {
        description: "Bạn cần đăng nhập để lưu sản phẩm yêu thích.",
      });
      return;
    }

    // 2. Lưu lại state cũ
    const previousWishlist = [...wishlist];

    const exists = wishlist.some((p) => p._id === product._id);

    // 3. Optimistic Update: Cập nhật giao diện (Không chờ API)
    if (exists) {
      // Nếu đã có -> Xóa khỏi list
      setWishlist((prev) => prev.filter((p) => p._id !== product._id));
      toast("Đã xóa khỏi yêu thích", {
        position: "bottom-center",
        duration: 1500,
      });
    } else {
      // Nếu chưa có -> Thêm vào list
      setWishlist((prev) => [...prev, product]);
      toast.success("Đã thêm vào yêu thích", {
        position: "bottom-center",
        duration: 1500,
      });
    }

    // 4. Gọi API
    try {
      if (!product._id) throw new Error("Product ID missing");
      await userService.toggleWishlist(product._id);
    } catch (error) {
      console.error("Lỗi đồng bộ Wishlist:", error);

      // 5. Rollback: Nếu API lỗi, hoàn tác lại state cũ
      setWishlist(previousWishlist);
      toast.error("Lỗi kết nối, vui lòng thử lại.");
    }
  };

  // Helper check xem sản phẩm có trong wishlist không
  const isInWishlist = (productId: string) => {
    return wishlist.some((p) => p._id === productId);
  };

  // --- C. RENDER ---
  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isInWishlist, loading }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// --- 4. CUSTOM HOOK ---
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
};
