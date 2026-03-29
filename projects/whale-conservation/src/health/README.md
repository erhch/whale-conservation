# 🏥 Health Module - 健康检查模块

> 提供系统健康检查端点，用于监控服务状态、数据库连接和内存使用

**版本:** 1.0.0  
**最后更新:** 2026-03-30  
**状态:** ✅ 完成

---

## 📋 模块概述

Health Module 提供标准的健康检查端点，用于：

- 🔍 **服务可用性检查** - 确认 API 服务是否正常运行
- 💾 **数据库连接检查** - 验证数据库连接是否健康
- 🧠 **内存使用监控** - 检查堆内存和 RSS 内存使用
- ⚖️ **负载均衡器集成** - 支持 K8s、Docker Swarm 等编排工具

---

## 🏗️ 模块结构

```
health/
├── health.controller.ts    # 健康检查控制器
├── health.module.ts        # 模块定义
└── README.md               # 本文档
```

---

## 🔌 API 端点

### 1. 完整健康检查

**GET** `/api/v1/health`

执行完整的健康检查，包括数据库连接、堆内存和 RSS 内存。

**认证要求:** ❌ 公开访问

**响应示例 (健康):**

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

**响应示例 (不健康):**

```json
{
  "status": "error",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {
    "memory_heap": {
      "status": "down",
      "message": "Heap memory limit exceeded"
    }
  },
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "down",
      "message": "Heap memory limit exceeded"
    }
  }
}
```

**检查项说明:**

| 检查项 | 说明 | 阈值 |
|--------|------|------|
| `database` | 数据库连接检查 (TypeORM ping) | - |
| `memory_heap` | Node.js 堆内存使用 | 150 MB |
| `memory_rss` | 进程常驻内存 (RSS) | 200 MB |

**HTTP 状态码:**

| 状态码 | 说明 |
|--------|------|
| `200 OK` | 所有检查通过 |
| `503 Service Unavailable` | 至少一项检查失败 |

**cURL 示例:**

```bash
# 完整健康检查
curl -X GET "http://localhost:3000/api/v1/health"

# 检查状态码
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/v1/health"
```

---

### 2. 存活检查 (Liveness Probe)

**GET** `/api/v1/health/live`

简化版健康检查，仅返回服务是否存活。用于 Kubernetes liveness probe。

**认证要求:** ❌ 公开访问

**响应示例:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-30T03:12:00.000Z"
}
```

**HTTP 状态码:**

| 状态码 | 说明 |
|--------|------|
| `200 OK` | 服务存活 |

**使用场景:**

- Kubernetes liveness probe
- Docker health check
- 负载均衡器基础检查

**cURL 示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/health/live"
```

---

### 3. 就绪检查 (Readiness Probe)

**GET** `/api/v1/health/ready`

就绪检查，验证服务是否准备好接收流量（包含数据库连接检查）。用于 Kubernetes readiness probe。

**认证要求:** ❌ 公开访问

**响应示例 (就绪):**

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

**响应示例 (未就绪):**

```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
```

**HTTP 状态码:**

| 状态码 | 说明 |
|--------|------|
| `200 OK` | 服务就绪，可接收流量 |
| `503 Service Unavailable` | 服务未就绪 |

**使用场景:**

- Kubernetes readiness probe
- 服务启动完成检查
- 数据库连接恢复检查

**cURL 示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/health/ready"
```

---

## 📊 使用场景

### Kubernetes 部署配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whale-conservation-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: whale-conservation-api:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/v1/health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

### Docker Compose 健康检查

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Docker Swarm 健康检查

```yaml
version: '3.8'
services:
  api:
    image: whale-conservation-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
```

### Nginx 负载均衡器配置

```nginx
upstream api_backend {
    server api1:3000 max_fails=3 fail_timeout=30s;
    server api2:3000 max_fails=3 fail_timeout=30s;
    server api3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://api_backend;
        proxy_health_check interval=10s fails=3 passes=2;
    }
}
```

---

## 🔧 技术实现

### 依赖模块

| 模块 | 说明 |
|------|------|
| `@nestjs/terminus` | NestJS 健康检查库 |
| `@nestjs/typeorm` | TypeORM 数据库集成 |

### 健康指标

```typescript
// health.module.ts
@Module({
  imports: [
    TerminusModule,  // 健康检查模块
    TypeOrmModule,   // 数据库连接
  ],
  controllers: [HealthController],
})
export class HealthModule {}
```

### 内存阈值配置

| 指标 | 阈值 | 说明 |
|------|------|------|
| 堆内存 (Heap) | 150 MB | Node.js V8 堆内存上限 |
| 常驻内存 (RSS) | 200 MB | 进程总内存占用上限 |

**调整阈值:**

```typescript
// health.controller.ts
async check(): Promise<HealthCheckResult> {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024), // 调整为 256MB
    () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),   // 调整为 512MB
  ]);
}
```

---

## 📈 监控集成

### Prometheus 指标导出

健康检查端点可与 Prometheus 集成，导出服务健康状态指标：

```typescript
// 在 health.controller.ts 中添加 Prometheus 指标
@Get('metrics')
async metrics(): Promise<string> {
  const health = await this.check();
  const status = health.status === 'ok' ? 1 : 0;
  return `api_health_status ${status}\n`;
}
```

### Grafana 告警规则

```yaml
# 告警规则示例
groups:
- name: whale-conservation
  rules:
  - alert: APIUnhealthy
    expr: api_health_status == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "API 服务不健康"
      description: "API 实例 {{ $labels.instance }} 健康检查失败"
```

---

## ⚠️ 注意事项

1. **公开访问** - 健康检查端点默认公开，生产环境建议添加 IP 白名单
2. **内存阈值** - 根据实际部署环境调整内存阈值
3. **检查频率** - 避免过于频繁的健康检查（建议 10-30 秒间隔）
4. **超时设置** - 健康检查应快速响应（建议超时 5 秒内）
5. **数据库连接池** - 健康检查不会耗尽数据库连接池

---

## 🔗 相关文档

- [NestJS Terminus](https://docs.nestjs.com/techniques/health-check) - 官方健康检查文档
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) - K8s 探针配置
- [Docker Health Check](https://docs.docker.com/engine/reference/builder/#healthcheck) - Docker 健康检查

---

**模块维护者:** 鲸创项目开发团队  
**问题反馈:** https://github.com/erhch/whale-conservation/issues
