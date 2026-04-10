# 🚀 部署指南

> 鲸创管理系统 v4.0.0 — 20 个后端模块，~95 个 API 端点

## 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Docker | 20.10+ | 推荐一键部署 |
| Node.js | 18+ | 手动部署需要 |
| PostgreSQL | 14+ | 带 PostGIS 扩展 |

---

## 方式一：Docker Compose 一键部署（推荐）

```bash
cd projects/whale-conservation/docker
docker compose up -d
```

启动后服务地址：
- **API**: http://localhost:3000
- **Swagger 文档**: http://localhost:3000/api
- **数据库管理**: http://localhost:8080
- **MinIO 控制台**: http://localhost:9001

停止：
```bash
docker compose down
```

完整清理（含数据卷）：
```bash
docker compose down -v
```

---

## 方式二：手动部署

### 1. 安装依赖

```bash
cd projects/whale-conservation/src
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

最少需要修改：
```env
WHALE_DB_HOST=localhost
WHALE_DB_PASSWORD=<你的密码>
JWT_SECRET=<随机字符串>
```

### 3. 数据库初始化

```bash
# 创建数据库
createdb -h localhost -U postgres whale_conservation

# 运行迁移（按顺序）
psql -h localhost -U postgres -d whale_conservation -f ../database/migrations/001_initial_schema.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/migrations/002_phase2_individual_tracking.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/migrations/003_phase2_genealogy.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/migrations/004_phase5_audit.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/migrations/005_phase7_notifications.sql

# 种子数据（可选）
psql -h localhost -U postgres -d whale_conservation -f ../database/seeds/001_initial_data.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/seeds/002_phase2_sample_data.sql
psql -h localhost -U postgres -d whale_conservation -f ../database/seeds/003_phase2_genealogy_sample_data.sql
```

### 4. 构建 & 启动

```bash
npm run build
npm run start:prod
```

---

## 数据库迁移清单

| 文件 | 模块 | 状态 |
|------|------|------|
| `001_initial_schema.sql` | Phase 1: 基础架构 | ✅ |
| `002_phase2_individual_tracking.sql` | Phase 2: 个体追踪 | ✅ |
| `003_phase2_genealogy.sql` | Phase 2: 谱系管理 | ✅ |
| `004_phase5_audit.sql` | Phase 5: 审计日志 | ✅ |
| `005_phase7_notifications.sql` | Phase 7: 通知告警 | ✅ |

---

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | API 端口 | `3000` |
| `CORS_ORIGIN` | CORS 白名单 | `*` |
| `WHALE_DB_HOST` | 数据库主机 | `localhost` |
| `WHALE_DB_PORT` | 数据库端口 | `5432` |
| `WHALE_DB_USER` | 数据库用户 | `postgres` |
| `WHALE_DB_PASSWORD` | 数据库密码 | `postgres` |
| `WHALE_DB_NAME` | 数据库名 | `whale_conservation` |
| `JWT_SECRET` | JWT 密钥 | (必须修改) |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `1h` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `MINIO_ENDPOINT` | MinIO 地址 | `localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO 密钥 | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO 密码 | `minioadmin` |

---

## 安全清单

- [ ] 修改数据库默认密码
- [ ] 修改 JWT_SECRET（生产环境必须）
- [ ] 修改 MinIO 默认凭据
- [ ] 设置 CORS_ORIGIN 为前端域名
- [ ] 启用 HTTPS（Nginx/Traefik 反向代理）
- [ ] 配置定期数据库备份（pg_dump）
- [ ] 限制管理端点访问（防火墙）
