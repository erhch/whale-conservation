# Stats Module - 统计分析模块

提供鲸创项目的统计分析 API，包括总体概览、物种分布、观测趋势等统计数据。

## 目录结构

```
stats/
├── stats.controller.ts    # 统计分析控制器
├── stats.service.ts       # 统计分析服务
├── stats.module.ts        # 模块定义
└── README.md              # 本文档
```

## API 端点

### 1. 总体统计概览

**GET** `/api/v1/stats/overview`

获取项目整体统计数据。

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

获取各物种的鲸鱼个体分布统计。

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

获取指定天数内的观测趋势（按天统计）。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `days` | `number` | `30` | 统计天数 |

**请求示例:**

```
GET /api/v1/stats/sightings/trend?days=7
```

**响应示例:**

```json
[
  {
    "date": "2026-03-22T00:00:00.000Z",
    "count": 2
  },
  {
    "date": "2026-03-23T00:00:00.000Z",
    "count": 0
  },
  {
    "date": "2026-03-24T00:00:00.000Z",
    "count": 5
  },
  {
    "date": "2026-03-25T00:00:00.000Z",
    "count": 3
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | `string` | 日期 (ISO 8601) |
| `count` | `number` | 当日观测记录数 |

---

### 4. 监测站点统计

**GET** `/api/v1/stats/stations`

获取各监测站点的观测记录统计（按观测数量降序排列）。

---

### 5. 鲸鱼生命状态分布

**GET** `/api/v1/stats/whales/status`

获取鲸鱼个体按生命状态的分布统计（存活/死亡/失踪）。

**响应示例:**

```json
{
  "total": 45,
  "breakdown": {
    "alive": 38,
    "deceased": 5,
    "missing": 2
  },
  "survivalRate": 84
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | `number` | 鲸鱼个体总数 |
| `breakdown.alive` | `number` | 存活数量 |
| `breakdown.deceased` | `number` | 死亡数量 |
| `breakdown.missing` | `number` | 失踪数量 |
| `survivalRate` | `number` | 存活率百分比 |

---

### 6. 鲸鱼性别分布

**GET** `/api/v1/stats/whales/sex`

获取鲸鱼个体按性别的分布统计。

**响应示例:**

```json
{
  "total": 45,
  "distribution": {
    "male": 20,
    "female": 22,
    "unknown": 3
  },
  "sexRatio": "0.91"
}
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | `number` | 鲸鱼个体总数 |
| `distribution.male` | `number` | 雄性数量 |
| `distribution.female` | `number` | 雌性数量 |
| `distribution.unknown` | `number` | 未知性别数量 |
| `sexRatio` | `string` | 性别比 (雄/雌) |

---

### 7. 物种出现频率统计

**GET** `/api/v1/stats/species/frequency`

获取各物种的观测出现频率统计（按观测记录数量降序排列）。

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
    "count": 48,
    "percentage": 20
  },
  {
    "name": "虎鲸",
    "scientificName": "Orcinus orca",
    "count": 70,
    "percentage": 29
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | `string` | 物种中文名 |
| `scientificName` | `string` | 物种学名 |
| `count` | `number` | 该物种的观测记录总数 |
| `percentage` | `number` | 占总观测记录的百分比 |

---

### 8. 监测站点统计

**GET** `/api/v1/stats/stations`

获取各监测站点的观测记录统计（按观测数量降序排列）。

**响应示例:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "ST001",
    "name": "东海监测站",
    "type": "fixed",
    "status": "active",
    "sightingCount": 45
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "ST002",
    "name": "南海考察船",
    "type": "vessel",
    "status": "active",
    "sightingCount": 32
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ST003",
    "name": "黄海浮标站",
    "type": "fixed",
    "status": "active",
    "sightingCount": 18
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 站点 UUID |
| `code` | `string` | 站点代码 |
| `name` | `string` | 站点名称 |
| `type` | `string` | 站点类型 (`fixed`/`mobile`/`vessel`) |
| `status` | `string` | 站点状态 (`active`/`inactive`/`maintenance`) |
| `sightingCount` | `number` | 该站点的观测记录总数 |

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 获取总体统计
const overview = await fetch('/api/v1/stats/overview');
const data = await overview.json();
console.log(`总物种数：${data.species.total}`);

// 获取物种分布
const distribution = await fetch('/api/v1/stats/species/distribution');
const species = await distribution.json();
species.forEach(s => console.log(`${s.name}: ${s.count} 只`));

// 获取最近 7 天观测趋势
const trend = await fetch('/api/v1/stats/sightings/trend?days=7');
const dailyData = await trend.json();
```

### cURL

```bash
# 总体统计
curl -X GET "http://localhost:3000/api/v1/stats/overview"

# 物种分布
curl -X GET "http://localhost:3000/api/v1/stats/species/distribution"

# 观测趋势 (最近 7 天)
curl -X GET "http://localhost:3000/api/v1/stats/sightings/trend?days=7"
```

---

## 技术实现

### 依赖实体

- `Species` - 物种信息
- `Whale` - 鲸鱼个体
- `Sighting` - 观测记录

### 数据库查询

- **总体统计**: 使用 TypeORM `count()` 方法
- **物种分布**: 使用 `createQueryBuilder` 进行 JOIN 和 GROUP BY
- **观测趋势**: 使用 PostgreSQL `DATE_TRUNC` 函数按天分组

### 性能优化建议

1. **缓存统计结果**: 统计数据变化频率低，建议使用 `@CacheTTL(300)` 缓存 5 分钟
2. **索引优化**: 确保 `observedAt` 字段有索引以加速趋势查询
3. **限制天数范围**: 可考虑限制 `days` 参数最大值 (如 365 天) 防止慢查询

---

### 9. 热门观测地点排行

**GET** `/api/v1/stats/locations/top`

获取观测记录数量最多的热门地点排行。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | `number` | `10` | 返回前 N 个地点 (1-100) |

**请求示例:**

```
GET /api/v1/stats/locations/top?limit=5
```

**响应示例:**

```json
[
  {
    "rank": 1,
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "ST001",
    "name": "东海监测站",
    "type": "fixed",
    "location": "东海海域",
    "count": 120,
    "percentage": 50
  },
  {
    "rank": 2,
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "ST002",
    "name": "南海考察船",
    "type": "vessel",
    "location": "南海海域",
    "count": 72,
    "percentage": 30
  },
  {
    "rank": 3,
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "code": "ST003",
    "name": "黄海浮标站",
    "type": "fixed",
    "location": "黄海海域",
    "count": 48,
    "percentage": 20
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | `number` | 排名 |
| `id` | `string` | 站点 UUID |
| `code` | `string` | 站点代码 |
| `name` | `string` | 站点名称 |
| `type` | `string` | 站点类型 (`fixed`/`mobile`/`vessel`) |
| `location` | `string` | 地理位置描述 |
| `count` | `number` | 该站点的观测记录总数 |
| `percentage` | `number` | 占总观测记录的百分比 |

---

### 10. 月度观测统计

**GET** `/api/v1/stats/sightings/monthly`

获取指定月数内的月度观测统计（按月统计）。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `months` | `number` | `12` | 统计月数 (1-60) |

**请求示例:**

```
GET /api/v1/stats/sightings/monthly?months=6
```

**响应示例:**

```json
[
  {
    "month": "2025-10-01T00:00:00.000Z",
    "count": 18
  },
  {
    "month": "2025-11-01T00:00:00.000Z",
    "count": 22
  },
  {
    "month": "2025-12-01T00:00:00.000Z",
    "count": 15
  },
  {
    "month": "2026-01-01T00:00:00.000Z",
    "count": 28
  },
  {
    "month": "2026-02-01T00:00:00.000Z",
    "count": 25
  },
  {
    "month": "2026-03-01T00:00:00.000Z",
    "count": 12
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `month` | `string` | 月份 (ISO 8601，当月第一天) |
| `count` | `number` | 该月观测记录总数 |

---

### 11. 季度观测统计

**GET** `/api/v1/stats/sightings/quarterly`

获取指定季度数内的季度观测统计（按季度统计）。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `quarters` | `number` | `8` | 统计季度数 (1-40) |

**请求示例:**

```
GET /api/v1/stats/sightings/quarterly?quarters=4
```

**响应示例:**

```json
[
  {
    "quarter": "2025-07-01T00:00:00.000Z",
    "count": 55
  },
  {
    "quarter": "2025-10-01T00:00:00.000Z",
    "count": 62
  },
  {
    "quarter": "2026-01-01T00:00:00.000Z",
    "count": 58
  },
  {
    "quarter": "2026-04-01T00:00:00.000Z",
    "count": 12
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `quarter` | `string` | 季度 (ISO 8601，当季第一天) |
| `count` | `number` | 该季度观测记录总数 |

---

### 12. 年度观测统计

**GET** `/api/v1/stats/sightings/yearly`

获取指定年数内的年度观测统计（按年统计）。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `years` | `number` | `10` | 统计年数 (1-50) |

**请求示例:**

```
GET /api/v1/stats/sightings/yearly?years=5
```

**响应示例:**

```json
[
  {
    "year": "2022-01-01T00:00:00.000Z",
    "count": 180
  },
  {
    "year": "2023-01-01T00:00:00.000Z",
    "count": 215
  },
  {
    "year": "2024-01-01T00:00:00.000Z",
    "count": 198
  },
  {
    "year": "2025-01-01T00:00:00.000Z",
    "count": 242
  },
  {
    "year": "2026-01-01T00:00:00.000Z",
    "count": 68
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `year` | `string` | 年份 (ISO 8601，当年第一天) |
| `count` | `number` | 该年观测记录总数 |

---

### 13. 活跃鲸鱼个体排行

**GET** `/api/v1/stats/whales/active`

获取指定时间段内观测记录数量最多的活跃鲸鱼个体排行。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | `number` | `10` | 返回前 N 只鲸鱼 (1-100) |
| `days` | `number` | `90` | 统计天数 (1-365) |

**请求示例:**

```
GET /api/v1/stats/whales/active?limit=5&days=30
```

**响应示例:**

```json
[
  {
    "rank": 1,
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "identifier": "BCX001",
    "name": "大白",
    "species": "座头鲸",
    "lastLocation": "东海监测站",
    "lastSightedAt": "2026-03-28T14:30:00.000Z",
    "count": 12
  },
  {
    "rank": 2,
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "identifier": "BCX005",
    "name": "阿浪",
    "species": "蓝鲸",
    "lastLocation": "南海考察船",
    "lastSightedAt": "2026-03-27T09:15:00.000Z",
    "count": 8
  },
  {
    "rank": 3,
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "identifier": "BCX012",
    "name": null,
    "species": "虎鲸",
    "lastLocation": "黄海浮标站",
    "lastSightedAt": "2026-03-26T16:45:00.000Z",
    "count": 6
  }
]
```

**字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | `number` | 排名 |
| `id` | `string` | 鲸鱼 UUID |
| `identifier` | `string` | 鲸鱼编号 (如：BCX001) |
| `name` | `string` | 鲸鱼昵称 (可能为 null) |
| `species` | `string` | 物种中文名 |
| `lastLocation` | `string` | 最后观测地点 |
| `lastSightedAt` | `string` | 最后观测时间 (ISO 8601) |
| `count` | `number` | 该时间段内的观测记录数 |

**使用场景:**

- 🏆 **明星鲸鱼榜**: 展示最受欢迎的鲸鱼个体
- 📊 **活跃度分析**: 识别高频出现的鲸鱼
- 🗺️ **栖息地偏好**: 结合 lastLocation 分析活动范围
- 📈 **趋势监测**: 定期追踪活跃鲸鱼变化

---

### 14. 最近观测记录

**GET** `/api/v1/stats/sightings/recent`

获取最新的观测记录列表 (支持分页)。

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | `number` | `10` | 每页数量 (1-100) |
| `offset` | `number` | `0` | 偏移量 (用于分页) |

**请求示例:**

```
GET /api/v1/stats/sightings/recent?limit=5&offset=0
```

**响应示例:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "observedAt": "2026-03-29T02:15:00.000Z",
      "location": "东海海域",
      "behavior": "feeding",
      "groupSize": 3,
      "whale": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "identifier": "BCX001",
        "name": "大白",
        "species": "座头鲸",
        "scientificName": "Megaptera novaeangliae"
      },
      "station": {
        "code": "ST001",
        "name": "东海监测站"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "observedAt": "2026-03-28T18:30:00.000Z",
      "location": "南海海域",
      "behavior": "breaching",
      "groupSize": 1,
      "whale": {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "identifier": "BCX005",
        "name": "阿浪",
        "species": "蓝鲸",
        "scientificName": "Balaenoptera musculus"
      },
      "station": {
        "code": "ST002",
        "name": "南海考察船"
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
| `data[].observedAt` | `string` | 观测时间 (ISO 8601) |
| `data[].location` | `string` | 观测地点描述 |
| `data[].behavior` | `string` | 行为类型 (feeding/breaching/socializing 等) |
| `data[].groupSize` | `number` | 群体数量 (可能为 null) |
| `data[].whale` | `object` | 鲸鱼信息 |
| `data[].whale.id` | `string` | 鲸鱼 UUID |
| `data[].whale.identifier` | `string` | 鲸鱼编号 |
| `data[].whale.name` | `string` | 鲸鱼昵称 (可能为 null) |
| `data[].whale.species` | `string` | 物种中文名 |
| `data[].whale.scientificName` | `string` | 物种学名 |
| `data[].station` | `object` | 监测站信息 (可能为 null) |
| `data[].station.code` | `string` | 站点代码 |
| `data[].station.name` | `string` | 站点名称 |
| `pagination` | `object` | 分页信息 |
| `pagination.limit` | `number` | 每页数量 |
| `pagination.offset` | `number` | 当前偏移量 |
| `pagination.total` | `number` | 总记录数 |
| `pagination.hasMore` | `boolean` | 是否有更多数据 |

**使用场景:**

- 📱 **实时动态**: 展示最新观测活动
- 🔔 **推送通知**: 新观测记录提醒
- 📋 **数据审核**: 查看最新录入的观测数据
- 🗺️ **地图标记**: 在地图上显示最近观测点

---

## 待扩展功能

- [x] 按监测站点统计
- [x] 鲸鱼生命状态分布
- [x] 鲸鱼性别分布
- [x] 物种出现频率统计
- [x] 热门观测地点排行
- [x] 月度观测统计
- [x] 季度/年度统计
- [x] 鲸鱼个体活跃度分析
- [x] 最近观测记录列表 ✨ **本次完成**
- [ ] 鲸鱼迁徙轨迹分析
- [ ] 种群增长趋势预测

---

*最后更新：2026-03-29 (新增：最近观测记录 API)*
