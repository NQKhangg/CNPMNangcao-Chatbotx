"use client";

// --- 1. IMPORTS ---
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ShoppingCart } from "lucide-react";

// Services & Contexts
import { productService } from "@/services/product.service";
import { useCart } from "@/contexts/CartContext";

// Components
import RevealOnScroll from "@/app/components/ui/RevealOnScroll";
import Pagination from "@/app/components/pagination";

export default function PromotionsPage() {
  // --- 2. STATE MANAGEMENT ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState<any[]>([]); // Có thể thay any bằng Interface Product
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  // --- 3. HELPER FUNCTIONS ---

  // Tính phần trăm giảm giá
  const calculateDiscount = (price: number, originalPrice: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  };

  // --- 4. DATA FETCHING ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Scroll lên đầu trang khi đổi page để trải nghiệm tốt hơn
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Gọi API lấy sản phẩm đang sale
        const res = await productService.getProductSale(page);
        setProducts(res.data);
        setTotalPages(res.lastPage);
      } catch (e) {
        console.error("Lỗi tải sản phẩm khuyến mãi:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page]);

  // --- 5. RENDER UI ---
  return (
    <div className="min-h-screen bg-gray-50 py-10 font-sans text-slate-800">
      <div className="container mx-auto px-4">
        {/* Header Banner */}
        <div className="text-center mb-12 transition-transform duration-500 hover:scale-[1.02] animate-fade-up">
          <h1 className="text-4xl font-bold text-red-600 mb-2">
            🔥 Săn Sale Mỗi Ngày
          </h1>
          <p className="text-gray-500">
            Các sản phẩm đang giảm giá sốc, số lượng có hạn!
          </p>
        </div>

        {/* Conditional Rendering */}
        {loading ? (
          // Trạng thái Loading
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-red-600 w-10 h-10" />
          </div>
        ) : products.length === 0 ? (
          // Trạng thái Trống (Empty)
          <div className="flex items-center justify-center h-[300px] w-full bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 text-lg">
              Hiện chưa có chương trình khuyến mãi nào.
            </p>
          </div>
        ) : (
          // Danh sách sản phẩm
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, index) => {
              const discountPercent = calculateDiscount(
                p.price,
                p.originalPrice
              );

              return (
                <RevealOnScroll key={p._id}>
                  <div
                    className="bg-white rounded-2xl border border-red-100 p-4 relative hover:shadow-xl group transition-transform duration-500 hover:scale-105 animate-fade-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Badge giảm giá (Chỉ hiện nếu có giảm giá) */}
                    {discountPercent > 0 && (
                      <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-md animate-pulse">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Hình ảnh sản phẩm */}
                    <Link href={`/products/${p._id}`}>
                      <div className="h-48 flex items-center justify-center mb-4 rounded-2xl overflow-hidden bg-gray-50">
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </Link>

                    {/* Thông tin sản phẩm */}
                    <div>
                      <Link href={`/products/${p._id}`}>
                        <h3 className="font-bold text-slate-800 mb-1 line-clamp-1 hover:text-red-600 transition">
                          {p.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-red-600">
                          {p.price.toLocaleString()}đ
                        </span>
                        {p.originalPrice > p.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {p.originalPrice.toLocaleString()}đ
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart({ ...p, id: p._id }, 1)}
                        className="w-full bg-red-50 text-red-600 font-bold py-2 rounded-lg hover:bg-red-600 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-red-200"
                      >
                        <ShoppingCart size={18} /> Mua ngay
                      </button>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        )}

        {/* --- PAGINATION --- */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              variant="shop"
            />
          </div>
        )}
      </div>
    </div>
  );
}
