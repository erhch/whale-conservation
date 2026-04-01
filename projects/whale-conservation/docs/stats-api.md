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

### 6. 鲸鱼生命状态分布

**GET** `/api/v1/stats/whales/status`

获取鲸鱼个体按生命状态的分布统计（存活/死亡/失踪）。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/whales/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "total": 45,
  "breakdown": {
    "alive": 35,
    "deceased": 8,
    "missing": 2
  },
  "survivalRate": 78
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | `number` | 鲸鱼个体总数 |
| `breakdown.alive` | `number` | 存活个体数 |
| `breakdown.deceased` | `number` | 已确认死亡个体数 |
| `breakdown.missing` | `number` | 失踪个体数 |
| `survivalRate` | `number` | 存活率百分比 |

---

### 7. 鲸鱼性别分布

**GET** `/api/v1/stats/whales/sex`

获取鲸鱼个体按性别的分布统计。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/whales/sex" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "total": 45,
  "distribution": {
    "male": 22,
    "female": 20,
    "unknown": 3
  },
  "sexRatio": "1.10"
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | `number` | 鲸鱼个体总数 |
| `distribution.male` | `number` | 雄性个体数 |
| `distribution.female` | `number` | 雌性个体数 |
| `distribution.unknown` | `number` | 性别未知个体数 |
| `sexRatio` | `string` | 性别比 (雄/雌) |

---

### 8. 物种出现频率

**GET** `/api/v1/stats/species/frequency`

