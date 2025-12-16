"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Libraries & Icons
import { Search, ShoppingCart, Star } from "lucide-react";

// Services & Contexts
import { productService, Product } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { useCart } from "@/contexts/CartContext";

// Components
import ProductSkeleton from "@/app/components/ui/ProductSkeleton";
import Pagination from "@/app/components/pagination";

// =========================================
// 2. CONFIGURATIONS
// =========================================
const ITEMS_PER_PAGE = 9;

export default function ProductsPage() {
  // --- A. HOOKS & REFS ---
  const searchParams = useSearchParams();
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null); // Ref để scroll lên đầu trang
  const { addToCart } = useCart();

  // --- B. STATES ---

  // 1. Data States (Dữ liệu hiển thị)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Filter & Sort States (Bộ lọc)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [keyword, setKeyword] = useState(""); // Input của người dùng
  const [searchQuery, setSearchQuery] = useState(""); // Giá trị thực tế để gọi API (sau debounce)

  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 }); // Input giá
  const [appliedPrice, setAppliedPrice] = useState({ min: 0, max: 10000000 }); // Giá thực tế để lọc

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortOption, setSortOption] = useState("newest");
  const [minRating, setMinRating] = useState(0);

  // --- C. EFFECTS (DATA FETCHING & LOGIC) ---

  // 1. Load danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAll();
        if (Array.isArray(data)) setCategories(data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Sync URL Params (Khi URL thay đổi -> Cập nhật State)
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const keywordFromUrl = searchParams.get("keyword");

    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
    if (keywordFromUrl) {
      setKeyword(keywordFromUrl);
      setSearchQuery(keywordFromUrl);
    }
  }, [searchParams]);

  // 3. Debounce Search (Chờ 0.5s sau khi gõ xong mới set search query)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(keyword);
      // Chỉ reset page về 1 nếu keyword thay đổi thực sự
      if (keyword !== searchQuery) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 4. Fetch Products (Gọi API khi bất kỳ điều kiện lọc nào thay đổi)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      // Scroll lên đầu nếu đổi trang
      if (page > 1 && topRef.current) {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      try {
        const res = await productService.getAll({
          page,
          limit: ITEMS_PER_PAGE,
          keyword: searchQuery,
          minPrice: appliedPrice.min,
          maxPrice: appliedPrice.max,
          minRating,
          category: selectedCategory,
          sort: sortOption,
        });

        if (res && Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalPages(res.lastPage);
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    page,
    searchQuery,
    appliedPrice,
    minRating,
    sortOption,
    selectedCategory,
  ]);

  // --- D. HANDLERS ---
  const handleApplyPriceFilter = () => {
    setAppliedPrice(priceRange);
    setPage(1);
  };

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setPage(1);
    setKeyword(""); // Reset tìm kiếm khi chuyển danh mục
    // Cập nhật URL
    router.push(`/products?category=${encodeURIComponent(catName)}`);
  };

  // =========================================
  // 3. RENDER UI
  // =========================================
  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans text-slate-800">
      {/* Anchor để scroll lên đầu */}
      <div ref={topRef} className="scroll-mt-24"></div>

      <div className="container mx-auto px-4">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">
            <Link href="/home" className="hover:text-green-600">
              Trang chủ
            </Link>{" "}
            / Sản phẩm
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Cửa hàng thực phẩm
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* === SIDEBAR (LEFT) === */}
          <aside className="lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-up">
              {/* 1. Danh mục */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase">
                  Danh mục
                </h4>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => handleCategoryClick("Tất cả")}
                      className={`text-sm w-full text-left py-2 px-3 rounded-lg transition ${
                        selectedCategory === "Tất cả"
                          ? "bg-green-50 text-green-700 font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Tất cả
                    </button>
                  </li>
                  {categories.map((cat, index) => (
                    <li
                      key={cat._id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <button
                        onClick={() => handleCategoryClick(cat.name)}
                        className={`text-sm w-full text-left py-2 px-3 rounded-lg cursor-pointer transition-transform duration-300 hover:translate-x-1 ${
                          selectedCategory === cat.name
                            ? "bg-green-50 text-green-700 font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Lọc theo Sao (Rating) */}
              <div className="mb-6 animate-fade-up">
                <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase">
                  Đánh giá
                </h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((star) => (
                    <label
                      key={star}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === star}
                        onChange={() => {
                          setMinRating(star);
                          setPage(1);
                        }}
                        className="accent-green-600"
                      />
                      <div className="flex text-yellow-400 text-xs">
                        {"★★★★★".split("").map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < star ? "currentColor" : "none"}
                            className={i >= star ? "text-gray-300" : ""}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-green-600 transition">
                        từ {star} sao
                      </span>
                    </label>
                  ))}
                  {minRating > 0 && (
                    <button
                      onClick={() => setMinRating(0)}
                      className="text-xs text-red-500 underline mt-2 hover:text-red-700"
                    >
                      Xóa lọc sao
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Lọc theo Giá */}
              <div className="animate-fade-up">
                <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase">
                  Khoảng giá
                </h4>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm focus:border-green-500 focus:outline-none"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        min: Number(e.target.value),
                      })
                    }
                  />
                  <span>-</span>
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm focus:border-green-500 focus:outline-none"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({
                        ...priceRange,
                        max: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <button
                  onClick={handleApplyPriceFilter}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-lg"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </aside>

          {/* === MAIN CONTENT (RIGHT) === */}
          <main className="lg:w-3/4">
            {/* Toolbar: Search & Sort */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Sắp xếp:
                </span>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 bg-white cursor-pointer"
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => (
                      <div
                        key={product._id}
                        className="bg-white border border-gray-100 rounded-3xl p-4 hover:shadow-xl transition group relative transform duration-500 hover:scale-105 animate-fade-up"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          animationFillMode: "both",
                        }}
                      >
                        {/* Image Area */}
                        <Link href={`/products/${product.slug}`}>
                          <div className="h-48 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-green-50/30 transition-colors cursor-pointer">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            ) : (
                              <span className="text-6xl">📦</span>
                            )}

                            {/* Quick Add Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart({ ...product, id: product._id! }, 1);
                              }}
                              className="absolute bottom-3 right-3 bg-white p-2.5 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-green-600 hover:text-white z-20"
                              title="Thêm vào giỏ"
                            >
                              <ShoppingCart size={18} />
                            </button>
                          </div>
                        </Link>

                        {/* Content Area */}
                        <div>
                          <Link href={`/products/${product.slug}`}>
                            <h3
                              className="font-bold text-slate-800 group-hover:text-green-600 transition line-clamp-1 mb-1"
                              title={product.name}
                            >
                              {product.name}
                            </h3>
                          </Link>

                          <div className="flex justify-between items-end mt-2">
                            <p className="text-lg font-bold text-green-700">
                              {product.price.toLocaleString()}đ
                            </p>

                            {/* Rating Badge */}
                            {product.rating && product.rating > 0 ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-gray-100 px-2 py-1 rounded-md">
                                <Star
                                  size={10}
                                  className="text-yellow-400 fill-yellow-400"
                                />
                                {product.rating}{" "}
                                <span className="font-normal text-gray-400">
                                  ({product.reviewsCount})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold">
                                Mới
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Empty State
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 animate-fade-up">
                    <p className="text-gray-500 mb-4">
                      Không tìm thấy sản phẩm nào phù hợp.
                    </p>
                    <button
                      onClick={() => {
                        setAppliedPrice({ min: 0, max: 10000000 });
                        setKeyword("");
                        setSortOption("newest");
                        setSelectedCategory("Tất cả");
                        setMinRating(0);
                      }}
                      className="text-green-600 hover:underline font-bold text-sm"
                    >
                      Xóa toàn bộ bộ lọc
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
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
          </main>
        </div>
      </div>
    </div>
  );
}
