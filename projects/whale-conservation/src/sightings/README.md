# 📋 Sightings Module - 观测记录模块

观测记录模块用于管理鲸鱼观测数据，支持观测记录的创建、查询、更新和删除。

## 📖 模块概述

观测记录是鲸类保护研究的核心数据来源。本模块提供完整的观测记录管理功能，支持：

- 📍 **地理位置记录**：纬度、经度、地点名称
- 🐋 **关联鲸鱼个体**：追踪特定鲸鱼的观测历史
- 🏠 **关联监测站点**：记录观测来源站点
- 👤 **观测者信息**：记录观测人员
- 📷 **照片附件**：支持多张照片 URLs
- 🌊 **环境数据**：天气、海况等级
- ✅ **数据验证**：支持观测记录验证标记

## 📊 数据模型

### Sighting 实体

```typescript
@Entity('sightings')
export class Sighting {
  id: string;              // UUID 主键
  whaleId: string | null;  // 关联鲸鱼 ID (可空)
  stationId: string | null; // 关联监测站点 ID (可空)
  observerId: string;      // 观测者 ID (必填)
  observedAt: Date;        // 观测时间
  latitude: number;        // 纬度 (-90 到 90)
  longitude: number;       // 经度 (-180 到 180)
  locationName: string;    // 地点名称 (可选)
  behavior: string;        // 行为描述 (可选)
  groupSize: number;       // 群体数量 (可选)
  notes: string;           // 备注 (可选)
  photoUrls: string[];     // 照片 URLs 数组 (可选)
  weather: string;         // 天气状况 (可选)
  seaState: number;        // 海况等级 0-9 (可选)
  isVerified: boolean;     // 是否已验证 (默认 true)
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | 自动生成 | 观测记录唯一标识 |
| `whaleId` | UUID | 否 | 关联的鲸鱼个体 ID，支持群体观测时无具体个体 |
| `stationId` | UUID | 否 | 关联的监测站点 ID |
| `observerId` | UUID | 是 | 观测者用户 ID |
| `observedAt` | Date | 是 | 观测发生的时间 |
| `latitude` | number | 是 | 纬度，范围 -90 到 90 |
| `longitude` | number | 是 | 经度，范围 -180 到 180 |
| `locationName` | string | 否 | 地点名称，如"南海北部海域" |
| `behavior` | string | 否 | 鲸鱼行为描述，如"跃出水面"、"喷气" |
| `groupSize` | number | 否 | 观测到的鲸鱼群体数量 |
| `notes` | string | 否 | 详细备注信息 |
| `photoUrls` | string[] | 否 | 照片 URL 数组，支持多张照片 |
| `weather` | string | 否 | 天气状况，如"晴"、"多云"、"小雨" |
| `seaState` | number | 否 | 海况等级，0-9 级 (Douglas 海况等级) |
| `isVerified` | boolean | 默认 true | 数据验证状态 |

### 海况等级参考 (Douglas Sea Scale)

| 等级 | 描述 | 浪高 (米) |
|------|------|-----------|
| 0 | 无浪 | 0 |
| 1 | 微浪 | 0-0.1 |
| 2 | 小浪 | 0.1-0.5 |
| 3 | 轻浪 | 0.5-1.25 |
| 4 | 中浪 | 1.25-2.5 |
| 5 | 大浪 | 2.5-4 |
| 6 | 巨浪 | 4-6 |
| 7 | 狂浪 | 6-9 |
| 8 | 狂涛 | 9-14 |
| 9 | 怒涛 | >14 |

## 🔌 API 端点

### 1. 获取观测记录列表

```http
GET /api/v1/sightings
```

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 10 | 每页数量 (最大 100) |
| `whaleId` | string | - | 按鲸鱼 ID 筛选 |
| `stationId` | string | - | 按站点 ID 筛选 |

**响应示例:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "whaleId": "123e4567-e89b-12d3-a456-426614174000",
      "stationId": "987fcdeb-51a2-43d1-b890-123456789abc",
      "observerId": "user-uuid-here",
      "observedAt": "2026-03-28T10:30:00.000Z",
      "latitude": 22.5431,
      "longitude": 114.0579,
      "locationName": "深圳大鹏湾",
      "behavior": "跃出水面，喷水",
      "groupSize": 3,
      "notes": "观察到三只中华白海豚在觅食",
      "photoUrls": ["https://storage.example.com/photo1.jpg"],
      "weather": "晴",
      "seaState": 2,
      "isVerified": true,
      "createdAt": "2026-03-28T11:00:00.000Z",
      "updatedAt": "2026-03-28T11:00:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

**cURL 示例:**

```bash
# 获取列表 (带分页)
curl -X GET "http://localhost:3000/api/v1/sightings?page=1&limit=20"

