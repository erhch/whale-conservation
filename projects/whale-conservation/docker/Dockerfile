# 🐋 生物鲸创管理系统 - 后端 Dockerfile
# 基于 Node.js 20 LTS

FROM node:20-alpine AS base

RUN apk add --no-cache python3 make g++ libc6-compat curl

WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ---- Builder ----
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

USER node

CMD ["node", "dist/main.js"]
