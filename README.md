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
## Giao diện 
<img width="1920" height="1080" alt="Ảnh chụp màn hình (339)" src="https://github.com/user-attachments/assets/82415290-7e08-42bd-9d0d-73aadd280dd4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (341)" src="https://github.com/user-attachments/assets/6665531d-2b36-43d2-8586-82cef5f691d4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (342)" src="https://github.com/user-attachments/assets/ebe7772e-8070-46e7-a6ee-385be6feb9e7" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (336)" src="https://github.com/user-attachments/assets/2659f3a1-b52a-48f3-ae3c-dcf8684ab6b4" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (343)" src="https://github.com/user-attachments/assets/2ad0eb53-4354-4352-830f-7698fe169bc5" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (344)" src="https://github.com/user-attachments/assets/62db916d-ea5d-4fad-bb1f-1ffc9bbaf232" />
<img width="1920" height="1080" alt="Ảnh chụp màn hình (345)" src="https://github.com/user-attachments/assets/bec46195-45f9-4d83-8577-4ed19d42a7ff" />
............................