# 按鲸鱼筛选
curl -X GET "http://localhost:3000/api/v1/sightings?whaleId=123e4567-e89b-12d3-a456-426614174000"

# 按站点筛选
curl -X GET "http://localhost:3000/api/v1/sightings?stationId=987fcdeb-51a2-43d1-b890-123456789abc"
```

---

### 2. 获取单个观测记录详情

```http
GET /api/v1/sightings/:id
```

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 观测记录 ID |

**响应示例:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "whaleId": "123e4567-e89b-12d3-a456-426614174000",
  "stationId": "987fcdeb-51a2-43d1-b890-123456789abc",
  "observerId": "user-uuid-here",
  "observedAt": "2026-03-28T10:30:00.000Z",
  "latitude": 22.5431,
  "longitude": 114.0579,
  "locationName": "深圳大鹏湾",
  "behavior": "跃出水面，喷水",
  "groupSize": 3,
  "notes": "观察到三只中华白海豚在觅食",
  "photoUrls": ["https://storage.example.com/photo1.jpg"],
  "weather": "晴",
  "seaState": 2,
  "isVerified": true,
  "createdAt": "2026-03-28T11:00:00.000Z",
  "updatedAt": "2026-03-28T11:00:00.000Z"
}
```

**cURL 示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/sightings/550e8400-e29b-41d4-a716-446655440000"
```

---

### 3. 获取某只鲸鱼的所有观测记录

```http
GET /api/v1/sightings/whale/:whaleId
```

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `whaleId` | UUID | 鲸鱼个体 ID |

**响应示例:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "whaleId": "123e4567-e89b-12d3-a456-426614174000",
    "observedAt": "2026-03-28T10:30:00.000Z",
    "latitude": 22.5431,
    "longitude": 114.0579,
    "behavior": "跃出水面",
    "groupSize": 1
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "whaleId": "123e4567-e89b-12d3-a456-426614174000",
    "observedAt": "2026-03-25T14:15:00.000Z",
    "latitude": 22.6123,
    "longitude": 114.1234,
    "behavior": "觅食",
    "groupSize": 2
  }
]
```

**cURL 示例:**

```bash
curl -X GET "http://localhost:3000/api/v1/sightings/whale/123e4567-e89b-12d3-a456-426614174000"
```

---

### 4. 创建新观测记录

```http
POST /api/v1/sightings
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**请求体:**

```json
{
  "whaleId": "123e4567-e89b-12d3-a456-426614174000",
  "stationId": "987fcdeb-51a2-43d1-b890-123456789abc",
  "observedAt": "2026-03-28T10:30:00.000Z",
  "latitude": 22.5431,
  "longitude": 114.0579,
  "locationName": "深圳大鹏湾",
  "behavior": "跃出水面，喷水",
  "groupSize": 3,
  "notes": "观察到三只中华白海豚在觅食",
  "photoUrls": ["https://storage.example.com/photo1.jpg"],
  "weather": "晴",
  "seaState": 2
}
```

**必填字段:**
- `observerId` (从 JWT Token 自动获取)
- `observedAt`
- `latitude`
- `longitude`

**响应示例:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "whaleId": "123e4567-e89b-12d3-a456-426614174000",
  "stationId": "987fcdeb-51a2-43d1-b890-123456789abc",
  "observerId": "user-uuid-here",
  "observedAt": "2026-03-28T10:30:00.000Z",
  "latitude": 22.5431,
  "longitude": 114.0579,
  "locationName": "深圳大鹏湾",
  "behavior": "跃出水面，喷水",
  "groupSize": 3,
  "notes": "观察到三只中华白海豚在觅食",
  "photoUrls": ["https://storage.example.com/photo1.jpg"],
  "weather": "晴",
  "seaState": 2,
  "isVerified": true,
  "createdAt": "2026-03-28T11:00:00.000Z",
  "updatedAt": "2026-03-28T11:00:00.000Z"
}
```

