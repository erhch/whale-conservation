# 🏥 Health Module - 健康检查模块

> 应用健康状态监控与诊断接口

## 📖 模块概述

Health 模块提供完整的健康检查功能，用于监控应用的运行状态、数据库连接和系统资源使用情况。适用于负载均衡器、容器编排系统 (Kubernetes/Docker Swarm) 和应用监控。

### 核心功能

- ✅ **数据库健康检查** - 验证 TypeORM 数据库连接状态
- ✅ **内存健康检查** - 监控堆内存 (Heap) 和常驻内存 (RSS) 使用
- ✅ **简化存活检查** - 用于负载均衡器的快速健康探测
- ✅ **就绪检查** - 包含数据库依赖的就绪状态验证

## 🏗️ 模块结构

```
health/
├── health.controller.ts    # 健康检查控制器
└── health.module.ts        # 模块定义 (导入 TerminusModule)
```

## 🔌 依赖安装

本模块使用 `@nestjs/terminus` 包提供健康检查功能：

```bash
npm install --save @nestjs/terminus
```

### 模块注册

在 `app.module.ts` 中注册 TerminusModule：

```typescript
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    TerminusModule,
    // ... 其他模块
  ],
})
export class AppModule {}
```

## 🚀 API 端点

### 1. GET /health - 完整健康检查

检查数据库连接和内存使用情况。

**请求示例:**
```bash
curl http://localhost:3000/health
```

**成功响应 (200 OK):**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  }
}
```

**失败响应 (503 Service Unavailable):**
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "connect ECONNREFUSED 127.0.0.1:5432"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "connect ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```

---

### 2. GET /health/live - 存活检查 (Liveness Probe)

简化版健康检查，仅返回应用是否正在运行。用于 Kubernetes 的 livenessProbe。

**请求示例:**
```bash
curl http://localhost:3000/health/live
```

**响应示例:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-29T11:42:00.000Z"
}
```

**使用场景:**
- Kubernetes livenessProbe
- Docker HEALTHCHECK
- 负载均衡器健康探测

---

### 3. GET /health/ready - 就绪检查 (Readiness Probe)

检查应用是否准备好接收流量 (包含数据库连接验证)。用于 Kubernetes 的 readinessProbe。

**请求示例:**
```bash
curl http://localhost:3000/health/ready
```

**成功响应 (200 OK):**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

**失败响应 (503 Service Unavailable):**
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down"
    }
  },
  "details": {
    "database": {
      "status": "down"
    }
  }
}
```

---

## 📋 健康指标说明

### 数据库检查 (database)

使用 TypeORM 的 `pingCheck` 方法验证数据库连接。

| 状态 | 说明 |
|------|------|
| `up` | 数据库连接正常 |
| `down` | 数据库连接失败 |

---

### 堆内存检查 (memory_heap)

检查 Node.js 堆内存使用是否超过阈值。

**默认阈值:** 150MB

| 状态 | 说明 |
|------|------|
| `up` | 堆内存使用 < 150MB |
| `down` | 堆内存使用 ≥ 150MB |

---

### 常驻内存检查 (memory_rss)

检查进程常驻内存 (Resident Set Size) 使用是否超过阈值。

**默认阈值:** 200MB

| 状态 | 说明 |
|------|------|
| `up` | RSS 内存使用 < 200MB |
| `down` | RSS 内存使用 ≥ 200MB |

---

## 🔧 配置说明

### 调整内存阈值

在 `health.controller.ts` 中修改阈值：

```typescript
// 堆内存阈值调整为 200MB
() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),

// RSS 内存阈值调整为 300MB
() => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
```

### 添加其他健康检查

Terminus 支持多种健康检查指示器：

```typescript
import { HttpHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';

// HTTP 服务检查
() => this.http.pingCheck('api-gateway', 'https://api.example.com/health'),

// 磁盘空间检查
() => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
```

---

## 🐳 Kubernetes 集成示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: whale-conservation
spec:
  containers:
    - name: app
      image: whale-conservation:latest
      ports:
        - containerPort: 3000
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
```

---

## 🐳 Docker Compose 健康检查

```yaml
services:
  app:
    image: whale-conservation:latest
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 📊 使用场景

| 场景 | 推荐端点 | 说明 |
|------|----------|------|
| Kubernetes livenessProbe | `/health/live` | 快速检查应用是否存活 |
| Kubernetes readinessProbe | `/health/ready` | 检查应用是否准备好接收流量 |
| Docker HEALTHCHECK | `/health/live` | 容器健康状态监控 |
| 负载均衡器探测 | `/health/live` | 快速返回健康状态 |
| 应用监控面板 | `/health` | 完整的健康指标详情 |
| CI/CD 部署验证 | `/health/ready` | 部署后验证服务可用性 |

---

## ⚠️ 注意事项

1. **内存阈值设置**: 根据实际部署环境调整内存阈值，避免误报
2. **检查频率**: Kubernetes probe 的 `periodSeconds` 不宜过短，避免频繁检查影响性能
3. **超时设置**: 数据库检查可能较慢，确保 `timeoutSeconds` 足够 (建议 5-10 秒)
4. **启动延迟**: 设置合理的 `initialDelaySeconds`，等待应用完全启动后再开始检查

---

## 🔍 故障排查

### 数据库检查失败

```json
{
  "error": {
    "database": {
      "status": "down",
      "message": "connect ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```

**排查步骤:**
1. 检查数据库服务是否运行
2. 验证数据库连接配置 (host/port/username/password)
3. 检查防火墙和网络连接

### 内存检查失败

```json
{
  "error": {
    "memory_heap": {
      "status": "down",
      "message": "Heap size 160MB exceeds limit 150MB"
    }
  }
}
```

**排查步骤:**
1. 检查是否有内存泄漏
2. 调整内存阈值 (如果配置合理)
3. 增加容器/ pod 内存限制
4. 优化代码减少内存占用

---

## 📚 相关文档

- [NestJS Terminus 官方文档](https://docs.nestjs.com/recipes/terminus)
- [Kubernetes 健康检查指南](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker 健康检查文档](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

**版本:** v0.1.0  
**最后更新:** 2026-03-29  
**维护者:** 鲸创项目团队
