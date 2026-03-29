# 🌊 Environment Module - 环境日志模块

> 监测站点环境数据采集与管理 (水温/盐度/PH 值/溶解氧等)

## 📖 模块概述

Environment 模块用于记录和管理监测站点的环境数据，支持多种海洋环境参数的采集、查询和分析。

### 核心功能

- ✅ 创建环境日志记录
- ✅ 按站点查询环境数据 (分页)
- ✅ 获取站点最近环境数据
- ✅ 按时间范围查询
- ✅ 删除环境记录

### 环境参数

| 参数 | 单位 | 范围 | 说明 |
|------|------|------|------|
| `waterTemperature` | °C | -5 ~ 40 | 水温 |
| `salinity` | ppt | 0 ~ 50 | 盐度 (千分比) |
| `phLevel` | - | 0 ~ 14 | PH 值 |
| `dissolvedOxygen` | mg/L | 0 ~ 20 | 溶解氧 |
| `turbidity` | NTU | 0 ~ 100 | 浊度 |
| `chlorophyll` | μg/L | 0 ~ 50 | 叶绿素 |

## 🏗️ 模块结构

```
environment/
├── environment.controller.ts    # 环境日志控制器
├── environment.service.ts       # 环境日志服务
├── environment.module.ts        # 模块定义
├── entities/
│   └── environment.entity.ts    # 环境日志实体
└── dto/
    ├── create-environment.dto.ts # 创建请求 DTO
    └── index.ts                  # 统一导出
```

## 🚀 API 使用示例

### 1. 创建环境日志记录

```bash
POST /api/v1/environment
Content-Type: application/json
Authorization: Bearer <token>

{
  "stationId": "550e8400-e29b-41d4-a716-446655440000",
  "recordedAt": "2026-03-29T14:30:00.000Z",
  "waterTemperature": 18.5,
  "salinity": 35.2,
  "phLevel": 8.1,
  "dissolvedOxygen": 7.5,
  "turbidity": 2.3,
  "chlorophyll": 1.2,
  "notes": "正常观测"
}
```

**响应示例:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440100",
  "station": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "ST001",
    "name": "东海监测站",
    "type": "fixed",
    "status": "active"
  },
  "station_id": "550e8400-e29b-41d4-a716-446655440000",
  "recorded_at": "2026-03-29T14:30:00.000Z",
  "water_temperature": 18.5,
  "salinity": 35.2,
  "ph_level": 8.1,
  "dissolved_oxygen": 7.5,
  "turbidity": 2.3,
  "chlorophyll": 1.2,
  "notes": "正常观测",
  "created_at": "2026-03-29T14:35:00.000Z"
}
```

### 2. 获取站点的环境数据列表

```bash
GET /api/v1/environment/station/:stationId?page=1&limit=10
Authorization: Bearer <token>
```

**响应示例:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "station": { ... },
      "recorded_at": "2026-03-29T14:30:00.000Z",
      "water_temperature": 18.5,
      "salinity": 35.2,
      "ph_level": 8.1,
      "dissolved_oxygen": 7.5
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### 3. 获取站点最近的环境数据

```bash
GET /api/v1/environment/station/:stationId/recent?limit=5
Authorization: Bearer <token>
```

**响应示例:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "recorded_at": "2026-03-29T14:30:00.000Z",
    "water_temperature": 18.5,
    "salinity": 35.2,
    "ph_level": 8.1
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440099",
    "recorded_at": "2026-03-29T13:30:00.000Z",
    "water_temperature": 18.3,
    "salinity": 35.1,
    "ph_level": 8.0
  }
]
```

### 4. 获取单个环境记录

```bash
GET /api/v1/environment/:id
Authorization: Bearer <token>
```

### 5. 删除环境记录

```bash
DELETE /api/v1/environment/:id
Authorization: Bearer <token>
```

**响应示例:**

```json
{
  "message": "环境记录已删除"
}
```

## 📝 数据模型

### EnvironmentLog 实体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | ✅ | 主键 |
| `station` | Stations | ✅ | 关联站点 (eager) |
| `station_id` | UUID | ✅ | 站点 ID (外键) |
| `recorded_at` | Date | ✅ | 记录时间 |
| `water_temperature` | Decimal | ❌ | 水温 (°C) |
| `salinity` | Decimal | ❌ | 盐度 (ppt) |
| `ph_level` | Decimal | ❌ | PH 值 |
| `dissolved_oxygen` | Decimal | ❌ | 溶解氧 (mg/L) |
| `turbidity` | Decimal | ❌ | 浊度 (NTU) |
| `chlorophyll` | Decimal | ❌ | 叶绿素 (μg/L) |
| `notes` | Text | ❌ | 备注 |
| `created_at` | Date | ✅ | 创建时间 |

### 数据库索引

| 索引 | 字段 | 类型 | 说明 |
|------|------|------|------|
| `PK_environment_log` | id | Primary | 主键索引 |
| `IDX_environment_station` | station_id | Index | 站点外键索引 |
| `IDX_environment_recorded` | recorded_at | Index | 时间索引 |
| `IDX_environment_station_time` | station_id, recorded_at | Composite | 复合索引 (常用查询) |

## 🔧 技术实现

### 验证规则

```typescript
// CreateEnvironmentDto 验证规则

@IsUUID()
stationId: string;

@IsISO8601()
recordedAt: string;

@IsNumber()
@Min(-5)
@Max(40)
waterTemperature?: number;

@IsNumber()
@Min(0)
@Max(50)
salinity?: number;

@IsNumber()
@Min(0)
@Max(14)
phLevel?: number;

@IsNumber()
@Min(0)
@Max(20)
dissolvedOxygen?: number;

@IsNumber()
@Min(0)
@Max(100)
turbidity?: number;

@IsNumber()
@Min(0)
@Max(50)
chlorophyll?: number;

@Length(0, 500)
notes?: string;
```

### 查询优化

- ✅ **复合索引**: `station_id + recorded_at` 加速站点时间范围查询
- ✅ **分页支持**: 防止一次性加载大量数据
- ✅ **时间排序**: 默认按记录时间倒序 (最新优先)

## 📊 使用场景

| 场景 | API 端点 | 说明 |
|------|----------|------|
| 实时数据采集 | `POST /environment` | 自动采集设备上报数据 |
| 历史数据查询 | `GET /environment/station/:id` | 查看站点历史环境数据 |
| 最近数据概览 | `GET /environment/station/:id/recent` | 快速获取最新数据 |
| 趋势分析 | `GET /environment/station/:id` + 时间范围 | 分析环境参数变化趋势 |
| 数据管理 | `DELETE /environment/:id` | 删除错误记录 |

## 🔗 模块关系

```
EnvironmentLog → Stations (ManyToOne)
    ↓
  环境数据关联到监测站点
```

## ⚠️ 注意事项

1. **时间戳格式**: `recordedAt` 必须为 ISO 8601 格式
2. **参数范围**: 所有环境参数都有合理的数值范围验证
3. **权限控制**: 当前所有接口需要 JWT 认证 (后续可按需调整)
4. **数据频率**: 建议每小时记录一次，避免过度频繁

## 📈 待扩展功能

- [ ] 批量创建环境记录 (批量上报)
- [ ] 环境数据异常检测 (阈值告警)
- [ ] 环境数据趋势分析 API
- [ ] 导出环境数据为 CSV
- [ ] 按时间范围查询端点
- [ ] 环境数据可视化支持

---

*版本：1.0.0 | 最后更新：2026-03-29*
