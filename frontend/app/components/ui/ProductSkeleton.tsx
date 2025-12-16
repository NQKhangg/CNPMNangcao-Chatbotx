import React from "react";

export default function ProductSkeleton() {
  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100">
      {/* Khung ảnh */}
      <div className="h-48 bg-gray-100 rounded-2xl mb-4 animate-shimmer relative overflow-hidden"></div>

      {/* Khung tên */}
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-shimmer relative overflow-hidden"></div>

      {/* Khung giá & sao */}
      <div className="flex justify-between mt-4">
        <div className="h-4 bg-gray-100 rounded w-1/3 animate-shimmer relative overflow-hidden"></div>
        <div className="h-4 bg-gray-100 rounded w-1/4 animate-shimmer relative overflow-hidden"></div>
      </div>
    </div>
  );
}
