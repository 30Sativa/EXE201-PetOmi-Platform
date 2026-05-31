Nếu mục tiêu của bạn là:

* Backend chính: **ASP.NET Core (Database First)**
* AI Service: **FastAPI**
* Chức năng: **Chatbot + RAG**
* Có thể đọc dữ liệu từ DB của hệ thống PetOmi

Thì mình sẽ chốt structure như này:

```text
EXE201-PetOmi-Platform/
└── apps/
    ├── api/                    # ASP.NET Core
    │
    └── ai-service/
        ├── .venv/
        ├── main.py
        ├── config.py
        ├── requirements.txt
        ├── .env
        │
        ├── database/
        │   ├── __init__.py
        │   ├── connection.py
        │   ├── models.py
        │   └── repositories.py
        │
        ├── rag/
        │   ├── __init__.py
        │   ├── document_loader.py
        │   ├── embedder.py
        │   ├── vector_store.py
        │   └── retriever.py
        │
        ├── chat/
        │   ├── __init__.py
        │   ├── chat_service.py
        │   ├── prompt_templates.py
        │   └── message_history.py
        │
        ├── schemas/
        │   ├── __init__.py
        │   ├── request.py
        │   └── response.py
        │
        ├── routes/
        │   ├── __init__.py
        │   ├── chat.py
        │   ├── documents.py
        │   └── health.py
        │
        ├── utils/
        │   ├── __init__.py
        │   ├── logger.py
        │   └── helpers.py
        │
        ├── tests/
        │   └── test_chat.py
        │
        ├── data/
        │   └── documents/
        │
        └── chroma_db/
```

### Vai trò từng folder

#### `routes/`

API endpoints

```text
POST /chat
POST /documents/upload
GET  /health
```

---

#### `chat/`

Business logic chatbot

```text
chat_service.py
```

Flow:

```text
Question
   ↓
RAG
   ↓
LLM
   ↓
Response
```

---

#### `rag/`

Toàn bộ RAG

```text
document_loader.py
```

Đọc:

```text
pdf
docx
txt
```

```text
embedder.py
```

Tạo embeddings.

```text
retriever.py
```

Search vector.

```text
vector_store.py
```

ChromaDB.

---

#### `database/`

Đọc dữ liệu PetOmi

Ví dụ:

```text
Pets
Products
Services
Bookings
```

từ database của ASP.NET.

---

#### `schemas/`

Request/Response DTO

Ví dụ:

```python
ChatRequest
ChatResponse
```

---

#### `data/documents/`

Nguồn tri thức cho RAG

Ví dụ:

```text
faq.pdf
pet-care-guide.pdf
vaccination-policy.pdf
```

---

#### `chroma_db/`

Vector database local

```text
vector embeddings
```

---

### Main.py chỉ nên làm việc này

```python
from fastapi import FastAPI

app = FastAPI()

app.include_router(chat_router)
app.include_router(health_router)
```

Không nhét AI logic vào đây.

---

Kiến trúc này khá phù hợp cho đồ án EXE201 vì:

```text
ASP.NET Core
      ↓
AI Service (FastAPI)
      ↓
RAG + ChromaDB + OpenAI/Gemini
      ↓
Response
```

Sạch, dễ demo, dễ mở rộng và chưa tới mức "enterprise over-engineering".
