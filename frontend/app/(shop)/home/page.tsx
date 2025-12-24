"use client";

// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Cookies from "js-cookie";

// Icons
import {
  ShoppingCart,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Services & Contexts
import { useCart } from "@/contexts/CartContext";
import { Product, productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { Blog, blogService } from "@/services/blog.service";
import { userService } from "@/services/user.service";

// Components
import RevealOnScroll from "@/app/components/ui/RevealOnScroll";

// =========================================
// 2. COMPONENT CHÍNH
// =========================================
export default function HomePage() {
  // --- A. STATE MANAGEMENT ---
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // UI State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUser, setIsUser] = useState(false);

  // Carousel State
  const [currentBlogIndex, setCurrentBlogIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [isPaused, setIsPaused] = useState(false); // State để tạm dừng slide khi hover

  // Touch/Swipe State
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const { addToCart } = useCart();

  // --- B. EFFECTS: DATA & SCROLL ---

  // 1. Fetch dữ liệu (Products, Categories, Blogs) & Scroll Listener
  useEffect(() => {
    // Xử lý scroll header
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    // Gọi API song song
    const fetchData = async () => {
      try {
        const [pData, cData, bData] = await Promise.all([
          productService.getAll({ limit: 12 }),
          categoryService.getAll(),
          blogService.getPublished(1, 12),
        ]);

        setProducts(Array.isArray(pData?.data) ? pData.data : []);
        setCategories(Array.isArray(cData) ? cData : []);
        setBlogs(Array.isArray(bData?.data) ? bData.data : []);
      } catch (e) {
        console.error("Lỗi tải dữ liệu trang chủ:", e);
      }
    };
    fetchData();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Check User Profile (Để ẩn hiện Newsletter)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await userService.getProfile();
        if (user) setIsUser(true);
      } catch (e: any) {
        // User chưa login, bỏ qua
        if (e.response.status === 401) {
          Cookies.remove("token");
          localStorage.removeItem("token");
          setIsUser(false);
        }
      }
    };
    fetchUser();
  }, []);

  // --- C. LOGIC CAROUSEL (BLOG) ---

  // 1. Responsive Items Per Page
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setItemsPerPage(1); // Mobile
      else if (width < 1024) setItemsPerPage(2); // Tablet
      else setItemsPerPage(4); // Desktop
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Navigation Logic
  const totalSlide = Math.ceil(blogs.length / itemsPerPage);

  const nextSlide = () => {
    if (totalSlide === 0) return;
    setCurrentBlogIndex((prev) => (prev + 1 >= totalSlide ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (totalSlide === 0) return;
    setCurrentBlogIndex((prev) => (prev - 1 < 0 ? totalSlide - 1 : prev - 1));
  };

  // 3. Auto-play Logic
  useEffect(() => {
    if (totalSlide <= 1 || isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [totalSlide, isPaused]); // Reset timer khi totalSlide hoặc trạng thái pause thay đổi

  // 4. Swipe Handlers (Vuốt trên mobile)
  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextSlide();
    else if (isRightSwipe) prevSlide();

    setTouchStart(0);
    setTouchEnd(0);
  };

  // --- D. HANDLERS KHÁC ---
  const handleAddToCart = (product: Product) => {
    addToCart({ ...product, id: product._id! }, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, {
      description: "Bạn có thể xem lại trong giỏ hàng.",
      duration: 3000,
    });
  };

  // =========================================
  // 3. RENDER UI
  // =========================================
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-green-200 selection:text-green-900">
      {/* --- SECTION 1: HERO BANNER --- */}
      <section className="relative bg-green-50 overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 animate-fade">
          <img
            src="/images/home/background.webp"
            alt="Background"
            className="w-full h-full object-cover opacity-60 brightness-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent"></div>
        </div>

        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0"></div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left: Text & CTA */}
            <div
              className="lg:w-1/2 space-y-8 animate-fade-right"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full shadow-sm border border-green-100 text-green-700 text-sm font-bold hover:scale-105 transition transform duration-300">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                100% Organic
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-slate-900">
                Sống Xanh <br />
                <span className="text-green-600">Ăn Sạch</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Chúng tôi kết nối trực tiếp với các nông trại đạt chuẩn VietGAP
                để mang đến bữa ăn an toàn nhất cho gia đình bạn.
              </p>
              <Link
                href="/products"
                className="inline-flex bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold transition shadow-xl shadow-green-200 items-center gap-2 hover:scale-110 animate-shimmer relative overflow-hidden"
              >
                Mua Sắm Ngay <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      src={`https://i.pravatar.cc/150?img=${i + 10}`}
                      alt="User"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold text-slate-900">12k+</span> Khách
                  hàng tin dùng
                  <div className="flex text-yellow-400 text-xs">★★★★★</div>
                </div>
              </div>
            </div>

            {/* Right: Visual Image */}
            <div
              className="lg:w-1/2 flex justify-center relative animate-fade-left"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="relative w-[350px] h-[350px] lg:w-[500px] lg:h-[500px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-200 to-emerald-100 rounded-full opacity-60 blur-2xl animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center animate-float z-10">
                  <div className="relative w-full h-full p-8 rounded-none overflow-hidden">
                    <img
                      src="/images/home/hero.jpg"
                      alt="Fresh Food Hero"
                      className="w-full h-full object-cover drop-shadow-2xl hover:scale-105 transition-transform duration-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Floating Card: Energy */}
                <div
                  className="absolute top-10 -right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl animate-bounce z-20 border border-white/50 hover:scale-105 transition duration-300"
                  style={{ animationDuration: "3s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-2xl">
                      🔥
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase">
                        Năng lượng
                      </p>
                      <p className="font-bold text-slate-800">120 kcal</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card: Rating */}
                <div
                  className="absolute bottom-10 -left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl animate-bounce z-20 border border-white/50 hover:scale-105 transition duration-300"
                  style={{ animationDuration: "4s" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-2xl">
                      ⭐
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase">
                        Đánh giá
                      </p>
                      <p className="font-bold text-slate-800">
                        5.0 (Tuyệt vời)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: CATEGORIES (DANH MỤC) --- */}
      <section className="container mx-auto px-4 py-20">
        <RevealOnScroll>
          <div className="flex justify-between items-end mb-10">
            <div className="transition-transform duration-500 hover:scale-[1.02]">
              <span className="text-green-600 font-bold tracking-wider uppercase text-sm">
                Danh mục
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">
                Mua sắm theo loại
              </h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-bold text-slate-500 hover:text-green-600 transition hover:scale-105"
            >
              Xem tất cả &rarr;
            </Link>
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <RevealOnScroll key={cat._id}>
              <Link
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="block transition delay-150 duration-300 ease-in-out transform hover:scale-105 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-green-50 hover:bg-green-100 p-8 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group border border-transparent hover:border-green-200 hover:-translate-y-2">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-4 group-hover:scale-110 transition duration-300 overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        className="w-full h-full object-cover"
                        alt={cat.name}
                      />
                    ) : (
                      "🥗"
                    )}
                  </div>
                  <span className="font-bold text-lg">{cat.name}</span>
                </div>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* --- SECTION 3: FEATURED PRODUCTS (SẢN PHẨM MỚI) --- */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <RevealOnScroll>
            <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Sản Phẩm Mới Nhất
              </h2>
              <p className="text-slate-500">
                Tuyển chọn những thực phẩm tươi ngon nhất vừa được thu hoạch và
                nhập kho sáng nay.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <RevealOnScroll key={product._id} delay={index * 0.1}>
                <div className="bg-white rounded-3xl p-4 hover:shadow-2xl hover:shadow-gray-200 transition-all duration-300 group relative hover:scale-105">
                  {/* Product Image */}
                  <Link href={`/products/${product._id}`}>
                    <div className="h-56 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer">
                      {product.images?.[0] &&
                      (product.images[0].startsWith("http") ||
                        product.images[0].startsWith("data:")) ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover p-0 transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-7xl">
                          {product.images?.[0] || "📦"}
                        </span>
                      )}

                      {/* Add to Cart Button (Hover) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-green-600 hover:text-white whitespace-nowrap flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart size={16} /> Thêm
                      </button>
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="space-y-2 px-2">
                    <div className="flex justify-between items-start">
                      <Link href={`/products/${product._id}`}>
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-green-600 transition line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <span className="font-bold text-green-700">
                        {product.price.toLocaleString()}đ
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {typeof product.category === "object"
                          ? (product.category as any).name
                          : product.category}
                      </p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {product.rating || "Mới"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll delay={0.2}>
            <div className="text-center mt-16">
              <Link
                href="/products"
                className="border-2 border-slate-900 text-slate-900 px-10 py-3 rounded-full font-bold hover:bg-slate-900 hover:text-white transition duration-300 inline-block hover:scale-105"
              >
                Xem tất cả sản phẩm
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* --- SECTION 4: BLOG CAROUSEL --- */}
      {blogs.length > 0 && (
        <section className="py-20 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <RevealOnScroll>
              <div className="flex justify-between items-end mb-12 animate-fade-up">
                <div>
                  <span className="text-green-600 font-bold tracking-wider uppercase text-sm">
                    Góc Chia Sẻ
                  </span>
                  <h2 className="text-3xl font-bold text-slate-900 mt-2">
                    Bài Viết Mới Nhất
                  </h2>
                </div>

                {/* Desktop Nav Buttons */}
                {totalSlide > 1 && (
                  <div className="hidden md:flex gap-2">
                    <button
                      onClick={prevSlide}
                      className="p-3 rounded-full border border-gray-200 hover:bg-green-600 hover:text-white transition group"
                    >
                      <ChevronLeft
                        size={20}
                        className="group-hover:-translate-x-0.5 transition-transform"
                      />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-3 rounded-full border border-gray-200 hover:bg-green-600 hover:text-white transition group"
                    >
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  </div>
                )}
              </div>
            </RevealOnScroll>

            {/* Carousel Container */}
            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${currentBlogIndex * 100}%)`,
                  }}
                >
                  {blogs.map((blog) => (
                    <div
                      key={blog._id}
                      className="w-full md:w-1/2 lg:w-1/4 flex-shrink-0 px-3 transition duration-300 ease-in-out hover:scale-[1.02]"
                    >
                      <div className="group h-full bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                        <Link
                          href={`/blogs/${blog.slug}`}
                          className="relative h-48 overflow-hidden block"
                        >
                          <img
                            src={blog.thumbnail}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </Link>
                        <div className="p-6 flex flex-col flex-1">
                          <Link href={`/blogs/${blog.slug}`}>
                            <h3 className="font-bold text-lg text-slate-800 mb-3 line-clamp-2 hover:text-green-600 transition">
                              {blog.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                            {blog.shortDescription}
                          </p>
                          <Link
                            href={`/blogs/${blog.slug}`}
                            className="text-green-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-2 transition-transform"
                          >
                            Đọc tiếp <ArrowRight size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Dots */}
              {totalSlide > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalSlide }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBlogIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentBlogIndex === idx
                          ? "w-8 bg-green-600"
                          : "w-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* --- SECTION 5: NEWSLETTER (CHỈ HIỆN KHI CHƯA LOGIN) --- */}
      {!isUser && (
        <section className="container mx-auto px-4 py-20">
          <RevealOnScroll delay={0.2}>
            <div className="bg-green-600 rounded-3xl p-12 relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between transition-transform duration-500 hover:scale-[1.01]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

              <div className="relative z-10 lg:w-1/2 mb-8 lg:mb-0">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Đăng ký nhận tin khuyến mãi
                </h2>
                <p className="text-green-100 text-lg">
                  Nhận ngay mã giảm giá 20% cho đơn hàng đầu tiên của bạn.
                </p>
              </div>

              <div className="relative z-10 w-full lg:w-auto">
                <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full border border-white/20 flex max-w-md mx-auto lg:mx-0">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    className="bg-transparent border-none outline-none text-white placeholder:text-green-100 px-4 flex-1"
                  />
                  <Link
                    href="/signup"
                    className="bg-white text-green-700 px-6 py-3 rounded-full font-bold hover:bg-green-50 transition cursor-pointer"
                  >
                    Đăng Ký
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      )}
    </div>
  );
}
