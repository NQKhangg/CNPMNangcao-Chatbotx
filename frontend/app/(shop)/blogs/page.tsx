"use client";

// --- 1. IMPORTS ---
import React, { useState, useEffect } from "react";
import Link from "next/link";

// Libraries & Icons
import { Calendar, User, ArrowRight, Loader2 } from "lucide-react";

// Services & Types
import { blogService, Blog } from "@/services/blog.service";

// Components
import Pagination from "@/app/components/pagination";

export default function BlogPage() {
  // --- 2. STATE MANAGEMENT ---
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // State phân trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true); // Set loading
      try {
        // Scroll lên đầu trang khi đổi page
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Gọi API lấy danh sách bài viết đã xuất bản
        const res = await blogService.getPublished(page);

        // Cập nhật state
        setBlogs(res.data);
        setTotalPages(res.lastPage);
      } catch (error) {
        console.error("Lỗi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [page]); // Chạy lại khi page thay đổi

  // --- 4. HELPERS (Hàm hỗ trợ hiển thị) ---

  // Format ngày tháng kiểu Việt Nam
  const formatDate = (dateString?: string) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Lấy tên tác giả
  const getAuthorName = (author: any) => {
    if (typeof author === "object" && author?.name) return author.name;
    return "Admin";
  };

  // --- 5. RENDER: LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  // --- 6. RENDER: MAIN CONTENT ---
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      {/* === HEADER SECTION === */}
      <div className="bg-slate-50 py-16 text-center mb-12 animate-fade-up">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Góc chia sẻ</h1>
        <p className="text-slate-500">
          Kiến thức dinh dưỡng, mẹo vặt và công thức nấu ăn ngon mỗi ngày.
        </p>
      </div>

      <div className="container mx-auto px-4">
        {/* === EMPTY STATE === */}
        {blogs.length === 0 ? (
          <div className="text-center text-gray-500 py-20 bg-gray-50 rounded-2xl">
            <p>Chưa có bài viết nào được đăng tải.</p>
          </div>
        ) : (
          /* === BLOG GRID === */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((post, index) => (
              <article
                key={post._id}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* --- Thumbnail Image --- */}
                <Link
                  href={`/blogs/${post.slug}`}
                  className="relative h-56 overflow-hidden block bg-gray-100"
                >
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/600x400?text=No+Image")
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Badge Category */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-green-700 uppercase shadow-sm">
                    {post.category || "Tin tức"}
                  </div>
                </Link>

                {/* --- Content Body --- */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} /> {getAuthorName(post.author)}
                    </span>
                  </div>

                  {/* Title */}
                  <Link href={`/blogs/${post.slug}`}>
                    <h3
                      className="text-xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition line-clamp-2"
                      title={post.title}
                    >
                      {post.title}
                    </h3>
                  </Link>

                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                    {post.shortDescription}
                  </p>

                  {/* Read More Link */}
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="text-green-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto"
                  >
                    Đọc tiếp <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* === PAGINATION === */}
      {totalPages > 1 && (
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
  );
}
