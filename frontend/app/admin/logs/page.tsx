"use client";

import React, { useEffect, useState } from "react";
import { logService } from "@/services/log.service";
import {
  Activity,
  Clock,
  Eye,
  X,
  RotateCcw,
  Filter,
  User as UserIcon,
} from "lucide-react";
import Pagination from "@/app/components/pagination";
import AdminSearch from "@/app/components/admin/search";

// --- HELPER: RENDER BADGE FOR ACTION TYPES ---
const getActionBadge = (action: string) => {
  const styles: Record<string, string> = {
    CREATE: "bg-green-50 text-green-700 border-green-200",
    UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
    LOGIN: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const className =
    styles[action] || "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide ${className}`}
    >
      {action}
    </span>
  );
};

export default function AuditLogsPage() {
  // --- STATE DATA ---
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PAGINATION & SEARCH ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE FILTERS ---
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --- STATE MODAL ---
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // --- API: LOAD LOGS ---
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await logService.getAll(
        page,
        10,
        searchQuery,
        fromDate,
        toDate
      );

      if (res && Array.isArray(res.data)) {
        setLogs(res.data);
        setTotalPages(res.lastPage);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Lỗi tải logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reload khi bất kỳ điều kiện lọc nào thay đổi
  useEffect(() => {
    loadData();
  }, [page, searchQuery, fromDate, toDate]);

  // --- HANDLER: RESET FILTER ---
  const handleResetFilter = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="text-slate-800 pb-20 font-sans animate-fade-in">
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 mb-6 text-slate-900">
          <Activity className="text-blue-600" size={32} />
          Nhật ký hoạt động
        </h2>

        {/* Toolbar: Search + Date Filter */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-5 items-end xl:items-center justify-between">
          {/* Search Box */}
          <div className="w-full xl:w-1/3">
            <AdminSearch
              placeholder="Tìm User, ID, Action..."
              onSearch={(q) => {
                setSearchQuery(q);
                setPage(1);
              }}
              onRefresh={loadData}
            />
          </div>

          {/* Date Filters Group */}
          <div className="flex flex-wrap gap-3 items-end w-full xl:w-auto bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-bold uppercase mr-2 mb-2">
              <Filter size={16} /> Bộ lọc
            </div>

            {/* From Date */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 cursor-pointer"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* Separator */}
            <span className="text-gray-300 mb-2">—</span>

            {/* To Date */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 cursor-pointer"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/* Reset Button (Only show if filtering) */}
            {(fromDate || toDate || searchQuery) && (
              <button
                onClick={handleResetFilter}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                title="Xóa bộ lọc"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-[15%]">Hành động</th>
                <th className="px-6 py-4 w-[20%]">Đối tượng</th>
                <th className="px-6 py-4 w-[25%]">Người thực hiện</th>
                <th className="px-6 py-4 w-[25%]">Chi tiết kỹ thuật</th>
                <th className="px-6 py-4 text-center w-[15%]">Công cụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-gray-400 italic"
                  >
                    Không tìm thấy nhật ký nào.
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log._id}
                    className="hover:bg-blue-50/30 transition duration-200 group transform hover:scale-101 hover:bg-gray-200 animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* 1. Action & Time */}
                    <td className="px-6 py-4 align-top">
                      {getActionBadge(log.action)}
                      <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </td>

                    {/* 2. Resource */}
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-700 text-sm">
                        {log.resource}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-1 bg-gray-100 w-fit px-1.5 py-0.5 rounded border border-gray-200">
                        ID: {log.resourceId}
                      </div>
                    </td>

                    {/* 3. Actor */}
                    <td className="px-6 py-4 align-top">
                      {log.performedBy ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-gray-200 shrink-0 overflow-hidden">
                            {log.performedBy.avatar ? (
                              <img
                                src={log.performedBy.avatar}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm truncate max-w-[150px]">
                              {typeof log.performedBy === "object"
                                ? log.performedBy.name
                                : "Unknown"}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate max-w-[150px]">
                              {typeof log.performedBy === "object"
                                ? log.performedBy.email
                                : ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">
                          System / Deleted User
                        </span>
                      )}
                    </td>

                    {/* 4. Tech Details */}
                    <td className="px-6 py-4 text-xs text-gray-500 align-top">
                      <div className="mb-1">
                        <span className="font-semibold text-slate-600">
                          IP:
                        </span>{" "}
                        {log.ip || "N/A"}
                      </div>
                      <div
                        className="truncate max-w-[200px] opacity-70"
                        title={log.userAgent}
                      >
                        {log.userAgent || "Unknown Agent"}
                      </div>
                    </td>

                    {/* 5. Actions */}
                    <td className="px-6 py-4 text-center align-top">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shadow-sm text-gray-400 cursor-pointer"
                        title="Xem chi tiết thay đổi (JSON)"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- PAGINATION --- */}
      <div className="mt-6 flex justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* --- MODAL DETAIL --- */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Chi tiết thay đổi
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-mono">
                    #{selectedLog._id.slice(-6).toUpperCase()}
                  </span>
                </h3>
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                  <span>
                    {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                  </span>
                  <span>•</span>
                  <span className="font-bold">
                    {selectedLog.action}
                  </span> on{" "}
                  <span className="font-bold">{selectedLog.resource}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Split View) */}
            <div className="p-0 overflow-y-auto bg-slate-50 flex-1">
              <div className="flex flex-col md:flex-row h-full min-h-[400px]">
                {/* Left: OLD DATA */}
                <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-200">
                  <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 font-bold text-xs uppercase flex justify-between">
                    <span>Dữ liệu cũ (Old Value)</span>
                    {!selectedLog.oldValue && (
                      <span className="italic font-normal opacity-70">
                        Trống
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 bg-white overflow-auto">
                    {selectedLog.oldValue ? (
                      <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.oldValue, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">
                        Không có dữ liệu cũ
                        <br />
                        (Hành động tạo mới)
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: NEW DATA */}
                <div className="flex-1 flex flex-col">
                  <div className="px-4 py-2 bg-green-50 border-b border-green-100 text-green-700 font-bold text-xs uppercase flex justify-between">
                    <span>Dữ liệu mới (New Value)</span>
                    {!selectedLog.newValue && (
                      <span className="italic font-normal opacity-70">
                        Trống
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 bg-white overflow-auto">
                    {selectedLog.newValue ? (
                      <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">
                        Không có dữ liệu mới
                        <br />
                        (Hành động xóa)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
