#!/bin/bash

# 🐋 生物鲸创管理系统 - 数据库初始化脚本
# 用于快速部署和测试数据库架构

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DB_NAME=${WHALR_DB_NAME:-"whale_conservation"}
DB_USER=${WHALR_DB_USER:-"whale_admin"}
DB_PASSWORD=${WHALR_DB_PASSWORD:-"whale_secure_pwd_2026"}
DB_HOST=${WHALR_DB_HOST:-"localhost"}
DB_PORT=${WHALR_DB_PORT:-"5432"}

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
SEEDS_DIR="$PROJECT_ROOT/database/seeds"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🐋 生物鲸创管理系统 - 数据库初始化                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查 PostgreSQL 连接
check_connection() {
    echo -e "${YELLOW}📡 检查数据库连接...${NC}"
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✅ 数据库连接成功${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        echo "请检查以下配置:"
        echo "  - 主机：$DB_HOST"
        echo "  - 端口：$DB_PORT"
        echo "  - 用户：$DB_USER"
        echo "  - 密码：$DB_PASSWORD"
        echo ""
        echo "可以通过环境变量自定义:"
        echo "  export WHALE_DB_HOST=localhost"
        echo "  export WHALE_DB_USER=your_user"
        echo "  export WHALE_DB_PASSWORD=your_password"
        exit 1
    fi
}

# 创建数据库
create_database() {
    echo -e "${YELLOW}📦 创建数据库：$DB_NAME${NC}"
    
    # 检查数据库是否已存在
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
        echo -e "${YELLOW}⚠️  数据库已存在，是否删除重建？(y/N)${NC}"
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}🗑️  删除旧数据库...${NC}"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
        else
            echo -e "${YELLOW}⏭️  跳过数据库创建，使用现有数据库${NC}"
            return
        fi
    fi
    
    echo -e "${GREEN}🆕 创建新数据库...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✅ 数据库创建成功${NC}"
}

# 运行迁移
run_migrations() {
    echo -e "${YELLOW}🔧 运行数据库迁移...${NC}"
    
    # 按顺序执行迁移文件
    for migration_file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
        filename=$(basename "$migration_file")
        echo -e "  📄 执行：$filename"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
    done
    
    echo -e "${GREEN}✅ 迁移完成${NC}"
}

# 运行种子数据
run_seeds() {
    echo -e "${YELLOW}🌱 加载种子数据...${NC}"
    
    if [ -d "$SEEDS_DIR" ] && [ "$(ls -A $SEEDS_DIR/*.sql 2>/dev/null)" ]; then
        for seed_file in $(ls "$SEEDS_DIR"/*.sql 2>/dev/null | sort); do
            filename=$(basename "$seed_file")
            echo -e "  📄 加载：$filename"
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$seed_file"
        done
        echo -e "${GREEN}✅ 种子数据加载完成${NC}"
    else
        echo -e "${YELLOW}⚠️  没有找到种子数据文件${NC}"
    fi
}

# 验证安装
verify_installation() {
    echo -e "${YELLOW}🔍 验证数据库安装...${NC}"
    
    # 检查表是否存在
    TABLES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    echo -e "  📊 数据表数量：$TABLES"
    
    # 显示所有表
    echo -e "${BLUE}  表列表:${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" | head -20
    
    # 检查物种数据
    SPECIES_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM species;" 2>/dev/null || echo "0")
    echo -e "  🐋 物种数据：$SPECIES_COUNT 条"
    
    echo -e "${GREEN}✅ 验证完成${NC}"
}

# 显示连接信息
show_connection_info() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           🎉 数据库初始化完成！                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}数据库连接信息:${NC}"
    echo "  主机：$DB_HOST:$DB_PORT"
    echo "  数据库：$DB_NAME"
    echo "  用户：$DB_USER"
    echo ""
    echo -e "${YELLOW}连接字符串:${NC}"
    echo "  PostgreSQL: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo -e "${YELLOW}下一步:${NC}"
    echo "  1. 启动 API 服务"
    echo "  2. 配置环境变量 DATABASE_URL"
    echo "  3. 运行测试：npm test"
    echo ""
}

# 主流程
main() {
    echo -e "${YELLOW}🚀 开始初始化数据库...${NC}"
    echo ""
    
    check_connection
    create_database
    run_migrations
    
    # 可选：加载种子数据
    if [ "$1" == "--with-seeds" ]; then
        run_seeds
    fi
    
    verify_installation
    show_connection_info
}

# 显示帮助
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "用法：$0 [选项]"
    echo ""
    echo "选项:"
    echo "  --with-seeds    同时加载种子数据"
    echo "  --help, -h      显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  WHALE_DB_NAME       数据库名称 (默认：whale_conservation)"
    echo "  WHALE_DB_USER       数据库用户 (默认：whale_admin)"
    echo "  WHALE_DB_PASSWORD   数据库密码 (默认：whale_secure_pwd_2026)"
    echo "  WHALE_DB_HOST       数据库主机 (默认：localhost)"
    echo "  WHALE_DB_PORT       数据库端口 (默认：5432)"
    exit 0
fi

# 执行主流程
main "$@"
