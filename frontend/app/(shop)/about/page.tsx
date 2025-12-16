import React from "react";
import { CheckCircle, Leaf, Truck, Users } from "lucide-react";

// --- 1. DỮ LIỆU TĨNH (STATIC DATA) ---

// Danh sách các cam kết (Checklist)
const COMMITMENTS = [
  "100% Organic",
  "Không hóa chất",
  "Tươi trong ngày",
  "Truy xuất nguồn gốc",
];

// Danh sách giá trị cốt lõi (Cards)
const CORE_VALUES = [
  {
    title: "Sống Xanh",
    desc: "Ưu tiên các sản phẩm thân thiện môi trường, hạn chế rác thải nhựa trong đóng gói.",
    icon: <Leaf size={32} />,
    colorClass: "bg-green-100 text-green-600",
  },
  {
    title: "Tận Tâm",
    desc: "Khách hàng là trung tâm. Chúng tôi lắng nghe và phục vụ bằng cả trái tim.",
    icon: <Users size={32} />,
    colorClass: "bg-blue-100 text-blue-600",
  },
  {
    title: "Tốc Độ",
    desc: "Giao hàng siêu tốc trong 2h để đảm bảo độ tươi ngon nhất của thực phẩm.",
    icon: <Truck size={32} />,
    colorClass: "bg-orange-100 text-orange-600",
  },
];

// --- 2. COMPONENT CHÍNH ---

export default function AboutPage() {
  return (
    <div className="bg-white font-sans text-slate-600 animate-fade-up">
      {/* === SECTION 1: HERO BANNER === */}
      <div className="relative bg-green-900 py-24 text-center text-white overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="/images/home/background.webp"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Câu Chuyện Của FreshFood
          </h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Hành trình mang thực phẩm sạch từ nông trại đến bàn ăn của gia đình
            Việt.
          </p>
        </div>
      </div>

      {/* === MAIN CONTENT CONTAINER === */}
      <div className="container mx-auto px-4 py-16 space-y-20">
        {/* === SECTION 2: SỨ MỆNH & CÂU CHUYỆN (Split Layout) === */}
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Cột Trái: Hình ảnh */}
          <div className="md:w-1/2">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
                alt="Vườn rau sạch"
                className="w-full h-auto hover:scale-105 transition duration-700 ease-in-out"
              />
            </div>
          </div>

          {/* Cột Phải: Nội dung text */}
          <div className="md:w-1/2 space-y-6">
            <span className="text-green-600 font-bold uppercase tracking-wider text-sm">
              Về chúng tôi
            </span>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">
              Khởi nguồn từ niềm tin vào thực phẩm sạch
            </h2>

            <div className="text-gray-600 space-y-4 leading-relaxed">
              <p>
                FreshFood được thành lập với một mục tiêu đơn giản nhưng đầy
                tham vọng:
                <strong className="text-slate-800">
                  {" "}
                  Giúp mọi gia đình Việt Nam tiếp cận nguồn thực phẩm hữu cơ, an
                  toàn và minh bạch nguồn gốc.
                </strong>
              </p>
              <p>
                Chúng tôi hiểu rằng, bữa ăn không chỉ là dinh dưỡng mà còn là sự
                gắn kết yêu thương. Vì vậy, từng bó rau, từng miếng thịt tại
                FreshFood đều được tuyển chọn khắt khe từ các nông trại đạt
                chuẩn VietGAP & GlobalGAP.
              </p>
            </div>

            {/* Grid Cam kết */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {COMMITMENTS.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 font-bold text-slate-800"
                >
                  <CheckCircle className="text-green-500 shrink-0" size={20} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === SECTION 3: GIÁ TRỊ CỐT LÕI (Cards Grid) === */}
        <div className="bg-green-50 rounded-3xl p-8 md:p-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-gray-600">
              Chúng tôi cam kết mang lại giá trị thực cho cộng đồng và môi
              trường qua từng hành động nhỏ nhất.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CORE_VALUES.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm text-center hover:-translate-y-2 transition-transform duration-300"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${value.colorClass}`}
                >
                  {value.icon}
                </div>
                <h3 className="font-bold text-xl mb-2 text-slate-900">
                  {value.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
