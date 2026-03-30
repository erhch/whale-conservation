# 🐳 Docker 部署指南

> 生物鲸创管理系统 - Docker 容器化部署方案

**版本:** 1.0.0  
**最后更新:** 2026-03-30  
**状态:** ✅ 完成

---

## 📋 概述

本目录包含完整的 Docker 容器化部署配置，支持：

- ✅ **一键启动开发环境** - 包含所有依赖服务
- ✅ **多阶段构建** - 优化生产镜像大小
- ✅ **健康检查** - 自动监控服务状态
- ✅ **数据持久化** - 卷挂载保护数据

---

## 🏗️ 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose 环境                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   API 服务   │  │   Adminer   │  │    MinIO    │         │
│  │  (Node.js)  │  │  (数据库 UI) │  │  (对象存储)  │         │
│  │   :3000     │  │   :8080     │  │ :9000/:9001 │         │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘         │
│         │                                  │                 │
│  ┌──────┴─────────────────────────────────┴──────┐         │
│  │            whale-network (桥接网络)            │         │
│  └──────┬─────────────────────────────────┬──────┘         │
│         │                                  │                 │
│  ┌──────┴──────┐                  ┌───────┴───────┐        │
│  │  PostgreSQL │                  │     Redis     │        │
│  │  + Timescale│                  │    (缓存)     │        │
│  │   :5432     │                  │    :6379      │        │
│  └─────────────┘                  └───────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 1. 启动开发环境

```bash
# 进入 docker 目录
cd docker

# 启动所有服务 (后台运行)
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f postgres
docker-compose logs -f api
```

### 3. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷 (⚠️ 会删除所有数据)
docker-compose down -v
```

---

## 📦 服务说明

### PostgreSQL (主数据库)

| 配置项 | 值 |
|--------|-----|
| **镜像** | `timescale/timescaledb-ha:pg16` |
| **端口** | `5432` |
| **数据库** | `whale_conservation` |
| **用户** | `whale_admin` |
| **密码** | `whale_secure_pwd_2026` |
| **扩展** | PostGIS, TimescaleDB |

**连接字符串:**
```
postgresql://whale_admin:whale_secure_pwd_2026@localhost:5432/whale_conservation
```

**特性:**
- ✅ 支持地理空间数据 (PostGIS)
- ✅ 支持时序数据 (TimescaleDB)
- ✅ 自动初始化 migrations 和 seeds

---

### Redis (缓存)

| 配置项 | 值 |
|--------|-----|
| **镜像** | `redis:7-alpine` |
| **端口** | `6379` |
| **持久化** | AOF 模式 |

**连接信息:**
```
redis://localhost:6379
```

**用途:**
- API 响应缓存
- 会话存储
- 速率限制计数器

---

### MinIO (对象存储)

| 配置项 | 值 |
|--------|-----|
| **镜像** | `minio/minio:latest` |
| **API 端口** | `9000` |
| **Console 端口** | `9001` |
| **用户名** | `whale_minio_admin` |
| **密码** | `whale_minio_pwd_2026` |

**访问地址:**
- API: `http://localhost:9000`
- Console: `http://localhost:9001`

**用途:**
- 鲸鱼照片存储
- 观测视频存储
- 文档附件存储

---

### Adminer (数据库管理)

| 配置项 | 值 |
|--------|-----|
| **镜像** | `adminer:latest` |
| **端口** | `8080` |
| **主题** | lucca |

**访问地址:** `http://localhost:8080`

**登录信息:**
- 系统：PostgreSQL
- 服务器：postgres
- 用户名：whale_admin
- 密码：whale_secure_pwd_2026
- 数据库：whale_conservation

---

## ⚙️ 配置说明

### 环境变量

创建 `.env` 文件 (可选，用于覆盖默认配置):

```bash
# .env
POSTGRES_PASSWORD=your_secure_password
MINIO_ROOT_PASSWORD=your_minio_password
JWT_SECRET=your_jwt_secret_key
```

### 数据卷

| 卷名 | 用途 | 挂载路径 |
|------|------|----------|
| `postgres_data` | PostgreSQL 数据 | `/var/lib/postgresql/data` |
| `redis_data` | Redis 数据 | `/data` |
| `minio_data` | MinIO 对象存储 | `/data` |

### 初始化脚本

自动执行的初始化脚本:

