"use client";

import React, { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  User,
  Loader2,
  FileText,
} from "lucide-react";

// --- HELPER: GET ICON BY TYPE ---
const getTypeIcon = (type: string) => {
  switch (type) {
    case "IMPORT":
      return <ArrowDownLeft className="text-green-600" size={18} />;
    case "SALE":
      return <ArrowUpRight className="text-blue-600" size={18} />;
    case "RETURN":
      return <RotateCcw className="text-purple-600" size={18} />;
    case "DAMAGED":
      return <AlertTriangle className="text-red-600" size={18} />;
    default:
      return <ClipboardList className="text-gray-600" size={18} />;
  }
};

// --- HELPER: GET BADGE STYLE BY TYPE ---
const getTypeBadge = (type: string) => {
  switch (type) {
    case "IMPORT":
      return "bg-green-50 text-green-700 border-green-200";
    case "SALE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "RETURN":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "DAMAGED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function InventoryHistoryTab() {
  // --- STATE ---
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- API: FETCH LOGS ---
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getLogs(page, 10, searchQuery);
      if (res && res.data) {
        setLogs(res.data);
        setTotalPages(res.lastPage);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử kho:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload khi page/search thay đổi
  useEffect(() => {
    fetchHistory();
  }, [page, searchQuery]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {/* --- HEADER & TOOLBAR --- */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="text-blue-500" size={20} /> Nhật ký biến động
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Lịch sử chi tiết mọi giao dịch nhập/xuất kho.
          </p>
        </div>

        <div className="w-64">
          <AdminSearch
            placeholder="Tìm mã phiếu, SKU..."
            onSearch={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onRefresh={fetchHistory}
          />
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-50 uppercase text-xs font-bold text-gray-500 border-b border-gray-200">
            <tr>
              <th className="p-4 w-[15%]">Thời gian</th>
              <th className="p-4 w-[12%]">Loại GD</th>
              <th className="p-4 w-[25%]">Sản phẩm</th>
              <th className="p-4 text-center w-[10%]">Thay đổi</th>
              <th className="p-4 text-center w-[10%]">Tồn sau</th>
              <th className="p-4 w-[28%]">Chi tiết / Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" /> Đang tải lịch sử...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-gray-400 italic"
                >
                  Không có dữ liệu nhật ký nào.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr
                  key={log._id}
                  className="hover:bg-blue-50/30 transition-colors duration-300 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Cột 1: Thời gian */}
                  <td className="p-4 align-top">
                    <div className="text-slate-700 font-medium text-xs">
                      {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString("vi-VN")}
                    </div>
                  </td>

                  {/* Cột 2: Loại giao dịch */}
                  <td className="p-4 align-top">
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border w-fit ${getTypeBadge(
                        log.type
                      )}`}
                    >
                      {getTypeIcon(log.type)}
                      <span className="text-[10px] font-bold">{log.type}</span>
                    </div>
                  </td>

                  {/* Cột 3: Sản phẩm */}
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-1">
                      <div
                        className="font-bold text-slate-800 text-sm line-clamp-1"
                        title={log.productId?.name}
                      >
                        {log.productId?.name || (
                          <span className="text-red-400 italic">
                            Sản phẩm đã xóa
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded w-fit border border-gray-200">
                        SKU: {log.productId?.sku || "---"}
                      </div>
                    </div>
                  </td>

                  {/* Cột 4: Số lượng thay đổi */}
                  <td
                    className={`p-4 text-center font-bold text-sm align-top ${
                      log.change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {log.change > 0 ? `+${log.change}` : log.change}
                  </td>

                  {/* Cột 5: Tồn kho sau GD */}
                  <td className="p-4 text-center align-top">
                    <span className="bg-gray-100 text-slate-700 font-mono font-bold px-2.5 py-1 rounded text-xs border border-gray-200">
                      {log.currentStock}
                    </span>
                  </td>

                  {/* Cột 6: Chi tiết */}
                  <td className="p-4 text-xs align-top">
                    {/* Lý do */}
                    <div
                      className="font-medium text-slate-700 mb-1.5 line-clamp-2 leading-relaxed"
                      title={log.reason}
                    >
                      {log.reason || "Không có ghi chú"}
                    </div>

                    {/* Metadata: Ref Code & User */}
                    <div className="flex flex-wrap gap-2 text-gray-400 items-center">
                      {log.referenceCode && (
                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          REF: {log.referenceCode}
                        </span>
                      )}

                      <span
                        className="flex items-center gap-1 text-[10px] whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                        title={log.actor?.email}
                      >
                        <User size={10} />{" "}
                        {log.actor?.name ||
                          log.actor?.email?.split("@")[0] ||
                          "System"}
                      </span>
                    </div>

                    {/* Link đơn hàng (nếu có) */}
                    {log.orderId && (
                      <a
                        href={`/profile/orders/${log.orderId._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline font-mono mt-1.5 inline-flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-colors"
                      >
                        Đơn hàng: #{log.orderId._id.slice(-6).toUpperCase()}
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION --- */}
      <div className="p-4 border-t border-gray-100 flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
