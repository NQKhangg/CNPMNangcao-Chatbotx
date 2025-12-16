import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

// --- 1. TYPE DEFINITIONS ---
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  variant?: "admin" | "shop";
}

// --- 2. STYLE CONFIGURATION ---
const VARIANTS = {
  admin: {
    active:
      "bg-slate-900 text-white border-slate-900 shadow-slate-200 shadow-sm",
    hover: "hover:bg-gray-100 text-slate-700",
    text: "text-slate-900",
  },
  shop: {
    active:
      "bg-green-600 text-white border-green-600 shadow-green-200 shadow-sm",
    hover: "hover:bg-green-50 text-green-700",
    text: "text-green-700",
  },
};

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  variant = "admin",
}: PaginationProps) {
  // Lấy style dựa trên variant
  const theme = VARIANTS[variant] || VARIANTS.admin;

  // Nếu chỉ có 1 trang thì không cần hiển thị phân trang
  if (totalPages <= 1) return null;

  // --- 3. LOGIC: PAGE NUMBERS ---
  // Sử dụng useMemo để không tính toán lại mỗi lần render nếu props không đổi
  const pageList = useMemo(() => {
    // Trường hợp ít trang: Hiển thị hết (1, 2, 3, 4, 5, 6, 7)
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Cấu hình số lượng trang liền kề hiện tại (Sibling)
    const siblingCount = 1;
    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

    // Kiểm tra xem có cần hiện dấu "..." không
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 2;

    const firstPage = 1;
    const lastPage = totalPages;

    // Case 1: Chỉ hiện "..." bên phải (1 2 3 4 5 ... 100)
    if (!showLeftDots && showRightDots) {
      const leftRange = [1, 2, 3, 4, 5];
      return [...leftRange, "...", lastPage];
    }

    // Case 2: Chỉ hiện "..." bên trái (1 ... 96 97 98 99 100)
    if (showLeftDots && !showRightDots) {
      const rightRange = [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
      return [firstPage, "...", ...rightRange];
    }

    // Case 3: Hiện "..." cả 2 bên (1 ... 4 5 6 ... 100)
    if (showLeftDots && showRightDots) {
      const middleRange = [leftSiblingIndex, page, rightSiblingIndex];
      return [firstPage, "...", ...middleRange, "...", lastPage];
    }

    return [];
  }, [page, totalPages]);

  // --- 4. RENDER UI ---
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pt-6 border-t border-gray-100 animate-fade-in">
      {/* Thông tin số trang */}
      <span className="text-sm text-gray-500 font-medium">
        Trang <span className={`font-bold ${theme.text}`}>{page}</span> /{" "}
        {totalPages}
      </span>

      {/* Điều khiển phân trang */}
      <nav className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
        {/* Nút Prev */}
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${theme.hover} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Danh sách trang */}
        {pageList.map((p, index) => {
          // Render dấu "..."
          if (p === "...") {
            return (
              <div
                key={`dots-${index}`}
                className="w-9 h-9 flex items-center justify-center text-gray-400 select-none"
              >
                <MoreHorizontal size={16} />
              </div>
            );
          }

          // Render số trang
          return (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-200
                ${
                  page === p
                    ? `${theme.active} scale-105` // Style khi Active
                    : `text-gray-500 border border-transparent ${theme.hover}` // Style mặc định
                }
              `}
            >
              {p}
            </button>
          );
        })}

        {/* Nút Next */}
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${theme.hover} disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
      </nav>
    </div>
  );
}