| 路径 | 说明 |
|------|------|
| `../database/migrations/` | 数据库迁移脚本 |
| `../database/seeds/` | 初始数据种子 |

---

## 🔧 常用命令

### 容器管理

```bash
# 重启特定服务
docker-compose restart postgres

# 进入容器 shell
docker-compose exec postgres sh
docker-compose exec redis redis-cli

# 查看容器资源使用
docker stats
```

### 数据库操作

```bash
# 进入 PostgreSQL 交互式终端
docker-compose exec postgres psql -U whale_admin -d whale_conservation

# 执行 SQL 文件
docker-compose exec -T postgres psql -U whale_admin -d whale_conservation < backup.sql

# 导出数据库
docker-compose exec -T postgres pg_dump -U whale_admin whale_conservation > backup.sql

# 导入数据库
docker-compose exec -T postgres psql -U whale_admin -d whale_conservation < backup.sql
```

### MinIO 操作

```bash
# 使用 mc 客户端 (需先安装)
mc alias set whale http://localhost:9000 whale_minio_admin whale_minio_pwd_2026
mc ls whale
mc mb whale/whale-photos
mc cp photo.jpg whale/whale-photos/
```

---

## 🏭 生产部署

### 生产环境配置

**1. 修改密码 (必须!)**

```yaml
# docker-compose.prod.yml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # 使用环境变量
  
  minio:
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
```

**2. 启用 HTTPS**

使用 Nginx 反向代理:

```nginx
# nginx.conf
server {
    listen 443 ssl;
    server_name api.whale-conservation.org;
    
    ssl_certificate /etc/ssl/certs/whale.crt;
    ssl_certificate_key /etc/ssl/private/whale.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**3. 配置防火墙**

```bash
# 仅开放必要端口
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH
ufw deny 5432/tcp   # 数据库不对外开放
ufw deny 6379/tcp   # Redis 不对外开放
ufw deny 9000/tcp   # MinIO 不对外开放
```

**4. 设置资源限制**

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
  
  postgres:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
```

---

## 📊 监控与维护

### 健康检查

所有服务都配置了健康检查:

```bash
# 检查服务健康状态
docker-compose ps

# 手动检查 API 健康
curl http://localhost:3000/health

# 检查 PostgreSQL 健康
docker-compose exec postgres pg_isready
```

### 日志轮转

配置 Docker 日志轮转 (防止磁盘占满):

```yaml
# docker-compose.yml
services:
  postgres:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 备份策略

```bash
#!/bin/bash
# backup.sh - 每日备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/whale-conservation"

# 备份数据库
docker-compose exec -T postgres pg_dump -U whale_admin whale_conservation > \
  ${BACKUP_DIR}/db_${DATE}.sql

# 备份 MinIO 数据
mc mirror whale/whale-photos ${BACKUP_DIR}/minio_photos_${DATE}

# 删除 30 天前的备份
find ${BACKUP_DIR} -name "*.sql" -mtime +30 -delete
find ${BACKUP_DIR} -name "minio_*" -mtime +30 -delete
```

**Cron 配置:**
```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 🐛 故障排查

### 常见问题

**1. PostgreSQL 无法启动**

```bash
# 查看日志
docker-compose logs postgres

# 检查端口占用
lsof -i :5432

# 重启服务
docker-compose restart postgres
```

**2. 数据库连接失败**

```bash
# 测试连接
docker-compose exec postgres pg_isready -U whale_admin

# 检查网络
docker-compose exec postgres ping redis
```

**3. 磁盘空间不足**

```bash
# 查看 Docker 磁盘使用
docker system df

# 清理未使用的容器/网络/镜像
docker system prune -a

# 查看卷大小
docker system df -v
```

**4. 内存不足**

```bash
# 查看容器内存使用
docker stats --no-stream

# 限制容器内存
docker-compose up -d --scale api=1
```

---

## 🔗 相关文档

- [开发环境搭建](../docs/development-setup.md) - 本地开发配置
- [数据库设计](../database/README.md) - 数据库架构说明
- [API 文档](../docs/api-design.md) - API 接口规范
- [健康检查](../src/health/README.md) - 健康检查端点说明

---

## 📝 更新日志

- **2026-03-30**: 初始版本 - 完整的 Docker 部署文档

---

<div align="center">
  <sub>最后更新：2026-03-30</sub>
</div>
