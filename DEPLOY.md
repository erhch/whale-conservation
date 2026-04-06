# 🚀 部署指南

## 快速部署 (Docker Compose)

```bash
cd docker
docker-compose up -d
```

服务启动后：
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **数据库管理**: http://localhost:8080
- **MinIO 控制台**: http://localhost:9001

## 手动部署

### 1. 安装依赖

```bash
cd src
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，修改数据库连接、JWT 密钥等
```

### 3. 数据库迁移

```bash
# 连接 PostgreSQL 并运行迁移文件
psql -h localhost -U whale_admin -d whale_conservation -f ../database/migrations/001_initial_schema.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/migrations/002_phase2_individual_tracking.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/migrations/003_phase2_genealogy.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/migrations/004_phase5_audit.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/migrations/005_phase7_notifications.sql
```

### 4. 种子数据（可选）

```bash
psql -h localhost -U whale_admin -d whale_conservation -f ../database/seeds/001_initial_data.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/seeds/002_phase2_sample_data.sql
psql -h localhost -U whale_admin -d whale_conservation -f ../database/seeds/003_phase2_genealogy_sample_data.sql
```

### 5. 启动

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | API 端口 | `3000` |
| `WHALE_DB_HOST` | 数据库主机 | `localhost` |
| `WHALE_DB_PORT` | 数据库端口 | `5432` |
| `WHALE_DB_USER` | 数据库用户 | `postgres` |
| `WHALE_DB_PASSWORD` | 数据库密码 | `postgres` |
| `WHALE_DB_NAME` | 数据库名 | `whale_conservation` |
| `JWT_SECRET` | JWT 密钥 | (需修改) |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `1h` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |

## 安全建议

1. **修改默认密码**: 数据库、JWT 密钥、MinIO 凭据
2. **启用 HTTPS**: 生产环境使用反向代理 (Nginx/Traefik)
3. **限制 CORS**: 设置 `CORS_ORIGIN` 为前端域名
4. **定期备份**: 使用 `pg_dump` 定期备份数据库
