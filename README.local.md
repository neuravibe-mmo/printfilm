# Hướng dẫn khởi chạy PRINTFILM (Chế độ Local Development)

Tài liệu này hướng dẫn cách khởi chạy toàn bộ hệ thống PRINTFILM trên máy cục bộ phục vụ cho việc phát triển (development), gỡ lỗi (debugging) và chỉnh sửa mã nguồn trực tiếp.

---

## 1. Kiến trúc hệ thống

Khi phát triển cục bộ, hệ thống bao gồm:
- **Cơ sở dữ liệu & Bộ nhớ đệm (Docker)**:
  - **PostgreSQL 16**: Port `15432` (tránh xung đột với PG mặc định 5432)
  - **Redis 7**: Port `16379` (tránh xung đột với Redis mặc định 6379)
- **Backend (Python / FastAPI)**: Chạy tại `http://localhost:8000`
- **Frontend Người dùng (React / Vite)**: Chạy tại `http://localhost:5173`
- **Frontend Quản trị - Admin (React / Vite)**: Chạy tại `http://localhost:5174`

---

## 2. Khởi chạy nhanh bằng 1 lệnh duy nhất (Khuyên dùng)

Dự án đã có sẵn script tự động hóa toàn bộ việc kiểm tra môi trường, tạo file cấu hình `.env`, cài đặt thư viện và khởi động song song tất cả các dịch vụ:

```bash
./start-dev.sh
```

> **Lưu ý**: Nhấn `Ctrl + C` tại terminal bất kỳ lúc nào để script tự động tắt sạch tất cả các tiến trình Backend, Frontend, Admin một cách an toàn.

---

## 3. Yêu cầu môi trường (Prerequisites)

Dự án có thể chạy hoàn toàn **Native (không cần Docker)** hoặc qua **Docker**:
1. **Cơ sở dữ liệu**:
   - **Cách 1 (Khuyên dùng trên Mac)**: Sử dụng PostgreSQL 16 & Redis cài qua Homebrew (`brew services start postgresql@16`, `brew services start redis`).
   - **Cách 2**: Sử dụng Docker / Docker Desktop nếu không muốn cài native.
2. **Python 3.12+ / 3.13+**: Môi trường chạy Backend.
3. **Node.js 18+ & npm**: Môi trường chạy Frontend & Admin.
4. **FFmpeg**: Bắt buộc để tổng hợp video & âm thanh (`brew install ffmpeg`).

---

## 3. Các bước khởi chạy chi tiết

### Bước 1: Khởi động Cơ sở dữ liệu (PostgreSQL & Redis)

Mở Terminal tại thư mục gốc của project:

```bash
# 1. Tạo file cấu hình môi trường cho hạ tầng
cp deploy/.env.prod.example deploy/.env.prod

# (Tùy chọn) Chỉnh sửa mật khẩu DB nếu cần trong file deploy/.env.prod
# Mặc định: POSTGRES_PORT=15432, REDIS_PORT=16379

# 2. Khởi chạy 2 container Postgres và Redis
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.prod up -d
```

> **Kiểm tra trạng thái**: Chạy `docker ps`, đảm bảo `ai-movie-pg` và `ai-movie-redis` đang ở trạng thái `healthy` hoặc `Up`.

---

### Bước 2: Cài đặt và chạy Backend (FastAPI)

Mở **Terminal thứ 1**:

```bash
cd backend

# 1. Tạo môi trường ảo Python (khuyên dùng)
python3 -m venv .venv
source .venv/bin/activate    # Trên Windows: .venv\Scripts\activate

# 2. Cài đặt các thư viện phụ thuộc
pip install --upgrade pip
pip install -r requirements.txt

# 3. Tạo file cấu hình môi trường
cp .env.example .env

# 4. Khởi chạy server FastAPI ở chế độ reload tự động
uvicorn app.main:app --reload --port 8000
```