**cURL 示例:**

```bash
curl -X POST "http://localhost:3000/api/v1/sightings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "observedAt": "2026-03-28T10:30:00.000Z",
    "latitude": 22.5431,
    "longitude": 114.0579,
    "locationName": "深圳大鹏湾",
    "behavior": "跃出水面",
    "groupSize": 1,
    "weather": "晴",
    "seaState": 2
  }'
```

---

### 5. 更新观测记录

```http
PUT /api/v1/sightings/:id
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 观测记录 ID |

**请求体 (所有字段可选，PATCH 模式):**

```json
{
  "behavior": "更新后的行为描述",
  "notes": "更新后的备注",
  "isVerified": false
}
```

**cURL 示例:**

```bash
curl -X PUT "http://localhost:3000/api/v1/sightings/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "behavior": "更新后的行为描述",
    "isVerified": false
  }'
```

---

### 6. 删除观测记录

```http
DELETE /api/v1/sightings/:id
Authorization: Bearer <JWT_TOKEN>
```

**路径参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 观测记录 ID |

**响应:** `204 No Content`

**cURL 示例:**

```bash
curl -X DELETE "http://localhost:3000/api/v1/sightings/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

### 7. 导出观测记录为 CSV (新增)

```http
GET /api/v1/sightings/export/csv
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | Date | 否 | 开始日期 (ISO 8601) |
| `endDate` | Date | 否 | 结束日期 (ISO 8601) |
| `whaleId` | UUID | 否 | 按鲸鱼 ID 筛选 |
| `stationId` | UUID | 否 | 按站点 ID 筛选 |
| `limit` | number | 否 | 最大导出数量，默认 1000，最大 1000 |

**响应格式:** `text/csv`

**CSV 字段说明:**

| 字段 | 说明 |
|------|------|
| `ID` | 观测记录 UUID |
| `观测时间` | 观测发生时间 (ISO 8601) |
| `鲸鱼编号` | 鲸鱼个体编号 (如 BCX001) |
| `鲸鱼昵称` | 鲸鱼昵称 (如大白) |
| `物种名称` | 物种中文名 (如座头鲸) |
| `站点名称` | 监测站点名称 |
| `观测者` | 观测者姓名 |
| `纬度` | 观测点纬度 |
| `经度` | 观测点经度 |
| `地点名称` | 地点名称 |
| `行为` | 鲸鱼行为描述 |
| `群体数量` | 观测到的群体数量 |
| `天气` | 天气状况 |
| `海况等级` | Douglas 海况等级 (0-9) |
| `备注` | 详细备注 |
| `照片数量` | 关联照片数量 |
| `是否验证` | 数据验证状态 (是/否) |
| `创建时间` | 记录创建时间 (ISO 8601) |

**cURL 示例:**

```bash
# 导出全部记录 (默认前 1000 条)
curl -X GET "http://localhost:3000/api/v1/sightings/export/csv" -o sightings.csv

# 按日期范围导出
curl -X GET "http://localhost:3000/api/v1/sightings/export/csv?startDate=2026-03-01&endDate=2026-03-31" -o march-sightings.csv

# 导出特定鲸鱼的观测记录
curl -X GET "http://localhost:3000/api/v1/sightings/export/csv?whaleId=123e4567-e89b-12d3-a456-426614174000" -o whale-bcx001.csv

# 导出特定站点的数据
curl -X GET "http://localhost:3000/api/v1/sightings/export/csv?stationId=987fcdeb-51a2-43d1-b890-123456789abc&limit=500" -o station-data.csv
```

**使用场景:**

- 📊 **数据分析** - 导出到 Excel/SPSS/R 进行统计分析
- 📋 **报告生成** - 用于月度/年度观测报告
- 🗄️ **数据备份** - 定期导出备份观测数据
- 🔬 **研究协作** - 与研究机构共享观测数据

---

### 8. 获取观测统计概览 (新增)

```http
GET /api/v1/sightings/stats/overview
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `startDate` | Date | 否 | 开始日期 (ISO 8601) |
| `endDate` | Date | 否 | 结束日期 (ISO 8601) |
| `whaleId` | UUID | 否 | 按鲸鱼 ID 筛选 |
| `stationId` | UUID | 否 | 按站点 ID 筛选 |

