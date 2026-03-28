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

## 待扩展功能

- [ ] 按监测站点统计
- [ ] 按月份/季度/年度统计
- [ ] 鲸鱼个体活跃度分析
- [ ] 热门观测地点排行
- [ ] 物种出现频率统计

---

*最后更新：2026-03-28*
