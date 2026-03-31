# Stats API - 统计分析 API 文档

提供鲸创项目的统计分析功能，包括总体概览、物种分布、观测趋势等统计数据。

## 基础信息

- **Base URL**: `/api/v1/stats`
- **认证**: 需要 JWT Token
- **权限**: 需要 `stats:read` 权限

---

## API 端点

### 1. 总体统计概览

**GET** `/api/v1/stats/overview`

获取项目整体统计数据，包括物种、鲸鱼个体、观测记录和监测站点的汇总信息。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/overview" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "species": {
    "total": 12
  },
  "whales": {
    "total": 45
  },
  "sightings": {
    "total": 238,
    "recent30Days": 15
  },
  "stations": {
    "total": 8
  }
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `species.total` | `number` | 活跃物种总数 |
| `whales.total` | `number` | 存活鲸鱼个体总数 |
| `sightings.total` | `number` | 历史观测记录总数 |
| `sightings.recent30Days` | `number` | 最近 30 天观测记录数 |
| `stations.total` | `number` | 活跃监测站点总数 |

---

### 2. 物种分布统计

**GET** `/api/v1/stats/species/distribution`

获取各物种的鲸鱼个体分布统计，按物种分组统计个体数量。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/species/distribution" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "name": "座头鲸",
    "scientificName": "Megaptera novaeangliae",
    "count": 18
  },
  {
    "name": "蓝鲸",
    "scientificName": "Balaenoptera musculus",
    "count": 5
  },
  {
    "name": "虎鲸",
    "scientificName": "Orcinus orca",
    "count": 12
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 物种中文名 |
| `scientificName` | `string` | 物种学名 |
| `count` | `number` | 该物种的鲸鱼个体数量 |

---

### 3. 观测趋势统计

**GET** `/api/v1/stats/sightings/trend`

获取指定天数内的观测趋势（按天统计），用于分析观测活动的变化趋势。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | `number` | 否 | `30` | 统计天数，范围 1-365 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/trend?days=60" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "date": "2026-03-01",
    "count": 5
  },
  {
    "date": "2026-03-02",
    "count": 3
  },
  {
    "date": "2026-03-03",
    "count": 7
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | `string` | 日期 (YYYY-MM-DD) |
| `count` | `number` | 当日观测记录数 |

---

### 4. 站点观测统计

**GET** `/api/v1/stats/stations/activity`

获取各监测站点的观测活动统计，包括站点信息和观测记录数。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | `number` | 否 | `30` | 统计天数，范围 1-365 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/stations/activity?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "id": "station-uuid-1",
    "name": "东海观测站 A",
    "location": "东海海域",
    "sightingCount": 45
  },
  {
    "id": "station-uuid-2",
    "name": "南海观测站 B",
    "location": "南海海域",
    "sightingCount": 32
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 站点 UUID |
| `name` | `string` | 站点名称 |
| `location` | `string` | 站点位置描述 |
| `sightingCount` | `number` | 统计期内的观测记录数 |

---

### 5. 物种观测排名

**GET** `/api/v1/stats/species/ranking`

获取观测次数最多的物种排名，用于了解哪些物种最活跃。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | `number` | 否 | `10` | 返回的排名数量，范围 1-50 |
| `days` | `number` | 否 | `null` | 可选，限制统计天数范围 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/species/ranking?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "speciesId": "species-uuid-1",
    "name": "座头鲸",
    "scientificName": "Megaptera novaeangliae",
    "sightingCount": 89
  },
  {
    "speciesId": "species-uuid-2",
    "name": "虎鲸",
    "scientificName": "Orcinus orca",
    "sightingCount": 67
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `speciesId` | `string` | 物种 UUID |
| `name` | `string` | 物种中文名 |
| `scientificName` | `string` | 物种学名 |
| `sightingCount` | `number` | 观测次数 |

---

## 错误响应

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["days must be between 1 and 365"],
  "error": "Bad Request"
}
```

---

## 使用示例

### TypeScript/Angular

```typescript
// 获取总体统计
const overview = await this.http.get<StatsOverview>('/api/v1/stats/overview');

// 获取观测趋势 (最近 60 天)
const trend = await this.http.get<SightingTrend[]>('/api/v1/stats/sightings/trend?days=60');

// 获取物种排名 (前 5 名)
const ranking = await this.http.get<SpeciesRanking[]>('/api/v1/stats/species/ranking?limit=5');
```

### Python

```python
import requests

headers = {'Authorization': 'Bearer YOUR_TOKEN'}

# 获取总体统计
overview = requests.get('http://localhost:3000/api/v1/stats/overview', headers=headers)

# 获取观测趋势
trend = requests.get('http://localhost:3000/api/v1/stats/sightings/trend?days=60', headers=headers)
```

---

## 相关文件

- 控制器：`src/stats/stats.controller.ts`
- 服务：`src/stats/stats.service.ts`
- 模块：`src/stats/stats.module.ts`
- 单元测试：`src/stats/stats.controller.spec.ts`

---

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-31 | 1.0.0 | 初始版本，包含 5 个统计 API 端点 |
