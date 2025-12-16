import React from "react";

/**
 * Trang Chính sách bảo mật (Privacy Policy)
 * Hiển thị các quy định về thu thập và bảo vệ dữ liệu người dùng.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 animate-fade-up">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm">
          {/* --- Header Section --- */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-gray-500 mb-8">Cập nhật lần cuối: 08/12/2025</p>

          {/* --- Content Section --- */}
          <div className="prose prose-green max-w-none text-slate-700 space-y-6">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                1. Mục đích thu thập thông tin
              </h3>
              <p>
                Việc thu thập dữ liệu trên website FreshFood bao gồm: email,
                điện thoại, tên đăng nhập, mật khẩu đăng nhập, địa chỉ khách
                hàng. Đây là các thông tin mà FreshFood cần thành viên cung cấp
                bắt buộc khi đăng ký sử dụng dịch vụ và để FreshFood liên hệ xác
                nhận khi khách hàng đăng ký sử dụng dịch vụ trên website nhằm
                đảm bảo quyền lợi cho cho người tiêu dùng.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                2. Phạm vi sử dụng thông tin
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Cung cấp các dịch vụ đến thành viên.</li>
                <li>
                  Gửi các thông báo về các hoạt động trao đổi thông tin giữa
                  thành viên và website.
                </li>
                <li>
                  Ngăn ngừa các hoạt động phá hủy tài khoản người dùng của thành
                  viên hoặc các hoạt động giả mạo thành viên.
                </li>
                <li>
                  Liên lạc và giải quyết với thành viên trong những trường hợp
                  đặc biệt.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                3. Thời gian lưu trữ thông tin
              </h3>
              <p>
                Dữ liệu cá nhân của Thành viên sẽ được lưu trữ cho đến khi có
                yêu cầu hủy bỏ hoặc tự thành viên đăng nhập và thực hiện hủy bỏ.
                Còn lại trong mọi trường hợp thông tin cá nhân thành viên sẽ
                được bảo mật trên máy chủ của FreshFood.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                4. Cam kết bảo mật
              </h3>
              <p>
                Thông tin cá nhân của thành viên trên FreshFood được cam kết bảo
                mật tuyệt đối theo chính sách bảo vệ thông tin cá nhân của
                FreshFood. Việc thu thập và sử dụng thông tin của mỗi thành viên
                chỉ được thực hiện khi có sự đồng ý của khách hàng đó trừ những
                trường hợp pháp luật có quy định khác.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
