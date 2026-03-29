# API 使用示例

> 鲸创管理系统 - 常见 API 调用示例

版本：v0.1.0  
最后更新：2026-03-28

---

## 快速开始

### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher_zhang",
    "email": "zhang@whale-conservation.org",
    "password": "SecurePass123!",
    "organization": "东海鲸类研究中心"
  }'
```

**响应:**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "researcher_zhang",
    "role": "researcher"
  }
}
```

---

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhang@whale-conservation.org",
    "password": "SecurePass123!"
  }'
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "researcher_zhang",
      "role": "researcher",
      "avatarUrl": null
    }
  }
}
```

---

### 3. 使用 Token 访问受保护接口

```bash
# 保存 token 到环境变量
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 获取鲸鱼个体列表
curl -X GET http://localhost:3000/api/v1/whales \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 物种管理示例

### 获取物种列表 (公开接口)

```bash
curl -X GET "http://localhost:3000/api/v1/species?page=1&pageSize=20"
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "sp-001",
      "commonName": {"zh": "蓝鲸", "en": "Blue Whale"},
      "scientificName": "Balaenoptera musculus",
      "iucnStatus": "EN",
      "populationTrend": "increasing"
    },
    {
      "id": "sp-002",
      "commonName": {"zh": "座头鲸", "en": "Humpback Whale"},
      "scientificName": "Megaptera novaeangliae",
      "iucnStatus": "LC",
      "populationTrend": "stable"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

### 按 IUCN 状态筛选

```bash
curl -X GET "http://localhost:3000/api/v1/species?iucnStatus=EN"
```

### 搜索物种

```bash
curl -X GET "http://localhost:3000/api/v1/species?search=蓝鲸"
```

### 获取物种详情

```bash
curl -X GET http://localhost:3000/api/v1/species/sp-001 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 鲸鱼个体管理

### 创建鲸鱼个体 (研究员权限)

```bash
curl -X POST http://localhost:3000/api/v1/whales \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "speciesId": "sp-001",
    "name": "蓝 -001",
    "sex": "female",
    "birthDate": "2021-05-15",
    "photoFeatures": {
      "dorsalFin": "三角形，高约 1.2m，边缘有轻微缺口",
      "bodyMarkings": "背部深蓝色，腹部浅灰色",
      "notableFeatures": "左侧有藤壶附着痕迹"
    },
    "healthStatus": "良好"
  }'
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "wh-001",
    "name": "蓝 -001",
    "species": {
      "id": "sp-001",
      "commonName": {"zh": "蓝鲸"}
    },
    "sex": "female",
    "status": "alive",
    "createdAt": "2026-03-28T00:30:00Z"
  }
}
```

### 获取鲸鱼详情

```bash
curl -X GET http://localhost:3000/api/v1/whales/wh-001 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 更新鲸鱼状态

```bash
curl -X PUT http://localhost:3000/api/v1/whales/wh-001 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "healthStatus": "需要观察 - 发现轻微擦伤",
    "lastSeen": "2026-03-28T09:30:00Z"
  }'
```

---

## 观测记录

### 创建观测记录

```bash
curl -X POST http://localhost:3000/api/v1/sightings \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "whaleId": "wh-001",
    "sightingTime": "2026-03-28T09:30:00Z",
    "location": {
      "type": "Point",
      "coordinates": [122.4737, 30.2304]
    },
    "behavior": "觅食",
    "groupSize": 3,
    "weatherConditions": {
      "wind": 3,
      "visibility": "good",
      "seaState": 2
    },
    "waterTemperature": 18.5,
    "notes": "观察到母子互动，幼鲸在母鲸左侧游动"
  }'
```

### 查询观测记录

```bash
# 按鲸鱼 ID 查询
curl -X GET "http://localhost:3000/api/v1/sightings?whaleId=wh-001" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按时间范围查询
curl -X GET "http://localhost:3000/api/v1/sightings?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按行为类型查询
curl -X GET "http://localhost:3000/api/v1/sightings?behavior=觅食" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 监测站点

### 获取所有站点

```bash
curl -X GET http://localhost:3000/api/v1/stations \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 按状态筛选

```bash
curl -X GET "http://localhost:3000/api/v1/stations?status=active" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 查询附近站点

```bash
# 查询坐标点 50km 范围内的站点
curl -X GET "http://localhost:3000/api/v1/stations?nearby=30.2304,122.4737,50" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 统计分析

### 获取系统概览

```bash
curl -X GET http://localhost:3000/api/v1/stats/overview \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**响应示例:**
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

### 获取观测趋势

```bash
# 按月统计
curl -X GET "http://localhost:3000/api/v1/stats/sightings/trend?groupBy=month&startDate=2026-01-01" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按周统计
curl -X GET "http://localhost:3000/api/v1/stats/sightings/trend?groupBy=week&startDate=2026-03-01" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 获取物种分布

```bash
curl -X GET http://localhost:3000/api/v1/stats/species/distribution \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 错误处理示例