> **Gợi ý**:
> - Khi backend khởi chạy lần đầu, nó sẽ tự động tạo bảng (table) và nạp dữ liệu mẫu (seed data) vào cơ sở dữ liệu.
> - **Kiểm tra kết nối**: Mở trình duyệt truy cập [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) hoặc [http://localhost:8000/api/health](http://localhost:8000/api/health).

---

### Bước 3: Cài đặt và chạy Giao diện người dùng (User Web)

Mở **Terminal thứ 2**:

```bash
cd frontend

# 1. Cài đặt dependencies
npm install

# 2. Chạy Vite dev server
npm run dev
```

> Giao diện người dùng sẽ chạy tại: **[http://localhost:5173](http://localhost:5173)**  
> *(Frontend tự động trỏ API request về `http://localhost:8000`)*

---

### Bước 4: Cài đặt và chạy Giao diện quản trị (Admin Web)

Mở **Terminal thứ 3**:

```bash
cd admin

# 1. Cài đặt dependencies
npm install

# 2. Chạy Vite dev server
npm run dev
```

> Giao diện quản trị sẽ chạy tại: **[http://localhost:5174](http://localhost:5174)**  
> *(Admin Vite đã cấu hình proxy tự động chuyển tiếp `/api` và `/static` về `http://127.0.0.1:8000`)*

---

## 4. Cấu hình AI & Mock Mode (Khi chưa có API Key)

PRINTFILM sử dụng API chuẩn TokenFree (New API) cho việc sinh kịch bản LLM, hình ảnh và video.

Nếu bạn chưa có API key và muốn trải nghiệm thử giao diện với dữ liệu giả lập (mock):
1. Mở file `backend/.env`
2. Đổi giá trị:
   ```env
   ARK_MOCK=true
   ```
3. Lưu file, backend sẽ tự nạp lại mà không gọi API tốn phí.

Nếu có API key:
- Điền vào `OPENAI_API_KEY` và `ARK_API_KEY` trong `backend/.env`, hoặc
- Đăng nhập vào trang Admin **[http://localhost:5174](http://localhost:5174)** -> vào mục **Cài đặt hệ thống (System Settings) -> Mô hình (Models)** để cấu hình trực tiếp trên giao diện.

---

## 5. Tạo tài khoản & Cấp quyền Quản trị viên (Admin)

1. Truy cập trang người dùng: [http://localhost:5173/auth](http://localhost:5173/auth) để đăng ký một tài khoản mới bằng Email và Mật khẩu.
2. Mở file `backend/.env` và thêm email vừa đăng ký vào biến:
   ```env
   ADMIN_BOOTSTRAP_EMAILS=your-registered-email@example.com
   ```
3. Khởi động lại tiến trình backend (Terminal 1). Khi backend khởi chạy, tài khoản này sẽ được tự động nâng quyền lên **Admin**.
4. Truy cập [http://localhost:5174](http://localhost:5174) và đăng nhập bằng email trên để vào trang Quản trị.

---

## 6. Tổng hợp địa chỉ truy cập (Ports & URLs)

| Thành phần | Địa chỉ URL | Ghi chú |
| :--- | :--- | :--- |
| **User Frontend** | [http://localhost:5173](http://localhost:5173) | Kho template, tạo kịch bản, sinh video |
| **Admin Dashboard** | [http://localhost:5174](http://localhost:5174) | Quản trị users, tasks, cấu hình models, hệ thống |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI core runtime |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Tài liệu kiểm thử API tương tác |
| **Health Check** | [http://localhost:8000/api/health](http://localhost:8000/api/health) | Kiểm tra trạng thái DB, Redis, Task Runtime |
| **PostgreSQL** | `localhost:15432` | User: `printfilm`, DB: `printfilm` |
| **Redis** | `localhost:16379` | Cache & Task State |

---

## 7. Các lệnh hữu ích & Dừng dịch vụ

### Dừng cơ sở dữ liệu:
```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.prod down
```

### Dừng và xóa toàn bộ dữ liệu database để làm mới:
```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.prod down -v
```

### Xem log của Postgres / Redis:
```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env.prod logs -f
```
