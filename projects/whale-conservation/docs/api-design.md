# API 设计文档

> 鲸创管理系统 - RESTful API 规范

版本：v0.1.0  
最后更新：2026-03-27

---

## 概述

本项目采用 RESTful API 设计风格，所有接口返回 JSON 格式数据。

### 基础信息

- **Base URL:** `/api/v1`
- **认证方式:** JWT Bearer Token
- **数据格式:** JSON
- **字符编码:** UTF-8

### 响应格式

**成功响应 (200/201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-27T10:00:00Z",
    "requestId": "req-uuid"
  }
}
```

**分页响应:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" }
    ]
  }
}
```

---

## 认证接口

### POST /auth/register
用户注册

**请求体:**
```json
{
  "username": "string (4-20 字符)",
  "email": "string (邮箱格式)",
  "password": "string (8-32 字符)",
  "organization": "string (可选)"
}
```

**响应:** 201 Created
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "string",
    "role": "volunteer"
  }
}
```

### POST /auth/login
用户登录

**请求体:**
```json
{
  "email": "string",
  "password": "string"
}
```

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "username": "string",
      "role": "researcher",
      "avatarUrl": "https://..."
    }
  }
}
```

### POST /auth/refresh
刷新 Token

**请求头:** `Authorization: Bearer <token>`

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "expiresIn": 86400
  }
}
```

---

## 物种管理

### GET /species
获取物种列表

**查询参数:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `iucnStatus` (string, optional: LC/NT/VU/EN/CR/EW/EX)
- `search` (string, optional: 搜索常用名或学名)

**响应:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "commonName": {"zh": "蓝鲸", "en": "Blue Whale"},
      "scientificName": "Balaenoptera musculus",
      "iucnStatus": "EN",
      "populationTrend": "increasing"
    }
  ],
  "pagination": { ... }
}
```

### GET /species/:id
获取物种详情

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "commonName": {"zh": "蓝鲸", "en": "Blue Whale"},
    "scientificName": "Balaenoptera musculus",
    "iucnStatus": "EN",
    "populationTrend": "increasing",
    "description": "详细描述...",
    "whaleCount": 15,
    "lastSighting": "2026-03-25T14:30:00Z",
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-27T08:00:00Z"
  }
}
```

### POST /species
创建新物种 (admin/researcher only)

**请求体:**
```json
{
  "commonName": {"zh": "蓝鲸", "en": "Blue Whale"},
  "scientificName": "Balaenoptera musculus",
  "iucnStatus": "EN",
  "populationTrend": "increasing",
  "description": "可选描述"
}
```

**响应:** 201 Created

### PUT /species/:id
更新物种信息 (admin/researcher only)

**响应:** 200 OK

### DELETE /species/:id
删除物种 (admin only)

**响应:** 204 No Content

---

## 鲸鱼个体管理

### GET /whales
获取鲸鱼个体列表

**查询参数:**
- `page`, `pageSize` (分页)
- `speciesId` (UUID, optional)
- `status` (alive/deceased/missing)
- `sex` (male/female)
- `search` (名称搜索)

**响应:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "蓝 -001",
      "species": {
        "id": "uuid",
        "commonName": {"zh": "蓝鲸"}
      },
      "sex": "female",
      "status": "alive",
      "lastSeen": "2026-03-25T14:30:00Z",
      "ageYears": 5
    }
  ]
}
```

