# Makefile for 鲸创管理系统

.PHONY: help install dev build start test docker-up docker-down db-migrate db-seed lint

help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## 安装依赖
	cd projects/whale-conservation/src && npm install

dev: ## 开发模式启动
	cd projects/whale-conservation/src && npm run start:dev

build: ## 构建生产版本
	cd projects/whale-conservation/src && npm run build

start: ## 生产模式启动
	cd projects/whale-conservation/src && npm run start:prod

test: ## 运行测试
	cd projects/whale-conservation/src && npm test

lint: ## 代码检查
	cd projects/whale-conservation/src && npm run lint

docker-up: ## 启动 Docker 环境
	cd projects/whale-conservation/docker && docker-compose up -d

docker-down: ## 停止 Docker 环境
	cd projects/whale-conservation/docker && docker-compose down

docker-logs: ## 查看 Docker 日志
	cd projects/whale-conservation/docker && docker-compose logs -f api

db-migrate: ## 运行数据库迁移
	@echo "Running migrations..."
	@for f in projects/whale-conservation/database/migrations/*.sql; do \
		echo "Applying $$f..."; \
		docker exec -i whale-postgres psql -U whale_admin -d whale_conservation < "$$f" 2>/dev/null || \
		echo "Skipped (DB not running or migration already applied)"; \
	done

db-seed: ## 运行种子数据
	@echo "Seeding data..."
	@for f in projects/whale-conservation/database/seeds/*.sql; do \
		echo "Seeding $$f..."; \
		docker exec -i whale-postgres psql -U whale_admin -d whale_conservation < "$$f" 2>/dev/null || \
		echo "Skipped (DB not running)"; \
	done

docker-clean: ## 清理 Docker 环境 (含数据)
	cd projects/whale-conservation/docker && docker-compose down -v
