import React from "react";

/**
 * Trang Điều khoản sử dụng (Terms of Use)
 * Quy định về quyền và nghĩa vụ giữa người dùng và website.
 */
export default function TermsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 animate-fade-up">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          {/* --- Header --- */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Điều Khoản Sử Dụng
          </h1>
          <p className="text-gray-500 mb-8">Chào mừng bạn đến với FreshFood</p>

          {/* --- Content --- */}
          <div className="prose prose-green max-w-none text-slate-700 space-y-6">
            <p>
              Khi quý khách truy cập vào trang web của chúng tôi có nghĩa là quý
              khách đồng ý với các điều khoản này. Trang web có quyền thay đổi,
              chỉnh sửa, thêm hoặc lược bỏ bất kỳ phần nào trong Quy định và
              Điều kiện sử dụng này, vào bất cứ lúc nào.
            </p>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                1. Hướng dẫn sử dụng web
              </h3>
              <p>
                Khi vào web của chúng tôi, người dùng tối thiểu phải 18 tuổi
                hoặc truy cập dưới sự giám sát của cha mẹ hay người giám hộ hợp
                pháp. Chúng tôi cấp giấy phép sử dụng để bạn có thể mua sắm trên
                web trong khuôn khổ Điều khoản và Điều kiện sử dụng đã đề ra.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                2. Ý kiến khách hàng
              </h3>
              <p>
                Tất cả nội dung trang web và ý kiến phê bình của quý khách đều
                là tài sản của chúng tôi. Nếu chúng tôi phát hiện bất kỳ thông
                tin giả mạo nào, chúng tôi sẽ khóa tài khoản của quý khách ngay
                lập tức hoặc áp dụng các biện pháp khác theo quy định của pháp
                luật Việt Nam.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                3. Chấp nhận đơn hàng và giá cả
              </h3>
              <p>
                Chúng tôi có quyền từ chối hoặc hủy đơn hàng của quý khách vì
                bất kỳ lý do gì liên quan đến lỗi kỹ thuật, hệ thống một cách
                khách quan vào bất kỳ lúc nào.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                4. Quy định chấm dứt thỏa thuận
              </h3>
              <p>
                Trong trường hợp có bất kỳ thiệt hại nào phát sinh do việc vi
                phạm Quy Định sử dụng trang web, chúng tôi có quyền đình chỉ
                hoặc khóa tài khoản của quý khách vĩnh viễn.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