### GET /whales/:id
获取鲸鱼个体详情

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "蓝 -001",
    "species": { ... },
    "sex": "female",
    "birthDate": "2021-05-15",
    "status": "alive",
    "photoFeatures": { ... },
    "geneticData": { ... },
    "healthStatus": "良好",
    "lastSeen": "2026-03-25T14:30:00Z",
    "sightingCount": 23,
    "migrationCount": 2,
    "createdAt": "2026-03-01T10:00:00Z"
  }
}
```

### GET /whales/:id/sightings
获取鲸鱼观测记录

**查询参数:** `page`, `pageSize`, `startDate`, `endDate`

**响应:** 200 OK (分页观测记录)

### GET /whales/:id/migrations
获取鲸鱼迁徙轨迹

**响应:** 200 OK (迁徙轨迹列表)

---

## 观测记录

### GET /sightings
获取观测记录列表

**查询参数:**
- `page`, `pageSize`
- `whaleId` (UUID, optional)
- `observerId` (UUID, optional)
- `stationId` (UUID, optional)
- `startDate`, `endDate`
- `behavior` (行为类型)

**响应:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "whale": {
        "id": "uuid",
        "name": "蓝 -001",
        "species": {"commonName": {"zh": "蓝鲸"}}
      },
      "observer": {
        "id": "uuid",
        "username": "研究员 A"
      },
      "sightingTime": "2026-03-27T09:30:00Z",
      "location": {
        "type": "Point",
        "coordinates": [121.4737, 31.2304]
      },
      "behavior": "觅食",
      "groupSize": 3,
      "weatherConditions": {
        "wind": 3,
        "visibility": "good",
        "seaState": 2
      },
      "waterTemperature": 18.5,
      "photos": ["https://..."],
      "notes": "观察到母子互动"
    }
  ]
}
```

### POST /sightings
创建观测记录 (researcher/volunteer)

**请求体:**
```json
{
  "whaleId": "uuid (optional, 群体观测可不填)",
  "sightingTime": "2026-03-27T09:30:00Z",
  "location": {
    "type": "Point",
    "coordinates": [121.4737, 31.2304]
  },
  "behavior": "觅食",
  "groupSize": 3,
  "weatherConditions": {
    "wind": 3,
    "visibility": "good",
    "seaState": 2
  },
  "waterTemperature": 18.5,
  "photos": ["https://..."],
  "notes": "可选备注"
}
```

**响应:** 201 Created

---

## 监测站点

### GET /stations
获取监测站点列表

**查询参数:**
- `page`, `pageSize`
- `status` (active/maintenance/offline)
- `stationType` (buoy/shore/ship/satellite)
- `nearby` (lat,lng,radius - 附近站点)

**响应:** 200 OK

### GET /stations/:id
获取站点详情

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "东海 -01 号浮标",
    "location": {
      "type": "Point",
      "coordinates": [121.4737, 31.2304]
    },
    "stationType": "buoy",
    "status": "active",
    "installedDate": "2025-06-15",
    "metadata": {
      "depth": 50,
      "equipment": ["camera", "hydrophone", "sensor"]
    },
    "recentSightings": 15,
    "lastDataSync": "2026-03-27T14:00:00Z"
  }
}
```

### GET /stations/:id/environment-logs
获取站点环境日志 (TimescaleDB 时序数据)

**查询参数:** `startTime`, `endTime`, `interval`

**响应:** 200 OK (时序数据数组)

---

## 统计与分析

### GET /stats/overview
获取系统概览统计

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalSpecies": 12,
    "totalWhales": 156,
    "activeWhales": 142,
    "totalSightings": 1247,
    "sightingsThisMonth": 89,
    "totalObservers": 45,
    "activeStations": 8,
    "totalMigrations": 34
  }
}
```

### GET /stats/sightings/trend
获取观测趋势 (按时间)

**查询参数:** `groupBy` (day/week/month), `startDate`, `endDate`

**响应:** 200 OK (时间序列数据)

### GET /stats/species/distribution
获取物种分布统计

**响应:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "speciesId": "uuid",
      "speciesName": "蓝鲸",
      "count": 23,
      "percentage": 16.3
    }
  ]
}
```

---

## 错误代码

| 代码 | HTTP 状态 | 说明 |
|------|----------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| UNAUTHORIZED | 401 | 未认证或 Token 过期 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 (如重复邮箱) |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 版本历史

- v0.1.0 (2026-03-27): 初始 API 设计
