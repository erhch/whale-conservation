# Scripts - 脚本工具

本目录包含项目开发和部署用的辅助脚本。

## 目录结构

```
scripts/
├── init-db.sh      # 数据库初始化脚本
└── start-dev.sh    # 开发环境启动脚本
```

---

## 📜 init-db.sh - 数据库初始化

**用途:** 初始化 PostgreSQL 数据库，创建数据库用户、数据库和基础表结构。

**执行方式:**

```bash
# 本地开发环境
./scripts/init-db.sh

# 或者
bash scripts/init-db.sh
```

**功能:**

1. 创建数据库用户 `whale_user` (如果不存在)
2. 创建数据库 `whale_conservation` (如果不存在)
3. 授予用户数据库权限
4. 运行 Prisma migrations 创建表结构
5. 可选：运行种子数据 (seeds)

**环境变量:**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | `localhost` | 数据库主机 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_NAME` | `whale_conservation` | 数据库名称 |
| `DB_USER` | `whale_user` | 数据库用户 |
| `DB_PASSWORD` | `whale_password` | 数据库密码 |
| `RUN_SEEDS` | `false` | 是否运行种子数据 |

**使用示例:**

```bash
# 使用默认配置初始化
./scripts/init-db.sh

# 自定义数据库配置
DB_HOST=192.168.1.100 DB_PASSWORD=secure_password ./scripts/init-db.sh

# 初始化并加载种子数据
RUN_SEEDS=true ./scripts/init-db.sh
```

**注意事项:**

- ⚠️ 需要 PostgreSQL 已安装并可访问
- ⚠️ 执行脚本的用户需要有创建数据库的权限
- ✅ 幂等操作：重复执行不会报错 (会检查是否存在)

---

## 🚀 start-dev.sh - 开发环境启动

**用途:** 启动开发环境，包括热重载和调试模式。

**执行方式:**

```bash
# 本地开发
./scripts/start-dev.sh

# 或者
bash scripts/start-dev.sh
```

**功能:**

1. 检查 Node.js 版本 (需要 v18+)
2. 安装依赖 (如果 node_modules 不存在)
3. 复制 `.env.example` 到 `.env` (如果 `.env` 不存在)
4. 启动 NestJS 开发服务器 (热重载)

**启动模式:**

| 模式 | 命令 | 说明 |
|------|------|------|
| 默认 | `./start-dev.sh` | NestJS CLI 热重载模式 |
| 调试 | `DEBUG=true ./start-dev.sh` | 启用调试日志 |
| 生产 | `npm run build && npm run start:prod` | 生产构建后启动 |

**环境变量:**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEBUG` | `false` | 启用调试模式 |
| `PORT` | `3000` | 服务器端口 |
| `SKIP_INSTALL` | `false` | 跳过依赖安装 |

**使用示例:**

```bash
# 标准开发模式
./scripts/start-dev.sh

# 调试模式 (详细日志)
DEBUG=true ./scripts/start-dev.sh

# 自定义端口
PORT=3001 ./scripts/start-dev.sh

# 跳过依赖安装 (已安装时)
SKIP_INSTALL=true ./scripts/start-dev.sh
```

**输出示例:**

```
🐋 生物鲸创管理系统 - 开发环境启动

✓ Node.js 版本检查通过 (v20.11.0)
✓ 依赖已安装
✓ .env 配置文件已就绪

🚀 启动开发服务器...
[Nest] 12345  - 03/31/2026, 5:00:00 PM     LOG NestFactory successfully initialized your application!
[Nest] 12345  - 03/31/2026, 5:00:00 PM     LOG Nest application successfully started

📡 服务器运行在：http://localhost:3000
📚 API 文档：http://localhost:3000/api
🔍 健康检查：http://localhost:3000/health
```

**注意事项:**

- ⚠️ 首次运行需要较长时间安装依赖
- ⚠️ 确保 3000 端口未被占用
- ✅ 支持热重载：修改代码后自动重启

---

## 🔧 常见问题

### 1. 脚本没有执行权限

```bash
chmod +x scripts/*.sh
```

### 2. 数据库连接失败

检查 PostgreSQL 是否运行：

```bash
# macOS
brew services list | grep postgresql

# Linux
systemctl status postgresql

# Docker
docker ps | grep postgres
```

### 3. 端口被占用

```bash
# 查看占用 3000 端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用其他端口
PORT=3001 ./scripts/start-dev.sh
```

### 4. 依赖安装失败

```bash
# 清理缓存后重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📝 最佳实践

1. **首次设置:** 运行 `./scripts/init-db.sh` 初始化数据库
2. **日常开发:** 运行 `./scripts/start-dev.sh` 启动开发服务器
3. **调试问题:** 使用 `DEBUG=true` 启用详细日志
4. **团队协作:** 将自定义配置写入 `.env` (不要提交到 git)

---

*最后更新：2026-03-31*