### 401 未授权

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未提供认证令牌或令牌已过期"
  }
}
```

### 403 权限不足

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "您没有执行此操作的权限。需要角色：ADMIN"
  }
}
```

### 404 资源不存在

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "鲸鱼个体不存在：wh-999"
  }
}
```

### 400 参数验证失败

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      },
      {
        "field": "password",
        "message": "密码长度必须为 8-32 个字符"
      }
    ]
  }
}
```

---

## JavaScript/TypeScript 示例

### 使用 Fetch API

```typescript
const BASE_URL = 'http://localhost:3000/api/v1';

// 登录
async function login(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('jwt_token', data.data.token);
  }
  return data;
}

// 获取物种列表
async function getSpecies(page = 1, pageSize = 20) {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(
    `${BASE_URL}/species?page=${page}&pageSize=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return await response.json();
}

// 创建观测记录
async function createSighting(sightingData: any) {
  const token = localStorage.getItem('jwt_token');
  const response = await fetch(`${BASE_URL}/sightings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sightingData),
  });
  return await response.json();
}
```

### 使用 Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 - 自动添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转到登录页
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 使用示例
const species = await api.get('/species');
const sighting = await api.post('/sightings', sightingData);
```

---

## Postman 集合

可以导入以下 Postman 集合快速测试 API：

```json
{
  "info": {
    "name": "鲸创管理系统 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "const data = pm.response.json();",
                  "if (data.success) {",
                  "  pm.environment.set('token', data.data.token);",
                  "}"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 高级统计 API 示例

### 种群增长趋势预测

```bash
# 获取过去 12 个月的种群增长趋势，并预测未来 3 个月
curl -X GET "http://localhost:3000/api/v1/stats/population/growth-trend?months=12&forecastMonths=3" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**响应示例:**
```json
{
  "period": {
    "startDate": "2025-03-29T00:00:00.000Z",
    "endDate": "2026-03-29T00:00:00.000Z",
    "months": 12
  },
  "history": [
    {
      "month": "2025-04-01T00:00:00.000Z",
      "newWhales": 3,
      "cumulative": 3
    }
  ],
  "predictions": [
    {
      "month": "2026-04-01T00:00:00.000Z",
      "predictedCumulative": 48,
      "isForecast": true
    }
  ],
  "analytics": {
    "totalNewWhales": 45,
    "avgMonthlyNewWhales": 3.8,
    "avgGrowthRate": 12.5,
    "trend": "growing"
  }
}
```

---

### 鲸鱼迁徙轨迹分析

```bash
# 获取指定鲸鱼过去 180 天的迁徙轨迹
curl -X GET "http://localhost:3000/api/v1/stats/whales/wh-001/migration?days=180" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**响应示例:**
```json
{
  "whale": {
    "id": "wh-001",
    "identifier": "BCX001",
    "name": "大白",
    "species": "座头鲸",
    "lifeStatus": "alive"
  },
  "period": {
    "startDate": "2025-09-29T00:00:00.000Z",
    "endDate": "2026-03-29T00:00:00.000Z",
    "days": 180
  },
  "summary": {
    "totalSightings": 12,
    "uniqueLocations": 5,
    "firstSighting": {
      "date": "2025-10-05T08:30:00.000Z",
      "location": "南海海域"
    },
    "lastSighting": {
      "date": "2026-03-28T14:30:00.000Z",
      "location": "东海监测站"
    },
    "estimatedTotalDistanceKm": 2847.5
  },
  "trajectory": [
    {
      "sequence": 1,
      "observedAt": "2025-10-05T08:30:00.000Z",
      "location": "南海海域",
      "coordinates": {
        "lat": 18.2567,
        "lng": 109.5123
      },
      "behavior": "feeding",
      "groupSize": 2
    }
  ]
}
```

---

### 观测行为分布统计

```bash
# 获取各种观测行为的分布统计
curl -X GET http://localhost:3000/api/v1/stats/sightings/behaviors \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**响应示例:**
```json
[
  {
    "behavior": "feeding",
    "count": 95,
    "percentage": 40
  },
  {
    "behavior": "breaching",
    "count": 57,
    "percentage": 24
  },
  {
    "behavior": "socializing",
    "count": 48,
    "percentage": 20
  }
]
```

---

### 活跃鲸鱼个体排行

```bash
# 获取最近 30 天内最活跃的 10 只鲸鱼
curl -X GET "http://localhost:3000/api/v1/stats/whales/active?limit=10&days=30" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

### 指定物种详细统计

```bash
# 获取指定物种的综合统计数据
curl -X GET http://localhost:3000/api/v1/stats/species/sp-001 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

*最后更新：2026-03-29 (新增：高级统计 API 示例)*
