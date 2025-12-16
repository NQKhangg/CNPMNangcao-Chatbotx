import React from "react";
import { RefreshCcw, Clock, AlertTriangle } from "lucide-react";

/**
 * Trang Chính sách đổi trả & Hoàn tiền
 * Bao gồm các icon tóm tắt nhanh và nội dung chi tiết.
 */
export default function ReturnPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 animate-fade-up">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          {/* --- Header Section --- */}
          <div className="border-b pb-6 mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Chính Sách Đổi Trả & Hoàn Tiền
            </h1>
            <p className="text-gray-500">
              Chúng tôi luôn mong muốn mang lại sự hài lòng tuyệt đối cho khách
              hàng.
            </p>
          </div>

          {/* --- Quick Highlights (Icons Grid) --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Box 1 */}
            <div className="bg-green-50 p-4 rounded-xl flex flex-col items-center text-center">
              <Clock className="text-green-600 mb-2" size={32} />
              <h4 className="font-bold">24 Giờ</h4>
              <p className="text-xs text-gray-600">Đổi trả hàng tươi sống</p>
            </div>
            {/* Box 2 */}
            <div className="bg-blue-50 p-4 rounded-xl flex flex-col items-center text-center">
              <RefreshCcw className="text-blue-600 mb-2" size={32} />
              <h4 className="font-bold">1 Đổi 1</h4>
              <p className="text-xs text-gray-600">Nếu lỗi từ nhà cung cấp</p>
            </div>
            {/* Box 3 */}
            <div className="bg-red-50 p-4 rounded-xl flex flex-col items-center text-center">
              <AlertTriangle className="text-red-600 mb-2" size={32} />
              <h4 className="font-bold">Hoàn Tiền</h4>
              <p className="text-xs text-gray-600">Nếu sản phẩm hư hỏng</p>
            </div>
          </div>

          {/* --- Detailed Content --- */}
          <div className="prose prose-green max-w-none text-slate-700 space-y-6">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                1. Điều kiện đổi trả
              </h3>
              <p>FreshFood chấp nhận đổi trả trong các trường hợp sau:</p>
              <ul className="list-disc pl-5">
                <li>
                  Sản phẩm bị hư hỏng, dập nát, ôi thiu trong quá trình vận
                  chuyển.
                </li>
                <li>Sản phẩm hết hạn sử dụng.</li>
                <li>
                  Sản phẩm không đúng với đơn đặt hàng (sai loại, thiếu số
                  lượng).
                </li>
              </ul>
              <p className="italic text-sm text-red-500 mt-2">
                * Lưu ý: Quý khách vui lòng kiểm tra kỹ hàng hóa ngay khi nhận
                hàng từ shipper.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                2. Thời gian áp dụng
              </h3>
              <ul className="list-disc pl-5">
                <li>
                  <strong>
                    Đối với thực phẩm tươi sống (Rau, Thịt, Cá...):
                  </strong>{" "}
                  Trong vòng 24h kể từ khi nhận hàng.
                </li>
                <li>
                  <strong>Đối với thực phẩm khô, đóng gói:</strong> Trong vòng 3
                  ngày kể từ khi nhận hàng.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                3. Quy trình đổi trả
              </h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Chụp ảnh tình trạng sản phẩm bị lỗi.</li>
                <li>
                  Liên hệ với FreshFood qua Hotline <strong>1900 1234</strong>{" "}
                  hoặc tin nhắn Facebook/Zalo.
                </li>
                <li>
                  Nhân viên sẽ xác nhận và tiến hành gửi bù sản phẩm mới hoặc
                  hoàn tiền cho quý khách.
                </li>
              </ol>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                4. Phương thức hoàn tiền
              </h3>
              <p>
                Nếu quý khách chọn hoàn tiền, tiền sẽ được hoàn vào tài khoản
                ngân hàng của quý khách hoặc ví điện tử (Momo/ZaloPay) trong
                vòng 1-3 ngày làm việc.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
