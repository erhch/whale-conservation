# Stations Module - 监测站点模块

## 概述

监测站点模块负责管理鲸类观测站点的信息，支持固定站点、移动站点和船只三种类型。提供站点的 CRUD 操作、按类型和状态筛选、活跃站点查询等功能。所有查询接口默认公开访问并启用 5 分钟缓存，写入操作需要 JWT 认证。

## 核心功能

| 功能 | 端点 | 认证 | 缓存 |
|------|------|------|------|
| 获取站点列表 | `GET /api/v1/stations` | ❌ 公开 | ✅ 5 分钟 |
| 获取单个站点 | `GET /api/v1/stations/:id` | ❌ 公开 | ✅ 5 分钟 |
| 获取活跃站点 | `GET /api/v1/stations/active` | ❌ 公开 | ✅ 5 分钟 |
| 创建站点 | `POST /api/v1/stations` | ✅ JWT | ❌ |
| 更新站点 | `PUT /api/v1/stations/:id` | ✅ JWT | ❌ |
| 删除站点 | `DELETE /api/v1/stations/:id` | ✅ JWT | ❌ |

## 数据模型

### Station 实体字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | 自动生成 | 主键 |
| `code` | string | ✅ | 站点代码 (唯一，如：ST001) |
| `name` | string | ✅ | 站点名称 |
| `type` | enum | 默认 fixed | 站点类型 |
| `status` | enum | 默认 active | 站点状态 |
| `latitude` | number | ✅ | 纬度 (-90 到 90) |
| `longitude` | number | ✅ | 经度 (-180 到 180) |
| `location` | string | - | 位置描述 |
| `depth` | number | - | 水深 (米) |
| `installedAt` | Date | - | 安装时间 |
| `responsiblePerson` | string | - | 负责人 |
| `contactPhone` | string | - | 联系电话 |
| `equipment` | string | - | 设备清单 (JSON 字符串) |
| `createdAt` | Date | 自动生成 | 创建时间 |
| `updatedAt` | Date | 自动生成 | 更新时间 |

### 站点类型枚举 (StationType)

| 值 | 说明 | 适用场景 |
|----|------|----------|
| `fixed` | 固定站点 | 海岸线观测站、浮标站 |
| `mobile` | 移动站点 | 临时观测点、移动监测车 |
| `vessel` | 船只 | 观测船、科考船 |

### 站点状态枚举 (StationStatus)

| 值 | 说明 |
|----|------|
| `active` | 运行中 |
| `inactive` | 停用 |
| `maintenance` | 维护中 |

## API 使用示例

### 获取站点列表 (公开)

```bash
# 基础查询 - 第 1 页，每页 10 条
curl -X GET "http://localhost:3000/api/v1/stations"

# 分页查询 - 第 2 页，每页 20 条
curl -X GET "http://localhost:3000/api/v1/stations?page=2&limit=20"

# 按站点类型筛选 - 固定站点
curl -X GET "http://localhost:3000/api/v1/stations?type=fixed"

# 按状态筛选 - 运行中站点
curl -X GET "http://localhost:3000/api/v1/stations?status=active"

# 组合筛选
curl -X GET "http://localhost:3000/api/v1/stations?type=vessel&status=active&page=1&limit=10"
```

**响应格式:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "code": "ST001",
      "name": "长江口监测站",
      "type": "fixed",
      "status": "active",
      "latitude": 31.2304,
      "longitude": 121.4737,
      "location": "上海市浦东新区长江入海口",
      "depth": 15.5,
      "installedAt": "2024-01-15T08:30:00.000Z",
      "responsiblePerson": "张三",
      "contactPhone": "13800138000",
      "equipment": "{\"cameras\": 2, \"sensors\": 5}",
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10
}
```

### 获取活跃站点 (公开)

```bash
curl -X GET "http://localhost:3000/api/v1/stations/active"
```

**响应:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "code": "ST001",
    "name": "长江口监测站",
    "type": "fixed",
    "status": "active",
    "latitude": 31.2304,
    "longitude": 121.4737,
    ...
  },
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "code": "ST002",
    "name": "南海观测船",
    "type": "vessel",
    "status": "active",
    ...
  }
]
```

### 获取单个站点详情 (公开)

```bash
curl -X GET "http://localhost:3000/api/v1/stations/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**响应:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "ST001",
  "name": "长江口监测站",
  "type": "fixed",
  "status": "active",
  "latitude": 31.2304,
  "longitude": 121.4737,
  "location": "上海市浦东新区长江入海口",
  "depth": 15.5,
  "installedAt": "2024-01-15T08:30:00.000Z",
  "responsiblePerson": "张三",
  "contactPhone": "13800138000",
  "equipment": "{\"cameras\": 2, \"sensors\": 5}",
  "environmentLogs": [
    {
      "id": "...",
      "temperature": 18.5,
      "salinity": 32.1,
      ...
    }
  ],
  "createdAt": "2024-01-15T08:30:00.000Z",
  "updatedAt": "2024-01-15T08:30:00.000Z"
}
```

### 创建新站点 (需要认证)

```bash
curl -X POST "http://localhost:3000/api/v1/stations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "ST003",
    "name": "珠江口监测站",
    "type": "fixed",
    "status": "active",
    "latitude": 22.3193,
    "longitude": 113.8008,
    "location": "广东省珠海市珠江入海口",
    "depth": 12.0,
    "responsiblePerson": "李四",
    "contactPhone": "13900139000"
  }'
```

