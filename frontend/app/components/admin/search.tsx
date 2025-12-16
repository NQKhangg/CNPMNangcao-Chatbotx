"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, RefreshCw, Loader2, X } from "lucide-react";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface AdminSearchProps {
  onSearch: (query: string) => void; // Hàm callback khi thực hiện tìm kiếm
  onRefresh: () => void; // Hàm callback khi bấm nút làm mới
  placeholder?: string; // Placeholder tùy chỉnh cho ô input
  className?: string; // Class tùy chỉnh từ component cha
}

export default function AdminSearch({
  onSearch,
  onRefresh,
  placeholder = "Tìm kiếm dữ liệu...",
  className = "",
}: AdminSearchProps) {
  // --- 1. STATE MANAGEMENT ---
  const [keyword, setKeyword] = useState(""); // Giá trị thực của ô input
  const [debouncedKeyword, setDebouncedKeyword] = useState(""); // Giá trị sau khi đã debounce (dùng để search)
  const [isTyping, setIsTyping] = useState(false); // Trạng thái đang gõ (để hiện loading)
  const [isRefreshing, setIsRefreshing] = useState(false); // Trạng thái đang làm mới (để quay icon)

  // --- 2. REFS ---
  const isFirstRun = useRef(true); // Check lần render đầu tiên
  const inputRef = useRef<HTMLInputElement>(null); // Ref để thao tác với DOM input

  // --- 3. EFFECTS (LOGIC) ---

  // Effect : Xử lý Debounce (Trì hoãn việc update từ khóa tìm kiếm)
  // Giúp tránh gọi API liên tục mỗi khi gõ 1 ký tự
  useEffect(() => {
    if (keyword !== debouncedKeyword) {
      setIsTyping(true); // Bắt đầu gõ -> hiện loading
    }

    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setIsTyping(false); // Dừng gõ sau 500ms -> tắt loading
    }, 500);

    return () => clearTimeout(timer); // Clear timeout nếu user gõ tiếp trước 500ms
  }, [keyword, debouncedKeyword]);

  useEffect(() => {
    // Bỏ qua lần chạy đầu tiên khi component vừa mount (tránh gọi search rỗng không cần thiết)
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onSearch(debouncedKeyword);
  }, [debouncedKeyword, onSearch]);

  // --- 4. HANDLERS (SỰ KIỆN) ---

  // Xử lý xóa text trong ô tìm kiếm
  const handleClear = () => {
    setKeyword("");
    setDebouncedKeyword("");
    inputRef.current?.focus(); // Focus lại vào ô input để user nhập tiếp
  };

  // Xử lý khi bấm nút Refresh
  const handleRefreshClick = () => {
    setIsRefreshing(true);

    // Reset ô tìm kiếm về rỗng
    setKeyword("");
    setDebouncedKeyword("");

    // Gọi hàm refresh từ parent
    onRefresh();

    // Tự động tắt hiệu ứng xoay sau 500ms
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // --- 5. RENDER ---
  return (
    <div className={`flex items-center gap-3 animate-fade-down ${className}`}>
      {/* --- SEARCH INPUT GROUP --- */}
      <div className="relative group w-full sm:w-80">
        {/* Icon Search (Left) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
          <Search size={18} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full bg-white text-sm text-slate-700 border border-gray-200 rounded-xl 
                     pl-10 pr-10 py-2.5 shadow-sm placeholder:text-gray-400
                     focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
                     transition-all duration-200"
        />

        {/* Right Actions: Loading / Clear Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {isTyping ? (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          ) : keyword ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
              title="Xóa từ khóa"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* --- REFRESH BUTTON --- */}
      <button
        onClick={handleRefreshClick}
        disabled={isRefreshing}
        className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 shadow-sm
                   hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200
                   active:scale-95 transition-all duration-200 group"
        title="Làm mới dữ liệu"
      >
        <RefreshCw
          size={18}
          className={`transition-transform duration-500 ${
            isRefreshing ? "animate-spin" : "group-hover:rotate-180"
          }`}
        />
      </button>
    </div>
  );
}
