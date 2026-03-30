# PaginationPipe 使用指南

> 分页参数验证管道 - 统一处理列表接口的分页参数 (page, limit)

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`PaginationPipe` 是用于统一处理分页参数的专用管道，自动处理页码和每页数量的解析、默认值填充和范围验证。

### 核心功能

- ✅ 自动解析 `page` 和 `limit` 参数
- ✅ 智能默认值填充 (page=1, limit=10)
- ✅ 范围验证 (页码≥1, 1≤limit≤100)
- ✅ 自动计算偏移量 (offset)
- ✅ 支持 `size` 作为 `limit` 的别名
- ✅ 友好的中文错误提示

### 返回值结构

```typescript
interface PaginationResult {
  page: number;    // 当前页码 (从 1 开始)
  limit: number;   // 每页数量
  offset: number;  // 偏移量 (用于 SQL: OFFSET)
}
```

---

## 🚀 快速开始

### 基础用法

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { PaginationPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query(new PaginationPipe()) pagination: { page: number; limit: number; offset: number }
  ) {
    // pagination = { page: 1, limit: 10, offset: 0 }
    return this.whalesService.findAll(pagination.page, pagination.limit);
  }
}
```

**请求示例:**
```bash
# 使用默认值 (第 1 页，每页 10 条)
GET /whales

# 自定义分页 (第 2 页，每页 20 条)
GET /whales?page=2&limit=20

# 使用 size 别名
GET /whales?page=3&size=50
```

---

## 📋 配置选项

### 完整配置示例

```typescript
@Get('sightings')
findSightings(
  @Query(new PaginationPipe({
    defaultPage: 1,      // 默认页码，默认值：1
    defaultLimit: 20,    // 默认每页数量，默认值：10
    minPage: 1,          // 最小页码，默认值：1
    minLimit: 5,         // 最小每页数量，默认值：1
    maxLimit: 200,       // 最大每页数量，默认值：100
  })) pagination: PaginationResult
) {
  return this.sightingsService.findAll(pagination);
}
```

### 选项说明

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultPage` | number | 1 | 未提供 page 参数时的默认页码 |
| `defaultLimit` | number | 10 | 未提供 limit 参数时的默认每页数量 |
| `minPage` | number | 1 | 允许的最小页码 |
| `minLimit` | number | 1 | 允许的最小每页数量 |
| `maxLimit` | number | 100 | 允许的最大每页数量 (防止过度查询) |

---

## 🎯 实际应用场景

### 场景 1: 鲸鱼观测记录列表

```typescript
@Get('sightings')
findSightings(
  @Query('speciesId') speciesId?: string,
  @Query('startDate') startDate?: Date,
  @Query('endDate') endDate?: Date,
  @Query(new PaginationPipe()) pagination: PaginationResult
) {
  return this.sightingsService.find({
    speciesId,
    startDate,
    endDate,
    page: pagination.page,
    limit: pagination.limit,
  });
}
```

**请求示例:**
```bash
# 查询虎鲸的观测记录 (第 1 页)
GET /sightings?speciesId=orca&page=1&limit=20

# 查询 2026 年的所有观测 (第 2 页)
GET /sightings?startDate=2026-01-01&endDate=2026-12-31&page=2&limit=50
```

---

### 场景 2: 志愿者名单 (限制每页数量)

```typescript
@Get('volunteers')
findVolunteers(
  @Query(new PaginationPipe({
    defaultLimit: 15,
    maxLimit: 50,  // 限制最大每页 50 条，防止数据库压力
  })) pagination: PaginationResult
) {
  return this.volunteersService.findAll(pagination);
}
```

---

### 场景 3: 捐赠记录导出 (允许大批量)

```typescript
@Get('donations/export')
exportDonations(
  @Query(new PaginationPipe({
    defaultLimit: 100,
    maxLimit: 1000,  // 导出接口允许更大的批量
  })) pagination: PaginationResult
) {
  return this.donationsService.export(pagination);
}
```

---

### 场景 4: 结合 Service 层使用

```typescript
// Controller
@Get('stations')
findStations(
  @Query(new PaginationPipe()) pagination: PaginationResult,
  @Query('region') region?: string
) {
  return this.stationsService.find({ ...pagination, region });
}

// Service
async find(params: { page: number; limit: number; offset: number; region?: string }) {
  const { page, limit, offset, region } = params;
  
  const [data, total] = await this.stationModel.findAndCount({
    where: region ? { region } : {},
    take: limit,
    skip: offset,  // 直接使用 pipe 计算的 offset
    order: { createdAt: 'DESC' },
  });
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## ⚠️ 错误处理

### 页码过小

```bash
GET /whales?page=0&limit=10
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "页码不能小于 1",
  "error": "Bad Request"
}
```

---

### 每页数量过大

```bash
GET /whales?page=1&limit=500
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "每页数量不能超过 100",
  "error": "Bad Request"
}
```

---

### 每页数量过小

```bash
GET /whales?page=1&limit=0
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "每页数量不能小于 1",
  "error": "Bad Request"
}
```

---

### 无效参数 (自动使用默认值)

```bash
# page 为非数字 → 使用默认值 page=1
GET /whales?page=abc&limit=20

# limit 为负数 → 使用默认值 limit=10
GET /whales?page=2&limit=-5

# 参数缺失 → 全部使用默认值
GET /whales
```

---

## 🔧 高级用法

### 配合 TypeORM 分页

```typescript
@Get('whales')
async findWhales(
  @Query(new PaginationPipe()) pagination: PaginationResult
) {
  const queryBuilder = this.whaleRepository.createQueryBuilder('whale');
  
  const [data, total] = await queryBuilder
    .setSkip(pagination.offset)  // 使用 pipe 计算的 offset
    .setTake(pagination.limit)
    .getManyAndCount();
  
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < total,
      hasPrevPage: pagination.page > 1,
    },
  };
}
```

---

### 配合 Prisma 分页

```typescript
@Get('species')
async findSpecies(
  @Query(new PaginationPipe()) pagination: PaginationResult
) {
  const [data, total] = await Promise.all([
    this.prisma.species.findMany({
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.species.count(),
  ]);
  
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
```

---

### 统一响应格式拦截器

```typescript
// 配合拦截器自动添加分页元数据
@Injectable()
export class PaginatedResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const pagination = request.query; // 假设 pagination pipe 已解析到 query
    
    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data.items,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total: data.total,
          totalPages: Math.ceil(data.total / pagination.limit),
        },
      })),
    );
  }
}
```

---

## 📊 最佳实践

### ✅ 推荐做法

1. **始终设置 maxLimit** - 防止恶意查询拖垮数据库
2. **使用 offset 而非手动计算** - 避免计算错误
3. **在响应中返回总记录数** - 方便前端显示分页控件
4. **对于大数据集考虑游标分页** - 深度分页性能问题

### ❌ 避免做法

1. **不要允许无限制的 limit** - 可能导致内存溢出
2. **不要信任客户端传入的 offset** - 始终用 pipe 重新计算
3. **避免深度分页** - page=10000&limit=100 会非常慢

---

## 🔗 相关文件

- 源码：`src/common/pipes/pagination.pipe.ts`
- 相关文档：
  - [API 设计规范](./api-design.md)
  - [API 示例](./api-examples.md)

---

<div align="center">
  <sub>🐋 Built for 生物鲸创管理系统</sub>
</div>
