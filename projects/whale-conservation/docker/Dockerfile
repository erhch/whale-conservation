# 🐋 生物鲸创管理系统 - 后端 Dockerfile
# 基于 Node.js 20 LTS

FROM node:20-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用 (如果有构建步骤)
# RUN npm run build

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "src/api/index.js"]

# ============================================
# 开发镜像 (可选)
# ============================================
FROM base AS development

ENV NODE_ENV=development

RUN npm install

CMD ["npm", "run", "dev"]

# ============================================
# 生产镜像
# ============================================
FROM base AS production

ENV NODE_ENV=production

USER node

CMD ["node", "src/api/index.js"]
