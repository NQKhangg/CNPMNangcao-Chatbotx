# CNPMNangcao-Chatbotx
Website bán thực phẩm CNPMNC tích hợp Chatbotx

Dự án **Website bán thực phẩm + Chatbotx** là một hệ thống web fullstack phục vụ bán thực phẩm sạch, bao gồm:

* Frontend (UI người dùng)
* Backend (API, xử lý nghiệp vụ)
* Database (MongoDB)
* Chatbot hỗ trợ người dùng
* Tích hợp thanh toán **SePay** và xác thực **Gmail**

## Chạy dự án

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
