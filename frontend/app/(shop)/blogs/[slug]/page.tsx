"use client";

// --- 1. IMPORTS ---
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// UI Components & Icons
import {
  Calendar,
  User,
  ArrowLeft,
  Clock,
  Tag,
  Share2,
  Loader2,
} from "lucide-react";

// Services & Types
import { blogService, Blog } from "@/services/blog.service";

export default function BlogDetailPage() {
  // --- 2. STATE & HOOKS ---
  const params = useParams();

  // Xử lý slug: Đảm bảo luôn lấy string đầu tiên nếu params trả về mảng
  const blogSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 3. EFFECTS (DATA FETCHING) ---
  useEffect(() => {
    if (!blogSlug) return;

    const fetchBlog = async () => {
      try {
        const data = await blogService.getById(blogSlug);
        setBlog(data);
      } catch (error) {
        console.error("Lỗi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [blogSlug]);

  // --- 4. RENDER: LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  // --- 5. RENDER: NOT FOUND STATE ---
  if (!blog) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fade-up">
        <h2 className="text-2xl font-bold text-gray-600">
          Bài viết không tồn tại
        </h2>
        <Link
          href="/blogs"
          className="text-green-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Quay lại trang tin tức
        </Link>
      </div>
    );
  }

  // --- 6. PREPARE DATA FOR VIEW ---
  // Xử lý logic hiển thị tác giả an toàn
  const authorName =
    typeof blog.author === "object" ? blog.author?.name : "Admin";
  const authorAvatar =
    typeof blog.author === "object" ? blog.author?.avatar : null;

  // Tags mặc định nếu bài viết không có tag nào
  const displayTags =
    blog.tags && blog.tags.length > 0
      ? blog.tags
      : ["FreshFood", "Organic", "Sống xanh"];

  // --- 7. MAIN RENDER ---
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      {/* === SECTION A: HERO IMAGE & TITLE === */}
      <div className="w-full h-[300px] md:h-[450px] relative bg-gray-100 animate-fade">
        {/* Background Image */}
        {blog.thumbnail ? (
          <img
            src={blog.thumbnail}
            className="w-full h-full object-cover"
            alt={blog.title}
            onError={(e) =>
              (e.currentTarget.src =
                "https://placehold.co/1200x600?text=No+Cover")
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl bg-slate-50">
            📰
          </div>
        )}

        {/* Overlay tối màu để text dễ đọc */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Nội dung trên Hero */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-t from-black/80 to-transparent text-white">
          <div className="container mx-auto max-w-4xl">
            {/* Category Label */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="bg-green-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                {blog.category || "Tin tức"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-5xl font-bold leading-tight mb-4 text-shadow">
              {blog.title}
            </h1>

            {/* Metadata (Date, Author, Time) */}
            <div className="flex flex-wrap items-center gap-6 text-sm md:text-base text-gray-200">
              <span className="flex items-center gap-2">
                <Calendar size={18} />{" "}
                {blog.createdAt
                  ? new Date(blog.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </span>

              <div className="flex items-center gap-2">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    className="w-6 h-6 rounded-full object-cover border border-white/50"
                    alt="Author"
                  />
                ) : (
                  <User size={18} />
                )}
                <span>{authorName}</span>
              </div>

              <span className="flex items-center gap-2">
                <Clock size={18} /> 5 phút đọc
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION B: CONTENT BODY === */}
      <div className="container mx-auto px-4 max-w-4xl -mt-10 relative z-10 animate-fade-up">
        <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-gray-100">
          {/* 1. Short Description (Sapo) */}
          {blog.shortDescription && (
            <div className="text-lg md:text-xl font-medium text-slate-600 mb-8 italic border-l-4 border-green-500 pl-4 bg-gray-50 py-2 rounded-r-lg">
              {blog.shortDescription}
            </div>
          )}

          {/* 2. Main Content (HTML Render) */}
          <article
            className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed font-serif"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          ></article>

          {/* 3. Footer: Tags & Share */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-start gap-2 text-gray-600 w-full md:w-auto">
              <Tag size={18} className="mt-1 shrink-0" />
              <div className="flex flex-wrap gap-2">
                {displayTags.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-full bg-green-50 text-gray-600 font-medium border border-green-100 hover:bg-green-100 transition cursor-default"
                  >
                    #{t.trim()}
                  </span>
                ))}
              </div>
            </div>

            <button
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition text-sm font-bold shadow-sm"
              onClick={() => {
                /* Logic share */
              }}
            >
              <Share2 size={16} /> Chia sẻ
            </button>
          </div>
        </div>

        {/* Navigation Back */}
        <div className="mt-10 text-center">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-slate-600 font-bold hover:text-green-600 transition hover:underline"
          >
            <ArrowLeft size={20} /> Quay lại danh sách bài viết
          </Link>
        </div>
      </div>
    </div>
  );
}
