# 📚 API 文档索引

> 鲸创管理系统 - 完整 API 参考

**Base URL**: `http://localhost:3000/api`  
**认证**: 所有管理接口需要 JWT Bearer Token  
**Swagger**: 启动后访问 `http://localhost:3000/api` (NestJS Swagger UI)

---

## 认证与用户 (`/auth`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/auth/register` | 用户注册 | ❌ |
| POST | `/auth/login` | 用户登录 | ❌ |
| POST | `/auth/refresh` | 刷新 Token | ❌ |
| POST | `/auth/logout` | 用户登出 | ✅ |
| GET | `/auth/profile` | 获取当前用户信息 | ✅ |
| PUT | `/auth/profile` | 更新个人信息 | ✅ |

## 物种管理 (`/species`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/species` | 获取物种列表 (分页) | ❌ |
| GET | `/species/:id` | 获取单个物种详情 | ❌ |
| POST | `/species` | 创建物种 | ✅ |
| PUT | `/species/:id` | 更新物种 | ✅ |
| DELETE | `/species/:id` | 删除物种 | ✅ |

## 鲸鱼个体 (`/whales`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/whales` | 获取鲸鱼列表 (分页+筛选) | ❌ |
| GET | `/whales/:id` | 获取单个鲸鱼详情 | ❌ |
| POST | `/whales` | 创建鲸鱼记录 | ✅ |
| PUT | `/whales/:id` | 更新鲸鱼信息 | ✅ |
| DELETE | `/whales/:id` | 删除鲸鱼记录 | ✅ |
| GET | `/whales/:id/sightings` | 获取该鲸鱼的观测记录 | ❌ |

## 观测记录 (`/sightings`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/sightings` | 获取观测记录列表 | ❌ |
| GET | `/sightings/:id` | 获取单条观测记录 | ❌ |
| POST | `/sightings` | 创建观测记录 | ✅ |
| PUT | `/sightings/:id` | 更新观测记录 | ✅ |
| DELETE | `/sightings/:id` | 删除观测记录 | ✅ |

## 监测站点 (`/stations`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/stations` | 获取站点列表 | ❌ |
| GET | `/stations/:id` | 获取单个站点 | ❌ |
| POST | `/stations` | 创建站点 | ✅ |
| PUT | `/stations/:id` | 更新站点 | ✅ |
| DELETE | `/stations/:id` | 删除站点 | ✅ |

## 环境数据 (`/environment`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/environment` | 获取环境数据 | ❌ |
| GET | `/environment/latest` | 获取最新环境数据 | ❌ |
| POST | `/environment` | 录入环境数据 | ✅ |

## 统计分析 (`/stats`)

### Phase 1 基础统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats/overview` | 总体统计概览 |
| GET | `/stats/species/distribution` | 物种分布统计 |
| GET | `/stats/sightings/trend?days=30` | 观测趋势 |
| GET | `/stats/stations` | 站点统计 |
| GET | `/stats/whales/status` | 生命状态分布 |
| GET | `/stats/whales/sex` | 性别分布 |
| GET | `/stats/species/frequency` | 物种出现频率 |
| GET | `/stats/locations/top?limit=10` | 热门观测地点 |
| GET | `/stats/sightings/weekly?weeks=12` | 周度统计 |
| GET | `/stats/sightings/monthly?months=12` | 月度统计 |
| GET | `/stats/sightings/quarterly` | 季度统计 |
| GET | `/stats/sightings/yearly` | 年度统计 |
| GET | `/stats/whales/active?limit=10` | 活跃鲸鱼排行 |
| GET | `/stats/sightings/recent?limit=10` | 最近观测记录 |
| GET | `/stats/species/:speciesId` | 指定物种详细统计 |
| GET | `/stats/sightings/behaviors` | 行为分布统计 |
| GET | `/stats/whales/:whaleId/migration` | 迁徙轨迹分析 |
| GET | `/stats/population/growth-trend` | 种群增长预测 |

### Phase 3 高级统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stats/dashboard` | 综合数据概览 |
| GET | `/stats/health/overview` | 健康统计概览 |
| GET | `/stats/health/whale/:whaleId` | 个体健康摘要 |
| GET | `/stats/behavior/stats?days=90` | 行为分布统计 |
| GET | `/stats/behavior/whale/:whaleId` | 个体行为画像 |
| GET | `/stats/feeding/stats?days=90` | 觅食统计分析 |
| GET | `/stats/genealogy/overview` | 谱系统计概览 |
| GET | `/stats/genealogy/clans` | 族群分布统计 |

## 健康记录 (`/whale-health`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/whale-health` | 获取健康记录列表 | ❌ |
| GET | `/whale-health/:id` | 获取单条健康记录 | ❌ |
| POST | `/whale-health` | 创建健康记录 | ✅ |
| POST | `/whale-health/:id` | 更新健康记录 | ✅ |
| POST | `/whale-health/:id/delete` | 删除健康记录 | ✅ |

