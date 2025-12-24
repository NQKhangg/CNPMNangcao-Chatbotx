# pip install google-genai faiss-cpu sentence-transformers fastapi uvicorn
import os
import re
import json
import pickle
from datetime import datetime
import numpy as np
import faiss
from google import genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from fastapi.middleware.cors import CORSMiddleware

# --- CẤU HÌNH ỨNG DỤNG ---

# Khởi tạo FastAPI
app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cấu hình Gemini Client
# terminal : export GEMINI_API_KEY=...
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")
client = genai.Client(api_key=api_key)

# Cấu hình đường dẫn lưu Cache
CACHE_DIR = "./cache"
INDEX_FILE = os.path.join(CACHE_DIR, "faiss.index")
DOCS_FILE = os.path.join(CACHE_DIR, "documents.pkl")

# Biến toàn cục lưu trạng thái RAG
rag_db = {
    "documents": [],  # Danh sách văn bản gốc
    "index": None,    # Chỉ mục tìm kiếm FAISS
    "model": None     # Model Embedding
}

# --- CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS) ---

def clean_html(raw_html):
    """Loại bỏ các thẻ HTML khỏi chuỗi văn bản."""
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def format_price(value):
    """Định dạng giá tiền sang kiểu Việt Nam (VD: 100.000 đ)."""
    return "{:,.0f} đ".format(value).replace(",", ".")

def parse_mongo_date(date_obj):
    """Chuyển đổi đối tượng ngày tháng từ MongoDB sang chuỗi dd/mm/yyyy."""
    if not date_obj:
        return "Không thời hạn"
    if isinstance(date_obj, str):
        return date_obj
    # Xử lý định dạng MongoDB {$date: "..."}
    if isinstance(date_obj, dict) and '$date' in date_obj:
        try:
            # Cắt bỏ phần mili giây nếu cần hoặc parse ISO
            dt_str = date_obj['$date'].replace('Z', '+00:00')
            dt = datetime.fromisoformat(dt_str)
            return dt.strftime("%d/%m/%Y")
        except Exception:
            return str(date_obj['$date'])
    return str(date_obj)

# --- HÀM XỬ LÝ RAG CHÍNH ---

def load_and_index_data(force_refresh=False):
    """
    Tải dữ liệu, tạo embedding và index FAISS.
    Args:
        force_refresh (bool): Nếu True, xóa cache cũ và tạo lại từ đầu.
    """
    
    # 0. Load Model Embedding
    model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    print(f"Đang tải model embedding: {model_name}...")
    try:
        model = SentenceTransformer(model_name)
        rag_db["model"] = model
    except Exception as e:
        print(f"Lỗi tải model embedding: {e}")
        return

    # 1. Kiểm tra Cache
    if not force_refresh and os.path.exists(INDEX_FILE) and os.path.exists(DOCS_FILE):
        print("Đang tải dữ liệu từ cache ./cache...")
        try:
            # Load Index FAISS
            index = faiss.read_index(INDEX_FILE)
            
            # Load Documents
            with open(DOCS_FILE, "rb") as f:
                documents = pickle.load(f)
            
            rag_db["index"] = index
            rag_db["documents"] = documents
            print(f"Đã khôi phục {len(documents)} tài liệu từ Cache. Sẵn sàng!")
            return 
        except Exception as e:
            print(f"Lỗi đọc cache ({e}). Sẽ tiến hành tạo lại dữ liệu mới...")

    # 2. Nạp và xử lý dữ liệu gốc
    print("Đang nạp và xử lý dữ liệu gốc từ JSON...")
    
    # Tạo thư mục cache nếu chưa có
    if not os.path.exists(CACHE_DIR):
        os.makedirs(CACHE_DIR)

    documents = []
    
    # Định nghĩa đường dẫn file
    files = {
        "products": ["../database/data/database.products.json"],
        "blogs": ["../database/data/database.blogs.json"],
        "categories": ["../database/data/database.categories.json"],
        "coupons": ["../database/data/database.coupons.json"]
    }

    def get_valid_path(paths):
        for p in paths:
            if os.path.exists(p): return p
        return None

    # Load Products
    path = get_valid_path(files["products"])
    if path:
        try:
            with open(path, encoding="utf-8") as f:
                products = json.load(f)
                for p in products:
                    if p.get('isDeleted'): continue 

                    nutrition = ", ".join([f"{n.get('label','')}: {n.get('value','')}" for n in p.get('nutrition', [])])
                    tags = ", ".join(p.get('tags', []))
                    desc = clean_html(p.get('description', ''))
                    
                    doc = (
                        f"[SẢN PHẨM] {p['name']}\n"
                        f"- Giá: {format_price(p.get('price', 0))} (Gốc: {format_price(p.get('originalPrice', 0))})\n"
                        f"- Đơn vị: {p.get('unit', '')}\n"
                        f"- Đặc điểm: {p.get('shortDescription', '')}. {desc[:500]}...\n"
                        f"- Dinh dưỡng: {nutrition}\n"
                        f"- Bảo quản: {p.get('preservation', '')}\n"
                        f"- Từ khóa: {tags}"
                    )
                    documents.append(doc)
            print(f"Đã load {len(products)} sản phẩm.")
        except Exception as e:
            print(f"Lỗi đọc Products: {e}")

    # Load Categories
    path = get_valid_path(files["categories"])
    if path:
        try:
            with open(path, encoding="utf-8") as f:
                cats = json.load(f)
                for c in cats:
                    if not c.get('isActive') or c.get('isDeleted'): continue

                    doc = (
                        f"[DANH MỤC] {c['name']}\n"
                        f"- Mô tả: {c.get('description', '')}"
                    )
                    documents.append(doc)
            print(f"Đã load {len(cats)} danh mục.")
        except Exception as e:
            print(f"Lỗi đọc Categories: {e}")

    # Load Blogs
    path = get_valid_path(files["blogs"])
    if path:
        try:
            with open(path, encoding="utf-8") as f:
                blogs = json.load(f)
                for b in blogs:
                    if not b.get('isPublished') or b.get('isDeleted'): continue

                    content_clean = clean_html(b.get('content', ''))
                    tags = ", ".join(b.get('tags', []))
                    
                    doc = (
                        f"[BÀI VIẾT/MẸO VẶT] {b['title']}\n"
                        f"- Chủ đề: {b.get('category', '')}\n"
                        f"- Tóm tắt: {b.get('shortDescription', '')}\n"
                        f"- Nội dung chính: {content_clean[:800]}...\n"
                        f"- Từ khóa: {tags}"
                    )
                    documents.append(doc)
            print(f"Đã load {len(blogs)} bài viết.")
        except Exception as e:
            print(f"Lỗi đọc Blogs: {e}")

    # Load Coupons
    path = get_valid_path(files["coupons"])
    if path:
        try:
            with open(path, encoding="utf-8") as f:
                coupons = json.load(f)
                for c in coupons:
                    if not c.get('isActive') or c.get('isDeleted'): continue
                    
                    if c.get('type') == 'PERCENT':
                        val_str = f"{c.get('value')}%"
                    else:
                        val_str = format_price(c.get('value', 0))

                    expiry = parse_mongo_date(c.get('expiryDate'))
                    
                    limit_info = "Không giới hạn" if c.get('usageLimit', 0) == 0 else f"Còn {c['usageLimit'] - c.get('usedCount', 0)} lượt"

                    doc = (
                        f"[MÃ GIẢM GIÁ/VOUCHER] Mã: {c['code']}\n"
                        f"- Ưu đãi: Giảm {val_str}\n"
                        f"- Mô tả: {c.get('description', '')}\n"
                        f"- Hạn sử dụng: {expiry}\n"
                        f"- Tình trạng lượt dùng: {limit_info}"
                    )
                    documents.append(doc)
            print(f"Đã load {len(coupons)} mã giảm giá.")
        except Exception as e:
            print(f"Lỗi đọc Coupons: {e}")

    if not documents:
        print("Cảnh báo: Không có dữ liệu nào được nạp!")
        documents = ["Chưa có dữ liệu."]

    # 3. Tạo Index FAISS
    print("Đang tạo index FAISS...")
    try:
        vectors = model.encode(documents)
        # Chuyển đổi sang float32 nếu chưa phải
        vectors = np.array(vectors).astype("float32")
        
        index = faiss.IndexFlatL2(vectors.shape[1])
        index.add(vectors)

        # Lưu cache
        print("Đang lưu cache...")
        faiss.write_index(index, INDEX_FILE)
        with open(DOCS_FILE, "wb") as f:
            pickle.dump(documents, f)

        # Cập nhật state
        rag_db["documents"] = documents
        rag_db["index"] = index
        print(f"AI Service đã sẵn sàng! Tổng cộng {len(documents)} tài liệu đã được index.")
    except Exception as e:
        print(f"Lỗi tạo index: {e}")