**响应示例:**

```json
{
  "total": 156,
  "verifiedCount": 142,
  "uniqueWhales": 23,
  "avgGroupSize": 2.4,
  "topLocations": [
    { "locationName": "深圳大鹏湾", "count": 45 },
    { "locationName": "南海北部海域", "count": 38 },
    { "locationName": "台湾海峡", "count": 27 },
    { "locationName": "北部湾", "count": 22 },
    { "locationName": "珠江口", "count": 18 }
  ],
  "recentTrend": [
    { "date": "2026-03-23", "count": 12 },
    { "date": "2026-03-24", "count": 18 },
    { "date": "2026-03-25", "count": 15 },
    { "date": "2026-03-26", "count": 22 },
    { "date": "2026-03-27", "count": 19 },
    { "date": "2026-03-28", "count": 25 },
    { "date": "2026-03-29", "count": 14 }
  ]
}
```

**统计字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | number | 总观测记录数 |
| `verifiedCount` | number | 已验证记录数 |
| `uniqueWhales` | number | 观测到的唯一鲸鱼数量 |
| `avgGroupSize` | number | 平均群体数量 (保留 2 位小数) |
| `topLocations` | array | 热门观测地点 TOP 5 |
| `recentTrend` | array | 近 7 天观测趋势 (按日期分组) |

**cURL 示例:**

```bash
# 获取全部统计
curl -X GET "http://localhost:3000/api/v1/sightings/stats/overview"

# 按日期范围筛选
curl -X GET "http://localhost:3000/api/v1/sightings/stats/overview?startDate=2026-03-01&endDate=2026-03-31"

# 按鲸鱼筛选
curl -X GET "http://localhost:3000/api/v1/sightings/stats/overview?whaleId=123e4567-e89b-12d3-a456-426614174000"

# 按站点筛选
curl -X GET "http://localhost:3000/api/v1/sightings/stats/overview?stationId=987fcdeb-51a2-43d1-b890-123456789abc"
```

**使用场景:**

- 📊 **仪表板展示** - 首页统计卡片数据源
- 📈 **趋势分析** - 近 7 天观测热度变化
- 🗺️ **热点地图** - 热门观测地点分布
- 🐋 **种群分析** - 特定鲸鱼的活动频率

---

## 🔒 权限控制

| 端点 | 认证要求 | 角色要求 |
|------|----------|----------|
| `GET /sightings` | ❌ 公开 | - |
| `GET /sightings/:id` | ❌ 公开 | - |
| `GET /sightings/whale/:whaleId` | ❌ 公开 | - |
| `POST /sightings` | ✅ JWT | 任意认证用户 |
| `PUT /sightings/:id` | ✅ JWT | 任意认证用户 |
| `DELETE /sightings/:id` | ✅ JWT | admin, researcher |

**注意:** 当前实现中，所有认证用户都可以创建和更新观测记录。删除操作建议限制为管理员或研究员角色。

---

## 💻 客户端示例

### JavaScript (Fetch)

```javascript
// 获取观测记录列表
async function getSightings(page = 1, limit = 10) {
  const response = await fetch(
    `http://localhost:3000/api/v1/sightings?page=${page}&limit=${limit}`
  );
  return response.json();
}

// 创建观测记录
async function createSighting(token, sightingData) {
  const response = await fetch('http://localhost:3000/api/v1/sightings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sightingData)
  });
  return response.json();
}

// 使用示例
const sightings = await getSightings(1, 20);
console.log(`共 ${sightings.total} 条记录`);