获取各物种的观测频率统计，按观测次数排序。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/species/frequency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "name": "座头鲸",
    "scientificName": "Megaptera novaeangliae",
    "count": 120,
    "percentage": 50
  },
  {
    "name": "蓝鲸",
    "scientificName": "Balaenoptera musculus",
    "count": 45,
    "percentage": 19
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 物种中文名 |
| `scientificName` | `string` | 物种学名 |
| `count` | `number` | 观测次数 |
| `percentage` | `number` | 占总观测次数的百分比 |

---

### 9. 热门观测地点排行

**GET** `/api/v1/stats/locations/top`

获取观测记录最多的热门地点排行。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | `number` | 否 | `10` | 返回的排名数量，范围 1-100 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/locations/top?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "rank": 1,
    "id": "station-uuid-1",
    "code": "DH-A",
    "name": "东海观测站 A",
    "type": "fixed",
    "location": "东海海域",
    "count": 89,
    "percentage": 37
  },
  {
    "rank": 2,
    "id": "station-uuid-2",
    "code": "NH-B",
    "name": "南海观测站 B",
    "type": "mobile",
    "location": "南海海域",
    "count": 67,
    "percentage": 28
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | `number` | 排名 |
| `id` | `string` | 站点 UUID |
| `code` | `string` | 站点编码 |
| `name` | `string` | 站点名称 |
| `type` | `string` | 站点类型 |
| `location` | `string` | 站点位置描述 |
| `count` | `number` | 观测记录数 |
| `percentage` | `number` | 占总观测次数的百分比 |

---

### 10. 周度观测统计

**GET** `/api/v1/stats/sightings/weekly`

获取按周统计的观测记录数量。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `weeks` | `number` | 否 | `12` | 统计周数，范围 1-52 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/weekly?weeks=24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "week": "2026-02-02T00:00:00.000Z",
    "count": 12
  },
  {
    "week": "2026-02-09T00:00:00.000Z",
    "count": 15
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `week` | `string` | 周起始日期 (ISO 8601) |
| `count` | `number` | 该周观测记录数 |

---

### 11. 月度观测统计

**GET** `/api/v1/stats/sightings/monthly`

获取按月份统计的观测记录数量。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `months` | `number` | 否 | `12` | 统计月数，范围 1-60 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/monthly?months=24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "month": "2025-12-01T00:00:00.000Z",
    "count": 25
  },
  {
    "month": "2026-01-01T00:00:00.000Z",
    "count": 30
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `month` | `string` | 月份起始日期 (ISO 8601) |
| `count` | `number` | 该月观测记录数 |

---

### 12. 季度观测统计

**GET** `/api/v1/stats/sightings/quarterly`

获取按季度统计的观测记录数量。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `quarters` | `number` | 否 | `8` | 统计季度数，范围 1-40 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/quarterly?quarters=12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "quarter": "2025-01-01T00:00:00.000Z",
    "count": 78
  },
  {
    "quarter": "2025-04-01T00:00:00.000Z",
    "count": 92
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `quarter` | `string` | 季度起始日期 (ISO 8601) |
| `count` | `number` | 该季度观测记录数 |

---

### 13. 年度观测统计

**GET** `/api/v1/stats/sightings/yearly`

获取按年度统计的观测记录数量。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `years` | `number` | 否 | `10` | 统计年数，范围 1-50 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/yearly?years=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "year": "2024-01-01T00:00:00.000Z",
    "count": 180
  },
  {
    "year": "2025-01-01T00:00:00.000Z",
    "count": 220
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `year` | `string` | 年度起始日期 (ISO 8601) |
| `count` | `number` | 该年度观测记录数 |

---

### 14. 活跃鲸鱼个体排行

**GET** `/api/v1/stats/whales/active`

获取观测记录最多的活跃鲸鱼个体排行。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | `number` | 否 | `10` | 返回的排名数量，范围 1-100 |
| `days` | `number` | 否 | `90` | 统计天数范围，范围 1-365 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/whales/active?limit=5&days=60" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "rank": 1,
    "id": "whale-uuid-1",
    "identifier": "SH-2024-001",
    "name": "希望",
    "species": "座头鲸",
    "lastLocation": "东海海域",
    "lastSightedAt": "2026-03-28T10:30:00.000Z",
    "count": 25
  },
  {
    "rank": 2,
    "id": "whale-uuid-2",
    "identifier": "SH-2024-002",
    "name": "自由",
    "species": "座头鲸",
    "lastLocation": "南海海域",
    "lastSightedAt": "2026-03-25T14:15:00.000Z",
    "count": 22
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | `number` | 排名 |
| `id` | `string` | 鲸鱼 UUID |
| `identifier` | `string` | 鲸鱼编号 |
| `name` | `string` | 鲸鱼名称 |
| `species` | `string` | 物种名称 |
| `lastLocation` | `string` | 最后观测地点 |
| `lastSightedAt` | `string` | 最后观测时间 |
| `count` | `number` | 统计期内观测次数 |

---

### 15. 最近观测记录

**GET** `/api/v1/stats/sightings/recent`

获取最近的观测记录列表 (支持分页)。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `limit` | `number` | 否 | `10` | 每页数量，范围 1-100 |
| `offset` | `number` | 否 | `0` | 偏移量 (用于分页) |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/recent?limit=5&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "data": [
    {
      "id": "sighting-uuid-1",
      "observedAt": "2026-03-30T10:30:00.000Z",
      "location": "东海海域",
      "behavior": "觅食",
      "groupSize": 3,
      "whale": {
        "id": "whale-uuid-1",
        "identifier": "SH-2024-001",
        "name": "希望",
        "species": "座头鲸",
        "scientificName": "Megaptera novaeangliae"
      },
      "station": {
        "code": "DH-A",
        "name": "东海观测站 A"
      }
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0,
    "total": 238,
    "hasMore": true
  }
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `array` | 观测记录列表 |
| `data[].id` | `string` | 观测记录 UUID |
| `data[].observedAt` | `string` | 观测时间 |
| `data[].location` | `string` | 观测地点 |
| `data[].behavior` | `string` | 观测到的行为 |
| `data[].groupSize` | `number` | 群体大小 |
| `data[].whale` | `object` | 鲸鱼信息 |
| `data[].station` | `object` | 站点信息 (可选) |
| `pagination.limit` | `number` | 每页数量 |
| `pagination.offset` | `number` | 当前偏移量 |
| `pagination.total` | `number` | 总记录数 |
| `pagination.hasMore` | `boolean` | 是否有更多数据 |

---

### 16. 物种详细统计

**GET** `/api/v1/stats/species/:speciesId`

获取指定物种的详细统计信息。

**路径参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `speciesId` | `string` | 是 | 物种 UUID |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/species/species-uuid-1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "species": {
    "id": "species-uuid-1",
    "scientificName": "Megaptera novaeangliae",
    "commonNameZh": "座头鲸",
    "commonNameEn": "Humpback Whale",
    "iucnStatus": "LC"
  },
  "population": {
    "total": 18,
    "alive": 15,
    "survivalRate": 83
  },
  "sexDistribution": {
    "breakdown": {
      "M": 8,
      "F": 7,
      "unknown": 3
    },
    "total": 18
  },
  "sightings": {
    "total": 120,
    "recent30Days": 8,
    "avgGroupSize": 2.5
  },
  "topLocations": [
    {
      "rank": 1,
      "location": "东海海域",
      "count": 45
    },
    {
      "rank": 2,
      "location": "南海海域",
      "count": 32
    }
  ]
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `species` | `object` | 物种基本信息 |
| `population` | `object` | 种群数量统计 |
| `sexDistribution` | `object` | 性别分布 |
| `sightings` | `object` | 观测记录统计 |
| `topLocations` | `array` | 热门观测地点 (Top 5) |

---

### 17. 观测行为分布

**GET** `/api/v1/stats/sightings/behaviors`

获取各种观测行为 (觅食/社交/迁徙等) 的分布统计。

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/sightings/behaviors" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
[
  {
    "behavior": "觅食",
    "count": 85,
    "percentage": 36
  },
  {
    "behavior": "社交",
    "count": 62,
    "percentage": 26
  },
  {
    "behavior": "迁徙",
    "count": 45,
    "percentage": 19
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `behavior` | `string` | 行为类型 |
| `count` | `number` | 观测次数 |
| `percentage` | `number` | 占总观测次数的百分比 |

---

### 18. 鲸鱼迁徙轨迹分析

**GET** `/api/v1/stats/whales/:whaleId/migration`

获取指定鲸鱼的迁徙轨迹分析。

**路径参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `whaleId` | `string` | 是 | 鲸鱼 UUID |

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `days` | `number` | 否 | `365` | 回溯天数，范围 1-730 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/whales/whale-uuid-1/migration?days=180" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "whale": {
    "id": "whale-uuid-1",
    "identifier": "SH-2024-001",
    "name": "希望",
    "species": "座头鲸",
    "lifeStatus": "alive"
  },
  "period": {
    "startDate": "2025-10-01T00:00:00.000Z",
    "endDate": "2026-03-30T00:00:00.000Z",
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
      "date": "2026-03-28T10:30:00.000Z",
      "location": "东海海域"
    },
    "estimatedTotalDistanceKm": 1250.5
  },
  "trajectory": [
    {
      "sequence": 1,
      "observedAt": "2025-10-05T08:30:00.000Z",
      "location": "南海海域",
      "coordinates": {
        "lat": 18.5,
        "lng": 110.2
      },
      "behavior": "觅食",
      "groupSize": 2,
      "station": {
        "code": "NH-B",
        "name": "南海观测站 B"
      }
    }
  ]
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `whale` | `object` | 鲸鱼基本信息 |
| `period` | `object` | 统计时间段 |
| `summary` | `object` | 迁徙摘要统计 |
| `trajectory` | `array` | 迁徙轨迹点列表 |

---

### 19. 种群增长趋势预测

**GET** `/api/v1/stats/population/growth-trend`

获取种群增长历史趋势及未来预测。

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `months` | `number` | 否 | `12` | 统计月数，范围 1-60 |
| `forecastMonths` | `number` | 否 | `3` | 预测月数，范围 1-12 |

**请求示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/stats/population/growth-trend?months=12&forecastMonths=6" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应示例:**

```json
{
  "period": {
    "startDate": "2025-04-01T00:00:00.000Z",
    "endDate": "2026-03-30T00:00:00.000Z",
    "months": 12
  },
  "history": [
    {
      "month": "2025-04-01T00:00:00.000Z",
      "newWhales": 3,
      "cumulative": 42
    },
    {
      "month": "2025-05-01T00:00:00.000Z",
      "newWhales": 2,
      "cumulative": 44
    }
  ],
  "predictions": [
    {
      "month": "2026-04-01T00:00:00.000Z",
      "predictedCumulative": 48,
      "isForecast": true
    },
    {
      "month": "2026-05-01T00:00:00.000Z",
      "predictedCumulative": 50,
      "isForecast": true
    }
  ],
  "analytics": {
    "totalNewWhales": 45,
    "avgMonthlyNewWhales": 3.8,
    "avgGrowthRate": 2.5,
    "trend": "growing"
  }
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `period` | `object` | 统计时间段 |
| `history` | `array` | 历史数据 (按月) |
| `predictions` | `array` | 预测数据 |
| `analytics` | `object` | 分析指标 |
| `analytics.trend` | `string` | 趋势类型 (growing/declining/stable/accelerating/slowing) |

---

## 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-04-01 | 1.1.0 | 新增 14 个 API 端点文档 (鲸鱼状态/性别/频率/地点排行/时间统计/活跃鲸鱼/最近观测/物种详情/行为分布/迁徙轨迹/种群预测) |
| 2026-03-31 | 1.0.0 | 初始版本，包含 5 个统计 API 端点 |
