#!/usr/bin/env bash

# ==============================================================================
# PRINTFILM - Local Development Startup Script
# Tự động nhận diện Native (Brew) hoặc Docker cho Postgres/Redis,
# sau đó khởi chạy Backend, Frontend và Admin.
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Màu hiển thị console
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${BLUE}====================================================${NC}"
echo -e "${BOLD}${BLUE}       PRINTFILM - Khởi chạy môi trường Dev         ${NC}"
echo -e "${BOLD}${BLUE}====================================================${NC}\n"

# ------------------------------------------------------------------------------
# 1. Kiểm tra các công cụ môi trường
# ------------------------------------------------------------------------------
echo -e "${BLUE}[1/5] Kiểm tra các công cụ hệ thống...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Lỗi: python3 chưa được cài đặt. Vui lòng cài đặt Python 3.12+.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Lỗi: npm / Node.js chưa được cài đặt.${NC}"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Cảnh báo: FFmpeg chưa được cài đặt trên máy.${NC}"
    echo -e "${YELLOW}Tính năng ghép video/âm thanh có thể bị ảnh hưởng.${NC}"
else
    echo -e "${GREEN}✓ FFmpeg đã được cài đặt.${NC}"
fi

# ------------------------------------------------------------------------------
# 2. Kiểm tra & Khởi động cơ sở dữ liệu (Postgres & Redis)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[2/5] Kiểm tra cơ sở dữ liệu (PostgreSQL & Redis)...${NC}"

# Hàm kiểm tra port đang LISTEN
is_port_listening() {
    lsof -iTCP:"$1" -sTCP:LISTEN -n -P &>/dev/null || nc -z 127.0.0.1 "$1" &>/dev/null
}

PG_RUNNING=false
REDIS_RUNNING=false

# Kiểm tra Postgres (cổng 5432 hoặc 15432)
if is_port_listening 5432 || is_port_listening 15432; then
    PG_RUNNING=true
    echo -e "${GREEN}✓ PostgreSQL đang chạy trên máy.${NC}"
fi

# Kiểm tra Redis (cổng 6379 hoặc 16379)
if is_port_listening 6379 || is_port_listening 16379; then
    REDIS_RUNNING=true
    echo -e "${GREEN}✓ Redis đang chạy trên máy.${NC}"
fi

# Nếu chưa chạy, thử khởi động qua Homebrew hoặc Docker
if [ "$PG_RUNNING" = false ] || [ "$REDIS_RUNNING" = false ]; then
    if command -v brew &> /dev/null; then
        echo -e "${YELLOW}Thử khởi động qua Homebrew services...${NC}"
        [ "$PG_RUNNING" = false ] && brew services start postgresql@16 2>/dev/null || true
        [ "$REDIS_RUNNING" = false ] && brew services start redis 2>/dev/null || true
        sleep 2
    fi

    # Kiểm tra lại sau brew
    (is_port_listening 5432 || is_port_listening 15432) && PG_RUNNING=true
    (is_port_listening 6379 || is_port_listening 16379) && REDIS_RUNNING=true

    # Nếu vẫn chưa chạy, thử dùng Docker Compose nếu Docker có mặt
    if [ "$PG_RUNNING" = false ] || [ "$REDIS_RUNNING" = false ]; then
        if command -v docker &> /dev/null && docker info &> /dev/null; then
            echo -e "${YELLOW}Khởi chạy Postgres & Redis qua Docker Compose...${NC}"
            if [ ! -f "deploy/.env.prod" ]; then
                cp deploy/.env.prod.example deploy/.env.prod
            fi
            docker compose -f deploy/docker-compose.yml --env-file deploy/.env.prod up -d
            sleep 2
            PG_RUNNING=true
            REDIS_RUNNING=true
        else
            echo -e "${RED}Lỗi: Không tìm thấy PostgreSQL hoặc Redis đang chạy, và Docker cũng chưa được bật.${NC}"
            echo -e "${RED}Vui lòng chạy 'brew services start postgresql@16' và 'brew services start redis' hoặc bật Docker Desktop.${NC}"
            exit 1
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 3. Chuẩn bị môi trường Backend (FastAPI)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[3/5] Chuẩn bị môi trường Backend...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Tạo backend/.env từ backend/.env.example...${NC}"
    cp .env.example .env
fi

if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Khởi tạo virtual environment .venv...${NC}"
    python3 -m venv .venv
    source .venv/bin/activate
    echo -e "Cài đặt Python dependencies..."
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
else
    source .venv/bin/activate
fi

cd "$PROJECT_ROOT"

# ------------------------------------------------------------------------------
# 4. Chuẩn bị Frontend (User & Admin)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[4/5] Kiểm tra dependencies Frontend & Admin...${NC}"

if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}Đang cài đặt node_modules cho Frontend...${NC}"
    (cd "$PROJECT_ROOT/frontend" && npm install)
fi

if [ ! -d "$PROJECT_ROOT/admin/node_modules" ]; then
    echo -e "${YELLOW}Đang cài đặt node_modules cho Admin...${NC}"
    (cd "$PROJECT_ROOT/admin" && npm install)
fi

# ------------------------------------------------------------------------------
# 5. Khởi chạy tất cả các tiến trình
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}[5/5] Khởi chạy các dịch vụ...${NC}"

BACKEND_PID=""
FRONTEND_PID=""
ADMIN_PID=""

cleanup() {
    echo -e "\n\n${YELLOW}Đang tắt các tiến trình đang chạy...${NC}"
    
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "Dừng Backend API (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "Dừng Frontend Web (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    if [ -n "$ADMIN_PID" ] && kill -0 "$ADMIN_PID" 2>/dev/null; then
        echo -e "Dừng Admin Web (PID: $ADMIN_PID)..."
        kill "$ADMIN_PID" 2>/dev/null || true
    fi

    echo -e "${GREEN}Đã tắt toàn bộ các dịch vụ. Hẹn gặp lại!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Chạy Backend FastAPI
(
    cd "$PROJECT_ROOT/backend"
    source .venv/bin/activate
    exec uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!

# 2. Chạy Frontend (User Web)
(
    cd "$PROJECT_ROOT/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!

# 3. Chạy Admin Web
(
    cd "$PROJECT_ROOT/admin"
    exec npm run dev
) &
ADMIN_PID=$!

sleep 3

echo -e "\n${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}   PRINTFILM đã khởi chạy thành công tất cả dịch vụ!            ${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e " ${BOLD}User Web:${NC}        ${BLUE}http://localhost:5173${NC}"
echo -e " ${BOLD}Admin Web:${NC}       ${BLUE}http://localhost:5174${NC}"
echo -e " ${BOLD}Backend API:${NC}     ${BLUE}http://localhost:8000${NC}"
echo -e " ${BOLD}Swagger Docs:${NC}    ${BLUE}http://localhost:8000/docs${NC}"
echo -e " ${BOLD}Health Check:${NC}    ${BLUE}http://localhost:8000/api/health${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${YELLOW}Nhấn [Ctrl + C] bất kỳ lúc nào để dừng toàn bộ hệ thống.${NC}\n"

wait