def retrieve_context(query, k=3):
    """Truy xuất các văn bản liên quan dựa trên query."""
    model = rag_db["model"]
    index = rag_db["index"]
    documents = rag_db["documents"]
    
    if not model or not index:
        return "Hệ thống đang khởi động..."

    try:
        q_vec = model.encode([query])
        q_vec = np.array(q_vec).astype("float32")
        
        _, idx = index.search(q_vec, k)
        
        results = [documents[i] for i in idx[0] if i < len(documents)]
        return "\n".join(results)
    except Exception as e:
        print(f"Lỗi truy xuất context: {e}")
        return ""

# --- API ENDPOINTS ---

@app.on_event("startup")
def startup_event():
    load_and_index_data(force_refresh=False)

@app.get("/")
def home():
    return {"status": "AI Service is running", "model": "Gemini 2.5 Flash Lite"}

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        user_query = request.question
            
        # 1. Tìm thông tin liên quan (RAG)
        context = retrieve_context(user_query, k=4)

        # 2. Tạo Prompt
        prompt = f"""
            Bạn là trợ lý ảo chuyên nghiệp của cửa hàng thực phẩm sạch FreshFood.
            
            DỮ LIỆU TÌM THẤY TỪ CỬA HÀNG:
            ---------------------
            {context}
            ---------------------
            
            YÊU CẦU TRẢ LỜI:
            1. Dựa CHÍNH XÁC vào dữ liệu trên để trả lời.
            2. Nếu khách hỏi món ăn, hãy gợi ý món dựa trên nguyên liệu có trong dữ liệu (ví dụ: có thịt heo -> gợi ý thịt kho tàu).
            3. Đối với sản phẩm, tuyệt đối KHÔNG bịa đặt giá cả nếu không có trong dữ liệu.
            4. Hãy tư vấn nhiệt tình cho khách hàng về tư vấn bữa ăn, sức khỏe, đời sống, ...
            5. Trả lời ngắn gọn, thân thiện, sử dụng Emoji phù hợp 🌿🍎.
            
            Câu hỏi của khách: {user_query}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        
        return {
            "answer": response.text,
            "context_used": context
        }
    except Exception as e:
        print(f"Lỗi xử lý chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Để chạy: uvicorn filename:app --reload