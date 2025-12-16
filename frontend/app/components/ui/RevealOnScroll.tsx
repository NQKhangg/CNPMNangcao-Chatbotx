"use client";

import React, { useEffect, useRef, useState } from "react";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ---
interface RevealProps {
  children: React.ReactNode;
  delay?: number; // Thời gian trễ (giây) trước khi hiện
  className?: string; // Class CSS tùy chỉnh
  threshold?: number; // Tỷ lệ phần tử xuất hiện trong viewport thì kích hoạt (0.0 - 1.0)
}

export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  threshold = 0.1, // Mặc định: hiện 10% là kích hoạt animation
}: RevealProps) {
  // --- 2. STATE & REFS ---
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // --- 3. LOGIC INTERSECTION OBSERVER ---
  useEffect(() => {
    // Copy ref.current vào biến local để cleanup an toàn
    const currentRef = ref.current;

    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Khi phần tử đi vào vùng nhìn thấy (viewport)
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Ngừng theo dõi để animation chỉ chạy 1 lần
          observer.unobserve(currentRef);
        }
      },
      { threshold }
    );

    // Bắt đầu theo dõi
    observer.observe(currentRef);

    // Cleanup khi component bị hủy
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]); // Re-run nếu threshold thay đổi

  // --- 4. RENDER ---
  return (
    <div
      ref={ref}
      // Kết hợp class transition với trạng thái isVisible
      className={`transition-all duration-700 ease-out transform ${
        isVisible
          ? "opacity-100 translate-y-0" // Trạng thái hiện: Rõ nét, vị trí chuẩn
          : "opacity-0 translate-y-10" // Trạng thái ẩn: Mờ, dịch xuống 10px
      } ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
