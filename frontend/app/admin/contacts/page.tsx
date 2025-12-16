"use client";

import React, { useState, useEffect } from "react";
import { contactService } from "@/services/contact.service";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  Reply,
  Send,
  Clock,
  User,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AdminSearch from "@/app/components/admin/search";
import Pagination from "@/app/components/pagination";

export default function AdminContactsPage() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG & TÌM KIẾM ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // --- STATE MODAL REPLY ---
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingContact, setViewingContact] = useState<any>(null);

  // --- API CALLS ---
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactService.getAll(page, 10, searchQuery);
      setContacts(res.data || []);
      setTotalPages(res.lastPage || 1);
    } catch (error) {
      console.error("Lỗi tải liên hệ:", error);
      toast.error("Không thể tải danh sách liên hệ");
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại khi trang hoặc từ khóa tìm kiếm thay đổi
  useEffect(() => {
    fetchContacts();
  }, [page, searchQuery]);

  // --- HANDLERS ---

  // Xử lý gửi phản hồi
  const handleReply = async () => {
    if (!replyContent.trim()) {
      return toast.warning("Vui lòng nhập nội dung trả lời");
    }

    setIsSubmitting(true);
    try {
      await contactService.reply(selectedContact._id, replyContent);
      toast.success("Đã gửi email phản hồi thành công!");

      // Reset form & Reload data
      setSelectedContact(null);
      setReplyContent("");
      fetchContacts();
    } catch (error) {
      console.error(error);
      toast.error("Gửi thất bại, vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xem chi tiết phản hồi cũ
  const handleViewReply = (contact: any) => {
    setViewingContact(contact);
  };

  return (
    <div className="text-slate-800 pb-20 animate-fade-in">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Phản hồi khách hàng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các tin nhắn liên hệ từ khách hàng.
          </p>
        </div>

        {/* Thanh tìm kiếm */}
        <AdminSearch
          placeholder="Tìm tên, email..."
          onSearch={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          onRefresh={fetchContacts}
        />
      </div>

      {/* --- TABLE CONTENT --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 w-1/4">Khách hàng</th>
              <th className="p-4 w-1/5">Chủ đề</th>
              <th className="p-4 w-1/4">Nội dung</th>
              <th className="p-4 w-1/6">Người trả lời</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Đang tải dữ
                    liệu...
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Chưa có liên hệ nào.
                </td>
              </tr>
            ) : (
              contacts.map((c, index) => (
                <tr
                  key={c._id}
                  className="hover:bg-gray-50 transition-colors duration-200 group transform duration-300 hover:scale-101 hover:bg-gray-200 animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Cột 1: Thông tin khách */}
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-blue-600 font-medium">
                      {c.email}
                    </div>
                  </td>

                  {/* Cột 2: Chủ đề */}
                  <td className="p-4 font-medium text-slate-700">
                    {c.subject}
                  </td>

                  {/* Cột 3: Nội dung */}
                  <td className="p-4">
                    <p
                      className="max-w-xs truncate text-gray-500"
                      title={c.message}
                    >
                      {c.message}
                    </p>
                  </td>

                  {/* Cột 4: Người trả lời */}
                  <td className="p-4">
                    {c.status === "REPLIED" ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <User size={14} className="text-gray-400" />
                        {c.replierId?.name || "Admin"}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 italic">--</span>
                    )}
                  </td>

                  {/* Cột 5: Trạng thái */}
                  <td className="p-4 text-center">
                    {c.status === "REPLIED" ? (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                        <CheckCircle size={12} /> Đã trả lời
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-100">
                        <Clock size={12} /> Chờ xử lý
                      </span>
                    )}
                  </td>

                  {/* Cột 6: Hành động */}
                  <td className="p-4 text-center">
                    {c.status === "PENDING" ? (
                      <button
                        onClick={() => setSelectedContact(c)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition shadow-sm cursor-pointer"
                        title="Trả lời ngay"
                      >
                        <Reply size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewReply(c)}
                        className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                        title="Xem nội dung đã trả lời"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL REPLY --- */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Mail className="text-blue-600" /> Trả lời khách hàng
              </h3>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-400 hover:text-red-500 transition cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Đang trả lời cho:{" "}
              <span className="font-bold text-slate-800">
                {selectedContact.name}
              </span>{" "}
              ({selectedContact.email})
            </p>

            {/* Tin nhắn gốc */}
            <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase block mb-1">
                Tin nhắn của khách:
              </span>
              <p className="text-sm text-gray-700 italic">
                "{selectedContact.message}"
              </p>
            </div>

            {/* Form nhập liệu */}
            <div className="mb-4">
              <label className="block font-bold text-sm mb-2 text-slate-700">
                Nội dung email phản hồi:
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm resize-none"
                placeholder="Nhập câu trả lời của bạn..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                autoFocus
              ></textarea>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition cursor-pointer"
                disabled={isSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReply}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-blue-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {isSubmitting ? "Đang gửi..." : "Gửi Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XEM CHI TIẾT (VIEW ONLY) --- */}
      {viewingContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="text-green-600" /> Chi tiết phản hồi
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gửi tới:{" "}
                  <span className="font-semibold">{viewingContact.name}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingContact(null)}
                className="text-gray-400 hover:text-red-500 transition bg-gray-100 hover:bg-red-50 p-1 rounded-full cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Phần tin nhắn gốc của khách */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-400 uppercase block mb-2">
                  Câu hỏi của khách hàng
                </span>
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  "{viewingContact.message}"
                </p>
              </div>

              {/* Mũi tên chỉ xuống trang trí */}
              <div className="flex justify-center text-gray-300">↓</div>

              {/* Phần nội dung đã trả lời */}
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-green-700 uppercase block">
                    Nội dung đã trả lời
                  </span>
                  <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    {new Date(viewingContact.updatedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {viewingContact.replyMessage}
                </p>

                <div className="mt-3 pt-3 border-t border-green-200 text-xs text-green-800 flex items-center gap-1">
                  <User size={12} /> Người trả lời:
                  <span className="font-bold">
                    {viewingContact.replierId?.name || "Admin"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingContact(null)}
                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGINATION --- */}
      <div className="mt-6 flex justify-end">
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
