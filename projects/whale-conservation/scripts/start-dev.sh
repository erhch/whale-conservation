#!/bin/bash

# 🐋 生物鲸创管理系统 - 快速启动开发环境
# 一键启动所有依赖服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/docker"

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🐋 鲸创管理系统 - 开发环境启动                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    echo "请先安装 Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"
echo ""

# 检查 docker-compose.yml
if [ ! -f "$DOCKER_DIR/docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml 不存在${NC}"
    exit 1
fi

# 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
echo ""

cd "$DOCKER_DIR"

# 使用 docker compose (v2) 或 docker-compose (v1)
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo -e "${GREEN}✅ 服务启动完成!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}服务访问地址:${NC}"
echo -e "${CYAN}  PostgreSQL:${NC}  localhost:5432 (whale_conservation)"
echo -e "${CYAN}  Redis:${NC}       localhost:6379"
echo -e "${CYAN}  MinIO API:${NC}   localhost:9000"
echo -e "${CYAN}  MinIO Console:${NC} localhost:9001"
echo -e "${CYAN}  Adminer:${NC}     localhost:8080"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}默认凭据:${NC}"
echo "  PostgreSQL: whale_admin / whale_secure_pwd_2026"
echo "  MinIO:      whale_minio_admin / whale_minio_pwd_2026"
echo ""
echo -e "${YELLOW}查看日志:${NC}"
echo "  cd $DOCKER_DIR && docker compose logs -f"
echo ""
echo -e "${YELLOW}停止服务:${NC}"
echo "  cd $DOCKER_DIR && docker compose down"
echo ""
