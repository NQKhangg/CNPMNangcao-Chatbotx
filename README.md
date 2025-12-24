# CNPMNangcao tích hợp Chatbotx
Website bán thực phẩm CNPMNC tích hợp Chatbotx

Dự án **Website bán thực phẩm + Chatbotx** là một hệ thống web fullstack phục vụ bán thực phẩm sạch, bao gồm:

* Frontend (UI người dùng)
* Backend (API, xử lý nghiệp vụ)
* Database (MongoDB)
* Chatbot hỗ trợ người dùng
* Tích hợp thanh toán **SePay** và xác thực **Gmail**

## Cấu trúc thư mục chính

```
web-fruit-vegetables/
│
├── backend/                 # API Server (NestJS)
│   ├── src/
│   │   ├── auth/            # Xử lý đăng nhập, đăng ký, JWT, Google Auth
│   │   ├── users/           # Quản lý thông tin người dùng
│   │   ├── products/        # Quản lý sản phẩm (CRUD, Search)
│   │   ├── orders/          # Quản lý đơn hàng
│   │   ├── chat/            # Module gọi sang Chatbot Service
│   │   ├── mail/            # Module gửi email (Nodemailer)
│   │   ├── upload/          # Xử lý upload ảnh (Multer)
│   │   ├── webhook/         # Xử lý Webhook thanh toán (SePay)
│   │   ├── common/          # Các tiện ích dùng chung (Guards, Decorators)
│   │   ├── app.module.ts    # Module gốc kết nối các module con
│   │   └── main.ts          # File khởi chạy server (Cấu hình CORS, Pipe)
│   ├── uploads/             # Thư mục chứa ảnh đã upload (Public static)
│   ├── .env                 # Biến môi trường (DB, JWT, Mail, API Key)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Client App (Next.js 14+ App Router)
│   ├── app/                 # Các trang giao diện (Routing)
│   │   ├── (auth)/          # Nhóm trang Auth (Login, Register) - không hiện trên URL
│   │   ├── admin/           # Trang quản trị (Dashboard, Products Manager)
│   │   ├── (shop)/          # Trang khách hàng
│   │       ├── products/        # Trang danh sách & chi tiết sản phẩm
│   │       ├── checkout/        # Trang thanh toán
│   │       ├── profile/         # Trang thông tin cá nhân
│   │       └── ...
│   │   ├── page.tsx         # Trang chủ (Home)
│   │   └── layout.tsx       # Layout chính (Header, Footer, ChatWidget)
│   ├── components/          # UI Components tái sử dụng
│   │   ├── ui/              # Button, Input, Modal, Card (Atomic design)
│   │   ├── shop/            # Header, Footer, ChatWidget
│   │   └── admin/           # Sidebar, AdminTable, Chart
│   ├── contexts/            # React Context (CartContext, AuthContext)
│   ├── services/            # API calls (axios instance, product.service.ts...)
│   ├── types/               # TypeScript Interfaces (User, Product, Order)
│   ├── public/              # File tĩnh (Logo, Banner, Icons)
│   ├── .env                 # Biến môi trường Frontend
│   ├── next.config.js
│   ├── package.json
│   └── tailwind.config.ts
│
├── chatbot/                  # AI Service
│   ├── cache/                # Dữ liệu để RAG học
│   │   ├── documents.pkl
│   │   └── faiss.index
│   └── gimini.py              # File chính chạy server FastAPI (RAG logic)
│   
│   
│
├── database/                # Dữ liệu mẫu (Seed Data)
│   ├── products.json        # Dữ liệu sản phẩm mẫu để import MongoDB
│   ├── users.json           # Dữ liệu user mẫu (Admin/Customer)
│   ├── categories.json      # Danh mục sản phẩm
│   └── ...
│
├── .gitignore               # Loại bỏ node_modules, .env, .DS_Store khi push git
├── public_url.py            # Script hỗ trợ chạy ngrok/cloudflared nhanh (Option)
└── README.md                # Hướng dẫn cài đặt dự án
```

---

## 1. Import dữ liệu MongoDB

Sử dụng **MongoDB Compass**:

1. Mở MongoDB Compass
2. Kết nối tới MongoDB local
3. Import các file `.json` trong thư mục:

```
/database
```

---

## 2. Cấu hình gửi Email (Gmail)

### Chuẩn bị tài khoản Gmail

1. Truy cập: [https://myaccount.google.com](https://myaccount.google.com)
2. Vào **Security (Bảo mật)**
3. Bật **2-Step Verification**
4. Tạo **App Password**
5. Lưu lại **mật khẩu ứng dụng 16 ký tự**

### Cấu hình Backend (.env)

```env
MAIL_PASS=xxxxxxxxxxxxxxxx
```

> Lưu ý:
>
> * Không có khoảng trắng
> * Không dùng dấu ngoặc kép

### Cấu hình Frontend

Trong file:

```
frontend/app/layout.tsx
```

Cấu hình:

```env
GOOGLE_CLIENT_ID=...
```

---

## 3. Cấu hình thanh toán SePay

### Đăng ký & thiết lập

1. Đăng ký tài khoản tại: [https://my.sepay.vn](https://my.sepay.vn)
2. Vào **Ngân hàng** → Thêm tài khoản (MB Bank, VCB, ...)
3. Liên kết ngân hàng với SePay

### Tạo Webhook

* URL webhook:

```
{public_url_backend}/webhook/sepay
```

(Ví dụ public bằng cloudflared : cloudflared tunnel --url http://localhost:4000)

* API Key:

```env
SEPAY_API_KEY=...
```

> API key trên SePay **phải trùng** với key trong `.env` backend

### Cơ chế hoạt động

```
Khách chuyển tiền
→ Ngân hàng gửi notification
→ SePay nhận notification
→ SePay gọi webhook backend
→ Backend xác thực API key
→ Ghi nhận & cập nhật dữ liệu
```

---

## 4. Chạy dự án

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

### Backend

```bash
cd backend
npm install
npm run start:dev
```

---

### Public Backend (Webhook SePay)

Sử dụng **cloudflared**:

```bash
cloudflared tunnel --url http://localhost:4000
```

Sau đó:

* Cập nhật webhook trên trang SePay
* Sửa file:

```
frontend/config/bank.config.ts
```

---

### Chatbot (Gemini)

Cài đặt thư viện:

```bash
pip install fastapi uvicorn google-genai sentence-transformers faiss-cpu python-multipart
```

Cấu hình API key:

```bash
export GEMINI_API_KEY=...
```

Chạy chatbot:

```bash
uvicorn gemini:app --port 8000 --reload
```

---

```
---
## Giao diện 
<img width="1920" height="1080" alt="Ảnh chụp màn hình (339)" src="https://github.com/user-attachments/assets/82415290-7e08-42bd-9d0d-73aadd280dd4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (341)" src="https://github.com/user-attachments/assets/6665531d-2b36-43d2-8586-82cef5f691d4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (342)" src="https://github.com/user-attachments/assets/ebe7772e-8070-46e7-a6ee-385be6feb9e7" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (336)" src="https://github.com/user-attachments/assets/2659f3a1-b52a-48f3-ae3c-dcf8684ab6b4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (343)" src="https://github.com/user-attachments/assets/2ad0eb53-4354-4352-830f-7698fe169bc5" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (344)" src="https://github.com/user-attachments/assets/62db916d-ea5d-4fad-bb1f-1ffc9bbaf232" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (345)" src="https://github.com/user-attachments/assets/bec46195-45f9-4d83-8577-4ed19d42a7ff" />
............................









