# 🛠️ Development Setup Guide - 开发环境搭建指南

> 快速搭建鲸创管理系统的本地开发环境

**最后更新:** 2026-03-30  
**适用版本:** 0.1.0+

---

## 📋 目录

1. [环境要求](#环境要求)
2. [快速开始 (推荐)](#快速开始推荐)
3. [手动搭建](#手动搭建)
4. [常见问题](#常见问题)
5. [开发工作流](#开发工作流)

---

## 环境要求

### 必需软件

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20.x+ | 运行时环境 |
| npm / pnpm | 9.x+ / 8.x+ | 包管理器 |
| Git | 2.x+ | 版本控制 |

### 可选软件

| 软件 | 版本 | 说明 |
|------|------|------|
| Docker | 24.x+ | 容器化部署 (推荐) |
| Docker Compose | 2.x+ | 多容器编排 |
| PostgreSQL | 15.x+ | 本地数据库 (不用 Docker 时需要) |
| Redis | 7.x+ | 本地缓存 (不用 Docker 时需要) |

---

## 快速开始 (推荐)

### 1. 克隆项目

```bash
git clone https://github.com/erhch/whale-conservation.git
cd whale-conservation
```

### 2. 启动基础设施 (Docker)

```bash
# 进入项目根目录
cd whale-conservation

# 启动 PostgreSQL, Redis, MinIO
docker-compose up -d

# 查看容器状态
docker-compose ps

# 查看日志 (可选)
docker-compose logs -f postgres
```

**验证服务:**

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | `localhost:5432` | 数据库 |
| Redis | `localhost:6379` | 缓存 |
| MinIO | `localhost:9000` | 对象存储 API |
| MinIO Console | `localhost:9001` | 对象存储管理界面 |
| Adminer | `localhost:8080` | 数据库管理界面 |

### 3. 安装依赖

```bash
cd src
npm install
# 或
pnpm install
```

### 4. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置 (通常默认值即可)
vim .env
```

**关键配置项:**

```env
# 数据库 (Docker 默认配置)
WHALE_DB_HOST=localhost
WHALE_DB_PORT=5432
WHALE_DB_USER=whale_admin
WHALE_DB_PASSWORD=whale_secure_pwd_2026
WHALE_DB_NAME=whale_conservation

# JWT (开发环境可保持默认)
JWT_SECRET=whale-conservation-secret-key-change-in-production
JWT_EXPIRES_IN=1h
```

### 5. 运行数据库迁移

```bash
# 方式 1: 使用 Docker 初始化 (推荐)
# 迁移脚本会自动在容器启动时执行

# 方式 2: 手动执行 (如果需要)
psql -h localhost -U whale_admin -d whale_conservation -f database/migrations/001_initial_schema.sql
psql -h localhost -U whale_admin -d whale_conservation -f database/seeds/001_initial_data.sql
```

### 6. 启动开发服务器

```bash
cd src

# 开发模式 (热重载)
npm run start:dev

# 或调试模式
npm run start:debug
```

**访问 API:**

- Swagger UI: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/v1/health

---

## 手动搭建

不使用 Docker 的完整手动配置流程。

### 1. 安装 PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**

```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. 创建数据库和用户

```bash
sudo -u postgres psql

CREATE DATABASE whale_conservation;
CREATE USER whale_admin WITH PASSWORD 'whale_secure_pwd_2026';
GRANT ALL PRIVILEGES ON DATABASE whale_conservation TO whale_admin;
\c whale_conservation
GRANT ALL ON SCHEMA public TO whale_admin;
\q
```

### 3. 安装 PostGIS 扩展

```bash
# Ubuntu/Debian
sudo apt install postgis

# macOS
brew install postgis
```

```bash
psql -U whale_admin -d whale_conservation

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### 4. 安装 Redis

**Ubuntu/Debian:**

```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**

```bash
brew install redis
brew services start redis
```

### 5. 运行迁移和种子数据

```bash
psql -h localhost -U whale_admin -d whale_conservation -f database/migrations/001_initial_schema.sql
psql -h localhost -U whale_admin -d whale_conservation -f database/seeds/001_initial_data.sql
```

### 6. 启动应用

```bash
cd src
npm install
cp .env.example .env
npm run start:dev
```

---

## 常见问题

### ❌ 端口被占用

**问题:** `Error: listen EADDRINUSE: address already in use :::3000`

**解决:**

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或修改端口
# 编辑 src/.env，设置 PORT=3001
```

### ❌ 数据库连接失败

**问题:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**排查:**

```bash
# 检查 PostgreSQL 是否运行
sudo systemctl status postgresql

# 检查 Docker 容器
docker-compose ps

# 测试连接
psql -h localhost -U whale_admin -d whale_conservation
```

### ❌ PostGIS 扩展未安装

**问题:** `type "geography" does not exist`

**解决:**

```bash
psql -U whale_admin -d whale_conservation

CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### ❌ JWT 认证失败

**问题:** `Unauthorized` 或 `Invalid token`

**排查:**

1. 检查 `.env` 中 `JWT_SECRET` 是否一致
2. 确认请求头格式: `Authorization: Bearer <token>`
3. 检查 token 是否过期 (默认 1 小时)

### ❌ 热重载不生效

**问题:** 修改代码后服务器未自动重启

**解决:**

```bash
# 清理缓存
rm -rf node_modules/.cache
rm -rf dist

# 重新启动
npm run start:dev
```

---

## 开发工作流

### 推荐工具

| 工具 | 用途 |
|------|------|
| VS Code | 编辑器 |
| Postman / Insomnia | API 测试 |
| DBeaver / pgAdmin | 数据库管理 |
| Docker Desktop | 容器管理 |
| GitKraken / SourceTree | Git GUI |

### VS Code 推荐插件

- ESLint
- Prettier
- NestJS Snippets
- REST Client
- Docker
- PostgreSQL Explorer

### 常用命令

```bash
# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test

# 测试覆盖率
npm run test:cov

# 构建生产版本
npm run build

# E2E 测试
npm run test:e2e
```

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add your feature description"

# 推送分支
git push origin feature/your-feature-name

# 创建 Pull Request
# 在 GitHub 上创建 PR 并请求审查
```

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

| 类型 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | 修复 bug |
| `docs:` | 文档更新 |
| `style:` | 代码格式 (不影响功能) |
| `refactor:` | 重构 |
| `test:` | 测试相关 |
| `chore:` | 构建/工具/配置 |

**示例:**

```bash
git commit -m "feat(sightings): add geolocation filtering for sightings"
git commit -m "fix(auth): resolve JWT expiration handling issue"
git commit -m "docs(common): add ParseCoordinatePipe documentation"
```

---

## 📞 需要帮助?

- 📖 查看 [API Design](./api-design.md) 了解接口规范
- 📝 查看 [API Examples](./api-examples.md) 了解使用示例
- 🗄️ 查看 [Database Design](./database-design.md) 了解数据结构
- 📚 查看 [Common Quickstart](./common-quickstart.md) 了解公共模块

---

**祝开发愉快! 🐋**
