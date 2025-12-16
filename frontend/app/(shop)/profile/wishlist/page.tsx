"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Trash2,
  HeartOff,
  ArrowRight,
  Heart,
  Loader2,
} from "lucide-react";

// Contexts & Services
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { userService } from "@/services/user.service";

// Components
import Pagination from "@/app/components/pagination";

// =========================================
// 2. CONFIGURATIONS
// =========================================
const ITEMS_PER_PAGE = 8; // Số lượng sản phẩm yêu thích trên mỗi trang

// =========================================
// 3. MAIN COMPONENT
// =========================================

export default function WishlistPage() {
  // --- A. STATE MANAGEMENT ---
  const [localWishlist, setLocalWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State phân trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- B. HOOKS ---
  const { toggleWishlist: contextToggle } = useWishlist(); // Hàm toggle toàn cục
  const { addToCart } = useCart();

  // --- C. FETCH DATA ---
  const fetchWishlist = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách phân trang (Server-side pagination)
      const res: any = await userService.getWishlist(page, ITEMS_PER_PAGE);

      if (res && res.data) {
        setLocalWishlist(res.data);
        setTotalPages(res.lastPage || 1);
      } else {
        setLocalWishlist([]);
      }
    } catch (error) {
      console.error("Lỗi tải wishlist:", error);
      setLocalWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchWishlist();
  }, [page]);

  // --- D. HANDLERS ---

  // Xử lý xóa sản phẩm khỏi Wishlist
  const handleRemove = async (product: any) => {
    // 1. Gọi Context để update Global state (Header heart count, cache...)
    await contextToggle(product);

    // 2. Nếu danh sách hiện tại chỉ còn 1 item và đang ở trang > 1, lùi về trang trước
    if (localWishlist.length === 1 && page > 1) {
      setPage((prev) => prev - 1);
    } else {
      // 3. Reload lại dữ liệu trang hiện tại
      fetchWishlist();
    }
  };

  // --- E. RENDER: EMPTY STATE ---
  if (!loading && localWishlist.length === 0 && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans py-10 animate-fade-up">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            {/* Icon */}
            <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <HeartOff size={64} className="text-red-400" />
            </div>

            {/* Text */}
            <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">
              Danh sách yêu thích trống
            </h2>
            <p className="text-gray-500 mb-8 text-center max-w-md">
              Có vẻ như bạn chưa "thả tim" món nào cả. Hãy dạo một vòng và lưu
              lại những món ngon nhé!
            </p>

            {/* Button */}
            <Link
              href="/products"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold transition shadow-lg shadow-green-200 flex items-center gap-2 group"
            >
              Khám phá ngay{" "}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- F. RENDER: LIST STATE ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans text-slate-800">
      <div className="container mx-auto px-4">
        {/* Header Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-red-100 rounded-lg text-red-600 shadow-sm">
            <Heart size={24} className="fill-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sản phẩm yêu thích
          </h1>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-green-600 w-10 h-10" />
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {localWishlist.map((p, index) => (
                <div
                  key={p._id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(p);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow hover:bg-red-50 hover:text-red-500 transition-colors z-20 text-gray-400 cursor-pointer"
                    title="Bỏ thích"
                  >
                    <Trash2 size={18} />
                  </button>

                  {/* Product Link Wrapper */}
                  <Link href={`/products/${p._id}`} className="block">
                    {/* Image Area */}
                    <div className="h-48 bg-gray-50 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={p.thumbnail || p.images?.[0]}
                        alt={p.name}
                        className="w-full h-full object-cover p-0 transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay effect */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>

                    {/* Info Area */}
                    <div className="space-y-2">
                      <h3
                        className="font-bold text-slate-800 line-clamp-1 group-hover:text-green-600 transition-colors"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-red-600">
                          {p.price.toLocaleString()}đ
                        </p>
                        {p.rating > 0 && (
                          <div className="text-xs font-bold flex items-center gap-1 text-slate-500 bg-gray-100 px-2 py-1 rounded">
                            ⭐ {p.rating}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart({ ...p, id: p._id }, 1)}
                    className="w-full mt-4 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-green-200 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <ShoppingCart size={18} /> Thêm vào giỏ
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination Control */}
            {totalPages > 1 && (
              <div className="flex justify-center pb-8">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  variant="shop"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
