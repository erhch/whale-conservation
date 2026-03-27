# 健康检查 API 文档

## 概述

健康检查端点用于监控服务运行状态，支持负载均衡器、容器编排系统（如 Kubernetes）和服务监控工具。

## 端点

### 1. 完整健康检查

**端点**: `GET /api/v1/health`

**描述**: 检查数据库连接、内存使用情况

**响应示例**:

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

**阈值**:
- Heap 内存：150MB
- RSS 内存：200MB

---

### 2. 存活探针 (Liveness Probe)

**端点**: `GET /api/v1/health/live`

**描述**: 简化版健康检查，仅确认服务进程是否存活

**用途**: Kubernetes livenessProbe、负载均衡器健康检查

**响应示例**:

```json
{
  "status": "ok",
  "timestamp": "2026-03-27T12:30:00.000Z"
}
```

---

### 3. 就绪探针 (Readiness Probe)

**端点**: `GET /api/v1/health/ready`

**描述**: 检查服务是否准备好接收流量（包含数据库连接检查）

**用途**: Kubernetes readinessProbe

**响应示例**:

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

---

## Kubernetes 配置示例

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: whale-conservation-api
spec:
  containers:
    - name: api
      image: whale-conservation-api:latest
      livenessProbe:
        httpGet:
          path: /api/v1/health/live
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /api/v1/health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

---

## 监控集成

### Prometheus

健康检查端点可与 Prometheus 集成，通过 `/health` 端点获取服务状态指标。

### Docker Swarm

```yaml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 故障排查

### 数据库连接失败

```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
```

**解决方案**:
1. 检查数据库服务是否运行
2. 验证环境变量 `WHALE_DB_*` 配置
3. 检查网络连接和防火墙规则

### 内存超限

```json
{
  "status": "error",
  "info": {},
  "error": {
    "memory_heap": {
      "status": "down",
      "message": "Heap memory limit exceeded"
    }
  }
}
```

**解决方案**:
1. 检查内存泄漏
2. 调整容器内存限制
3. 优化代码中的内存使用

---

## 安全注意事项

- 健康检查端点不应包含敏感信息
- 生产环境建议通过内网访问
- 可考虑添加 IP 白名单限制