### 更新站点信息 (需要认证)

```bash
curl -X PUT "http://localhost:3000/api/v1/stations/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "maintenance",
    "responsiblePerson": "王五"
  }'
```

### 删除站点 (需要认证)

```bash
curl -X DELETE "http://localhost:3000/api/v1/stations/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## JavaScript/TypeScript 示例

### Fetch API

```typescript
// 获取站点列表
async function getStationsList(page = 1, limit = 10, type?: string, status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  
  const response = await fetch(`/api/v1/stations?${params}`);
  return response.json();
}

// 获取活跃站点
async function getActiveStations() {
  const response = await fetch('/api/v1/stations/active');
  return response.json();
}

// 创建站点
async function createStation(token: string, stationData: any) {
  const response = await fetch('/api/v1/stations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(stationData),
  });
  return response.json();
}
```

### Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

// 获取站点列表
const stationsList = await api.get('/stations', {
  params: { page: 1, limit: 10, type: 'fixed' },
});

// 获取活跃站点
const activeStations = await api.get('/stations/active');

// 创建站点 (自动添加 Token)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const newStation = await api.post('/stations', {
  code: 'ST003',
  name: '珠江口监测站',
  latitude: 22.3193,
  longitude: 113.8008,
});
```

## 缓存说明

### 缓存策略

| 端点 | 缓存时间 | 缓存键 |
|------|----------|--------|
| `GET /stations` | 5 分钟 | `cache:/api/v1/stations?...` |
| `GET /stations/:id` | 5 分钟 | `cache:/api/v1/stations/:id` |
| `GET /stations/active` | 5 分钟 | `cache:/api/v1/stations/active` |

### 缓存失效

当创建、更新或删除站点时，相关缓存会自动清除：

- **创建站点**: 清除列表缓存 `cache:/api/v1/stations`
- **更新站点**: 清除详情缓存 `cache:/api/v1/stations/:id` + 列表缓存
- **删除站点**: 清除详情缓存 `cache:/api/v1/stations/:id` + 列表缓存

## 错误处理

| HTTP 状态码 | 说明 | 响应示例 |
|------------|------|----------|
| `200` | 成功 | `{ data: [...], total: 12, page: 1, limit: 10 }` |
| `201` | 创建成功 | `{ id: "...", code: "ST003", ... }` |
| `400` | 请求参数错误 | `{ message: "Invalid latitude", error: "Bad Request" }` |
| `401` | 未授权 (需要 JWT) | `{ message: "Unauthorized" }` |
| `404` | 站点不存在 | `{ message: "站点不存在", error: "Not Found" }` |
| `403` | 权限不足 | `{ message: "Forbidden" }` |

## 最佳实践

### 1. 站点代码命名规范

使用统一的代码格式便于识别和管理：

```
ST001 - 固定站点 (ST = Station)
MV001 - 移动站点 (MV = Mobile)
VS001 - 船只站点 (VS = Vessel)
```

### 2. 地理位置验证

确保经纬度在有效范围内：

```typescript
// DTO 中已内置验证
@IsNumber()
@Min(-90)
@Max(90)
latitude: number;

@IsNumber()
@Min(-180)
@Max(180)
longitude: number;
```

### 3. 设备清单格式

使用 JSON 字符串存储设备信息，便于扩展：

```json
{
  "cameras": 2,
  "sensors": 5,
  "hydrophone": true,
  "weatherStation": true
}
```

### 4. 分页参数验证

使用 `ParseOptionalIntPipe` 确保参数安全：

```typescript
@Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 }))
@Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
```

### 5. 活跃站点快速查询

使用专用端点获取所有活跃站点，无需分页：

```typescript
// 适用于地图展示、下拉选择等场景
@Get('active')
async findActive(): Promise<Station[]> {
  return this.stationsService.findActive();
}
```

## 与 Sightings 模块的关系

监测站点与观测记录 (Sightings) 可能存在关联关系。观测记录可以记录是在哪个站点附近发现的鲸鱼：

```typescript
// 查询某站点附近的观测记录
GET /api/v1/sightings?stationId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## 与环境日志的关系

站点可以关联多条环境日志记录 (EnvironmentLog)，记录水温、盐度、天气等环境数据：

```typescript
// Station 实体中的关联
@OneToMany(() => EnvironmentLog, (log) => log.station)
environmentLogs: EnvironmentLog[];
```

查询站点详情时会自动关联环境日志数据。

## 待扩展功能

- [ ] 站点地图可视化 (GeoJSON 输出)
- [ ] 站点覆盖范围分析
- [ ] 环境日志自动采集接口
- [ ] 站点维护计划管理
- [ ] 设备状态监控
- [ ] 站点间距离计算
- [ ] 批量导入/导出 (CSV/Excel)

## 相关文件

| 文件 | 说明 |
|------|------|
| `stations.controller.ts` | 控制器 - API 端点定义 |
| `stations.service.ts` | 服务层 - 业务逻辑 |
| `stations.module.ts` | 模块定义 |
| `entities/station.entity.ts` | TypeORM 实体定义 |
| `entities/environment-log.entity.ts` | 环境日志实体 |
| `dto/station.dto.ts` | DTO 定义 (CreateStationDto, UpdateStationDto) |

---

**最后更新:** 2026-03-29  
**模块状态:** ✅ 完成 (分页 + 筛选 + 缓存 + 活跃站点查询)
