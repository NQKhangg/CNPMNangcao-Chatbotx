"use client";

// --- 1. IMPORTS ---
import React, { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";

// Services
import { contactService } from "@/services/contact.service";

// --- 2. CONFIG & TYPES ---
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_FORM_STATE: ContactFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

// Dữ liệu tĩnh cho cột thông tin
const CONTACT_INFO = [
  {
    icon: <Phone size={20} className="text-green-400" />,
    title: "Hotline",
    desc: "1900 1234 - 0909 888 999",
  },
  {
    icon: <Mail size={20} className="text-green-400" />,
    title: "Email",
    desc: "support@freshfood.vn",
  },
  {
    icon: <MapPin size={20} className="text-green-400" />,
    title: "Văn phòng",
    desc: "Tầng 12, Tòa nhà Bitexco, Q1, TP.HCM",
  },
  {
    icon: <Clock size={20} className="text-green-400" />,
    title: "Giờ làm việc",
    desc: "Thứ 2 - Chủ Nhật: 8:00 - 21:00",
  },
];

// --- 3. COMPONENT ---
export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  // Xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate đơn giản
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi API tạo liên hệ
      await contactService.create(formData);

      toast.success("Gửi liên hệ thành công!", {
        description: "Chúng tôi sẽ phản hồi bạn sớm nhất có thể.",
        duration: 4000,
      });

      // Reset form sau khi gửi thành công
      setFormData(INITIAL_FORM_STATE);
    } catch (error) {
      console.error("Lỗi gửi liên hệ:", error);
      toast.error("Gửi thất bại", {
        description: "Vui lòng thử lại sau giây lát.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 animate-fade-up">
      {/* === HEADER BANNER === */}
      <div className="bg-green-600 text-white py-16 text-center transition-transform duration-500 hover:scale-[1.01]">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Liên hệ với chúng tôi</h1>
          <p className="text-green-100 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp của bạn để cải
            thiện chất lượng dịch vụ mỗi ngày.
          </p>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-12 shadow-2xl shadow-gray-100 rounded-3xl overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-xl">
          {/* CỘT TRÁI: THÔNG TIN LIÊN HỆ */}
          <div className="lg:w-5/12 bg-slate-900 text-white p-10 space-y-8 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6">Thông tin liên hệ</h3>
              <p className="text-slate-400 mb-8">
                Đừng ngần ngại liên hệ với chúng tôi qua các kênh dưới đây.
              </p>

              {/* List Contact Info */}
              <div className="space-y-6">
                {CONTACT_INFO.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-green-600 transition-colors duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-slate-300 text-sm group-hover:text-white transition-colors">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM GỬI TIN */}
          <div className="lg:w-7/12 bg-white p-10">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">
              Gửi tin nhắn cho chúng tôi
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Tên */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-green-600 transition-colors">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition transform focus:scale-[1.01]"
                    placeholder="Nguyễn Văn A"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Input Email */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-green-600 transition-colors">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition transform focus:scale-[1.01]"
                    placeholder="email@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Input Chủ đề */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-green-600 transition-colors">
                  Chủ đề
                </label>
                <input
                  type="text"
                  name="subject"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition transform focus:scale-[1.01]"
                  placeholder="Vấn đề cần hỗ trợ..."
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              {/* Input Nội dung */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-green-600 transition-colors">
                  Nội dung
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none transition transform focus:scale-[1.01]"
                  placeholder="Viết nội dung tại đây..."
                  required
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-green-200 transform hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Gửi tin nhắn
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