const newSighting = await createSighting(token, {
  observedAt: new Date().toISOString(),
  latitude: 22.5431,
  longitude: 114.0579,
  locationName: '深圳大鹏湾',
  behavior: '跃出水面',
  groupSize: 1
});
```

### TypeScript (Axios)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

interface Sighting {
  id: string;
  whaleId?: string;
  stationId?: string;
  observerId: string;
  observedAt: Date;
  latitude: number;
  longitude: number;
  locationName?: string;
  behavior?: string;
  groupSize?: number;
  notes?: string;
  photoUrls?: string[];
  weather?: string;
  seaState?: number;
  isVerified: boolean;
}

interface SightingListResponse {
  data: Sighting[];
  total: number;
  page: number;
  limit: number;
}

export const sightingsApi = {
  findAll: async (page = 1, limit = 10, whaleId?: string, stationId?: string): Promise<SightingListResponse> => {
    const { data } = await api.get('/sightings', { params: { page, limit, whaleId, stationId } });
    return data;
  },

  findOne: async (id: string): Promise<Sighting> => {
    const { data } = await api.get(`/sightings/${id}`);
    return data;
  },

  findByWhale: async (whaleId: string): Promise<Sighting[]> => {
    const { data } = await api.get(`/sightings/whale/${whaleId}`);
    return data;
  },

  create: async (token: string, sightingData: Partial<Sighting>): Promise<Sighting> => {
    const { data } = await api.post('/sightings', sightingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  update: async (token: string, id: string, sightingData: Partial<Sighting>): Promise<Sighting> => {
    const { data } = await api.put(`/sightings/${id}`, sightingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  },

  remove: async (token: string, id: string): Promise<void> => {
    await api.delete(`/sightings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};
```

---

## 🚀 使用场景

### 1. 野外观测记录

```typescript
// 志愿者在野外观察到鲸鱼，快速记录
await sightingsApi.create(token, {
  observedAt: new Date().toISOString(),
  latitude: 22.5431,
  longitude: 114.0579,
  locationName: '深圳大鹏湾',
  behavior: '跃出水面，喷水',
  groupSize: 3,
  weather: '晴',
  seaState: 2,
  photoUrls: ['https://storage.example.com/photo1.jpg']
});
```

### 2. 追踪特定鲸鱼

```typescript
// 获取某只鲸鱼的所有观测记录，分析其活动轨迹
const whaleSightings = await sightingsApi.findByWhale('whale-uuid');
console.log(`这只鲸鱼被观测到 ${whaleSightings.length} 次`);

// 按时间排序，查看最新活动
const sorted = whaleSightings.sort((a, b) => 
  new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
);
```

### 3. 站点数据统计

```typescript
// 获取某站点的所有观测记录
const stationSightings = await sightingsApi.findAll(1, 100, undefined, 'station-uuid');
console.log(`该站点共有 ${stationSightings.total} 次观测记录`);
```

### 4. 数据验证流程

```typescript
// 管理员审核观测记录
await sightingsApi.update(token, 'sighting-uuid', {
  isVerified: true  // 标记为已验证
});
```

---

## ⚠️ 注意事项

### 坐标验证

- 纬度范围：-90 到 90
- 经度范围：-180 到 180
- 建议在创建 DTO 中添加验证装饰器

### 照片存储

- `photoUrls` 字段存储的是 URL 数组，不是文件本身
- 实际文件应上传到对象存储 (MinIO/S3)
- 建议使用 `stations` 模块的文件上传接口

### 数据验证

- `isVerified` 字段用于标记数据质量
- 新创建的记录默认为 `true`，可根据需要调整为 `false` 待审核
- 建议实现审核工作流

### 缓存策略

- 列表接口已启用 `CacheInterceptor`，默认缓存 5 分钟
- 创建/更新/删除操作后需手动清除缓存
- 示例：

```typescript
// 创建观测记录后清除缓存
async create(createSightingDto: CreateSightingDto) {
  const result = await this.sightingsRepository.save(createSightingDto);
  this.cacheInterceptor.clearCache('cache:/api/v1/sightings');
  return result;
}
```

---

## 🔗 关联模块

| 模块 | 关系 | 说明 |
|------|------|------|
| `Whales` | 多对一 | 一条观测记录关联一只鲸鱼 (可选) |
| `Stations` | 多对一 | 一条观测记录关联一个监测站点 (可选) |
| `Auth` | 多对一 | 一条观测记录关联一个观测者用户 |
| `Stats` | 被统计 | 观测记录是统计分析的数据源 |

---

## 📝 待扩展功能

- [ ] 批量导入观测记录 (CSV/Excel)
- [ ] 观测记录审核工作流
- [ ] 照片上传接口集成
- [ ] 地理位置验证 (海洋区域检查)
- [x] 观测数据导出 (CSV/GeoJSON) - ✅ 已实现 `/export/csv` 端点
- [ ] 迁徙轨迹分析 API
- [x] 观测热度统计 (按时间/地点) - ✅ 已实现 `/stats/overview` 端点

---

**最后更新:** 2026-03-29  
**维护者:** 鲸创项目开发团队
