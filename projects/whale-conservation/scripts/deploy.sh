#!/bin/bash
# 🐋 鲸创管理系统 - 一键部署脚本
# 用法: ./scripts/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_DIR/src"
DOCKER_DIR="$PROJECT_DIR/docker"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐋 鲸创管理系统 v4.0.0 部署脚本${NC}"
echo "================================"

# 检查 Docker
if ! command -v docker &>/dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 启动服务...${NC}"
cd "$DOCKER_DIR"
docker compose up -d

echo ""
echo -e "${YELLOW}⏳ 等待服务就绪...${NC}"
sleep 10

# 检查服务状态
echo -e "${YELLOW}🔍 服务状态:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo "📍 服务地址:"
echo "   API:      http://localhost:3000"
echo "   Swagger:  http://localhost:3000/api"
echo "   数据库管理: http://localhost:8080"
echo "   MinIO:    http://localhost:9001"
echo ""
echo "📋 查看日志: docker compose logs -f"
echo "🛑 停止服务: docker compose down"