## 行为日志 (`/behavior-logs`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/behavior-logs` | 获取行为日志列表 | ❌ |
| GET | `/behavior-logs/:id` | 获取单条行为日志 | ❌ |
| POST | `/behavior-logs` | 创建行为日志 | ✅ |
| POST | `/behavior-logs/:id` | 更新行为日志 | ✅ |
| POST | `/behavior-logs/:id/delete` | 删除行为日志 | ✅ |
| GET | `/behavior-logs/stats/:whaleId` | 个体行为统计 | ❌ |

## 觅食记录 (`/feeding-logs`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/feeding-logs` | 获取觅食记录列表 | ❌ |
| GET | `/feeding-logs/:id` | 获取单条觅食记录 | ❌ |
| POST | `/feeding-logs` | 创建觅食记录 | ✅ |
| POST | `/feeding-logs/:id/delete` | 删除觅食记录 | ✅ |

## 谱系管理 (`/genealogy`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/genealogy/records` | 创建谱系关系 | ✅ |
| GET | `/genealogy/records` | 获取谱系记录列表 | ❌ |
| GET | `/genealogy/records/:id` | 获取单条谱系记录 | ❌ |
| POST | `/genealogy/records/:id` | 更新谱系记录 | ✅ |
| POST | `/genealogy/records/:id/delete` | 删除谱系记录 | ✅ |
| GET | `/genealogy/pedigree/:whaleId` | 获取个体谱系信息 | ❌ |
| POST | `/genealogy/pedigree/:whaleId` | 更新个体谱系信息 | ✅ |
| GET | `/genealogy/tree/:whaleId` | 获取家谱树 (3代) | ❌ |
| GET | `/genealogy/descendants/:whaleId` | 获取所有后代 | ❌ |

## 数据导出 (`/export`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/export/health?format=csv` | 导出健康记录 | ❌ |
| GET | `/export/behavior?format=csv` | 导出行为日志 | ❌ |
| GET | `/export/feeding?format=csv` | 导出觅食记录 | ❌ |
| GET | `/export/genealogy?format=csv` | 导出谱系记录 | ❌ |
| GET | `/export/whales?format=csv` | 导出鲸鱼档案 | ❌ |

## 数据导入 (`/import`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/import/health` | 导入健康记录 (CSV) | ✅ |
| POST | `/import/behavior` | 导入行为日志 (CSV) | ✅ |
| POST | `/import/feeding` | 导入觅食记录 (CSV) | ✅ |

## 搜索与过滤 (`/search`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/search/global?q=xxx` | 全局搜索 | ❌ |
| GET | `/search/whales?q=&speciesId=` | 搜索鲸鱼个体 | ❌ |
| GET | `/search/health?q=&type=` | 搜索健康记录 | ❌ |
| GET | `/search/behavior?type=&intensity=` | 搜索行为日志 | ❌ |
| GET | `/search/feeding?method=` | 搜索觅食记录 | ❌ |
| GET | `/search/genealogy?type=&confidence=` | 搜索谱系记录 | ❌ |

## 审计日志 (`/audit`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/audit` | 查询审计日志列表 | ✅ |
| GET | `/audit/entity/:type/:id` | 实体变更历史 | ✅ |
| GET | `/audit/user/:id/summary` | 用户操作统计 | ✅ |

## 批量操作 (`/batch`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/batch/whales/status` | 批量更新鲸鱼状态 | ✅ |
| POST | `/batch/whales/delete` | 批量删除鲸鱼 | ✅ |
| POST | `/batch/health/status` | 批量更新健康状态 | ✅ |
| POST | `/batch/behavior/verify` | 批量验证行为日志 | ✅ |
| POST | `/batch/feeding/verify` | 批量验证觅食记录 | ✅ |
| POST | `/batch/:entityType/delete` | 通用批量删除 | ✅ |

## 通知与告警 (`/notifications`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/notifications` | 查询通知列表 | ✅ |
| GET | `/notifications/overview` | 通知统计概览 | ✅ |
| GET | `/notifications/unread/count` | 未读通知数量 | ✅ |
| POST | `/notifications/scan` | 手动扫描生成告警 | ✅ |
| POST | `/notifications/:id/read` | 标记通知已读 | ✅ |
| POST | `/notifications/:id/resolve` | 标记通知已解决 | ✅ |
| POST | `/notifications/read-all` | 批量标记已读 | ✅ |

## 管理后台 (`/admin`)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/admin/dashboard` | 全系统概览 | ✅ |
| GET | `/admin/data-quality` | 数据质量评估 | ✅ |

## 健康检查

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/health` | 服务健康检查 | ❌ |

---

## 通用参数

### 分页参数 (适用于所有列表接口)
- `page` — 页码 (默认 1)
- `limit` — 每页数量 (默认 20, 最大 100)

### 日期格式
- 所有日期使用 ISO 8601 格式: `2026-04-07T08:00:00+08:00`

### 响应格式
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### 错误响应格式
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "name must be a string"
    }
  ]
}
```

---

## 速率限制

- 默认: **100 次/分钟** 每 IP + 路由
- 使用 `@RateLimit(次数)` 和 `@RateLimitTTL(秒数)` 装饰器可自定义
- 超出限制返回 `429 Too Many Requests`
