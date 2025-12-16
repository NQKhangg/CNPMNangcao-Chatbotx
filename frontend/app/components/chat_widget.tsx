"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import axios from "@/lib/axios"; // Axios instance của bạn

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "bot",
      text: "Xin chào! Tôi là trợ lý FreshFood 🌿. Bạn cần tìm món ngon gì hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll xuống cuối
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      // Gọi về NestJS Backend (không gọi trực tiếp Python)
      const res = await axios.post("/chat", { message: userMsg });

      setMessages((prev) => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Xin lỗi, tôi đang gặp chút trục trặc 😵‍💫" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* 1. Nút mở Chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* 2. Cửa sổ Chat */}
      {isOpen && (
        <div className="bg-white w-[350px] h-[500px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý FreshFood</h3>
                <span className="text-[10px] flex items-center gap-1 opacity-90">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>{" "}
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-none"
                      : "bg-white text-slate-700 border border-gray-100 shadow-sm rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                className="flex-1 bg-transparent text-sm outline-none text-slate-700"
                placeholder="Hỏi gì đó (VD: Món ngon từ thịt heo?)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="text-green-600 hover:text-green-700 disabled:opacity-50 transition transform active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-[10px] text-center text-gray-400 mt-2">
              AI có thể đưa ra thông tin chưa chính xác.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
