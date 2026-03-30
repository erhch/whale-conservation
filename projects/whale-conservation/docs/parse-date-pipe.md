# ParseDatePipe - 必填日期解析管道

## 概述

`ParseDatePipe` 是一个用于处理必填日期字段的验证管道，确保查询参数或路径参数中的日期值符合 `YYYY-MM-DD` 格式且为有效日期。

## 使用场景

- 需要必填日期参数的 API 端点
- 日期范围查询的起始/结束日期
- 需要严格日期格式验证的场景
- 防止无效日期（如 2024-02-30）

## 基本用法

### 1. 基础用法（仅格式验证）

```typescript
@Get('sightings')
async getSightingsByDate(
  @Query('date', ParseDatePipe) date: Date,
) {
  // date 已经是有效的 Date 对象
  return this.sightingsService.findByDate(date);
}
```

**请求示例：**
```
GET /sightings?date=2024-03-15
```

**有效响应：**
```json
{
  "data": [...],
  "message": "success"
}
```

**无效请求示例：**
```
GET /sightings?date=2024-02-30
# 响应：400 Bad Request
# {"statusCode":400,"message":"date 不是有效的日期","error":"Bad Request"}
```

### 2. 带日期范围验证

```typescript
@Get('reports')
async getReports(
  @Query('startDate', new ParseDatePipe({ 
    minDate: '2024-01-01',
    maxDate: '2024-12-31'
  })) startDate: Date,
) {
  return this.reportsService.findByDateRange(startDate);
}
```

**验证规则：**
- `minDate`: 日期不能早于此日期
- `maxDate`: 日期不能晚于此日期

## 配置选项

| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `minDate` | `string` | 否 | 最小允许日期 (YYYY-MM-DD 格式) |
| `maxDate` | `string` | 否 | 最大允许日期 (YYYY-MM-DD 格式) |

## 验证规则

### 1. 必填验证
- `undefined`、`null`、空字符串 `''` 都会抛出异常
- 错误消息：`{参数名} 是必填项，请提供有效的日期 (YYYY-MM-DD 格式)`

### 2. 格式验证
- 必须符合 `YYYY-MM-DD` 格式
- 错误消息：`{参数名} 必须是 YYYY-MM-DD 格式的日期`

### 3. 有效性验证
- 必须是真实存在的日期（防止 2024-02-30）
- 错误消息：`{参数名} 不是有效的日期`

### 4. 范围验证
- 如果设置了 `minDate`，日期不能早于该值
- 如果设置了 `maxDate`，日期不能晚于该值
- 错误消息：`{参数名} 不能早于/晚于 {日期}`

## 完整示例

### Controller 示例

```typescript
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ParseDatePipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  
  // 示例 1: 简单日期查询
  @Get('sightings')
  async getSightings(
    @Query('date', ParseDatePipe) date: Date,
  ) {
    return this.whalesService.getSightingsByDate(date);
  }

  // 示例 2: 日期范围查询
  @Get('migrations')
  async getMigrations(
    @Query('startDate', new ParseDatePipe({ minDate: '2020-01-01' })) startDate: Date,
    @Query('endDate', new ParseDatePipe({ maxDate: '2024-12-31' })) endDate: Date,
  ) {
    return this.whalesService.getMigrationsInRange(startDate, endDate);
  }

  // 示例 3: 路径参数日期验证
  @Get('reports/:reportDate')
  async getReportByDate(
    @Param('reportDate', ParseDatePipe) reportDate: Date,
  ) {
    return this.reportsService.findByDate(reportDate);
  }
}
```

### Service 示例

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sighting } from '@/whales/entities';

@Injectable()
export class WhalesService {
  constructor(
    @InjectRepository(Sighting)
    private readonly sightingRepository: Repository<Sighting>,
  ) {}

  async getSightingsByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.sightingRepository.find({
      where: {
        sightingDate: Between(startOfDay, endOfDay),
      },
    });
  }
}
```

## 错误响应示例

### 1. 缺少必填参数
```
GET /sightings?date=
```
```json
{
  "statusCode": 400,
  "message": "date 是必填项，请提供有效的日期 (YYYY-MM-DD 格式)",
  "error": "Bad Request"
}
```

### 2. 格式错误
```
GET /sightings?date=03-15-2024
```
```json
{
  "statusCode": 400,
  "message": "date 必须是 YYYY-MM-DD 格式的日期",
  "error": "Bad Request"
}
```

### 3. 无效日期
```
GET /sightings?date=2024-02-30
```
```json
{
  "statusCode": 400,
  "message": "date 不是有效的日期",
  "error": "Bad Request"
}
```

### 4. 超出范围
```
GET /reports?startDate=2019-06-15
```
```json
{
  "statusCode": 400,
  "message": "startDate 不能早于 2020-01-01",
  "error": "Bad Request"
}
```

## 与 ParseOptionalDatePipe 的区别

| 特性 | ParseDatePipe | ParseOptionalDatePipe |
|------|---------------|----------------------|
| 必填性 | 必填 | 可选 |
| 空值处理 | 抛出异常 | 返回 undefined |
| 使用场景 | 必需日期参数 | 可选日期过滤 |

## 最佳实践

### ✅ 推荐做法

1. **始终在 API 文档中说明日期格式**
   ```typescript
   @ApiQuery({ 
     name: 'date', 
     description: '查询日期 (YYYY-MM-DD 格式)',
     required: true 
   })
   ```

2. **使用范围验证限制查询窗口**
   ```typescript
   @Query('date', new ParseDatePipe({ 
     minDate: '2020-01-01',
     maxDate: new Date().toISOString().split('T')[0]
   }))
   ```

3. **在 Service 层使用时区处理**
   ```typescript
   // 转换为 UTC 或特定时区
   const utcDate = new Date(Date.UTC(
     date.getUTCFullYear(),
     date.getUTCMonth(),
     date.getUTCDate()
   ));
   ```

### ❌ 避免做法

1. **不要混合使用不同格式的日期**
   ```typescript
   // 避免：同一 API 使用不同日期格式
   @Query('date', ParseDatePipe) date: Date,        // YYYY-MM-DD
   @Query('timestamp') timestamp: number,           // Unix timestamp
   ```

2. **不要忽略时区问题**
   ```typescript
   // 避免：直接使用 Date 对象而不考虑时区
   const today = new Date(); // 可能是昨天的 UTC 时间
   ```

## 相关文件

- `src/common/pipes/parse-date.pipe.ts` - 管道实现
- `src/common/pipes/parse-optional-date.pipe.ts` - 可选日期版本
- `src/common/pipes/parse-iso8601.pipe.ts` - ISO8601 完整格式支持
- `docs/data-dictionary.md` - 数据字典中的日期字段定义
