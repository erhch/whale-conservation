# ParseISO8601Pipe - ISO 8601 日期解析管道

## 📋 概述

`ParseISO8601Pipe` 是一个用于处理查询参数中**必填日期字段**的验证管道。它专门用于解析和验证 ISO 8601 格式的日期时间字符串。

### 核心特性

- ✅ **必填字段验证** - 不接受 `undefined`、`null` 或空字符串
- ✅ **ISO 8601 格式支持** - 支持 `YYYY-MM-DD` 和 `YYYY-MM-DDTHH:mm:ss.sssZ`
- ✅ **范围验证** - 可配置 `min` 和 `max` 日期边界
- ✅ **自动类型转换** - 字符串 → `Date` 对象
- ✅ **清晰的错误提示** - 友好的中文错误消息

---

## 🔧 基本用法

### 1. 必填日期查询参数

```typescript
@Get('sightings')
async findSightings(
  @Query('date', ParseISO8601Pipe) date: Date,
) {
  // date 一定是有效的 Date 对象
  return this.sightingsService.findByDate(date);
}
```

**请求示例：**
```
GET /api/v1/sightings?date=2026-03-31
GET /api/v1/sightings?date=2026-03-31T14:30:00.000Z
```

**错误响应（缺少参数）：**
```json
{
  "statusCode": 400,
  "message": "date 是必填项，请提供有效的日期 (ISO 8601 格式)",
  "error": "Bad Request"
}
```

---

### 2. 带范围验证的日期参数

```typescript
@Get('reports')
async findReports(
  @Query('startDate', new ParseISO8601Pipe({ 
    min: new Date('2026-01-01') 
  })) startDate: Date,
  @Query('endDate', new ParseISO8601Pipe({ 
    max: new Date() 
  })) endDate: Date,
) {
  return this.reportsService.findBetween(startDate, endDate);
}
```

**有效请求：**
```
GET /api/v1/reports?startDate=2026-03-01&endDate=2026-03-31
```

**错误响应（超出范围）：**
```json
{
  "statusCode": 400,
  "message": "startDate 不能早于 2026-01-01T00:00:00.000Z",
  "error": "Bad Request"
}
```

---

## ⚙️ 配置选项

### ParseISO8601Options 接口

```typescript
export interface ParseISO8601Options {
  min?: Date;  // 最小允许日期
  max?: Date;  // 最大允许日期
}
```

### 选项详解

| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `min` | `Date` | 否 | 日期不能早于此值 |
| `max` | `Date` | 否 | 日期不能晚于此值 |

---

## 📝 实际应用场景

### 场景 1：观测记录查询

```typescript
@Get('whales/:id/sightings')
async getWhaleSightings(
  @Param('id') whaleId: string,
  @Query('date', ParseISO8601Pipe) date: Date,
) {
  return this.sightingsService.findOneByWhaleAndDate(whaleId, date);
}
```

**使用示例：**
```bash
# 查询特定日期的观测记录
curl "http://localhost:3000/api/v1/whales/abc-123/sightings?date=2026-03-15"
```

---

### 场景 2：数据导出（带范围验证）

```typescript
@Get('export/sightings')
async exportSightings(
  @Query('from', new ParseISO8601Pipe({ 
    min: new Date('2020-01-01') 
  })) fromDate: Date,
  @Query('to', new ParseISO8601Pipe({ 
    max: new Date() 
  })) toDate: Date,
) {
  // 确保导出范围合理
  if (fromDate > toDate) {
    throw new BadRequestException('开始日期不能晚于结束日期');
  }
  
  return this.exportService.exportSightings(fromDate, toDate);
}
```

---

### 场景 3：活动报名截止验证

```typescript
@Post('events/:id/register')
async registerForEvent(
  @Param('id') eventId: string,
  @Body('registrationDate', ParseISO8601Pipe) registrationDate: Date,
) {
  const event = await this.eventsService.findOne(eventId);
  
  // 验证报名日期是否在活动开始前
  if (registrationDate >= event.startDate) {
    throw new BadRequestException('报名必须在活动开始前完成');
  }
  
  return this.eventsService.register(eventId, registrationDate);
}
```

---

### 场景 4：科研数据提交

```typescript
@Post('research/observations')
async submitObservation(
  @Body() observationDto: CreateObservationDto,
  @Body('observationTime', new ParseISO8601Pipe({
    max: new Date()  // 不能是未来时间
  })) observationTime: Date,
) {
  // observationTime 一定是有效的过去或当前时间
  return this.observationsService.create({
    ...observationDto,
    observationTime,
  });
}
```

---

## ❌ 错误处理

### 错误类型对照表

| 场景 | 错误消息 | HTTP 状态码 |
|------|----------|-------------|
| 参数缺失 | `{参数} 是必填项，请提供有效的日期 (ISO 8601 格式)` | 400 |
| 空字符串 | `{参数} 是必填项，请提供有效的日期 (ISO 8601 格式)` | 400 |
| 格式无效 | `{参数} 必须是有效的日期格式 (ISO 8601)` | 400 |
| 早于最小值 | `{参数} 不能早于 {min}` | 400 |
| 晚于最大值 | `{参数} 不能晚于 {max}` | 400 |

### 全局异常过滤器集成

```typescript
// src/common/filters/http-exception.filter.ts
@Catch(BadRequestException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    
    // 自定义错误格式
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: exception.message,
      path: ctx.getRequest<Request>().url,
    });
  }
}
```

---

## 🎯 最佳实践

### 1. 使用常量定义日期边界

```typescript
// src/common/constants/date-bounds.ts
export const DATE_BOUNDS = {
  MIN_RESEARCH_DATE: new Date('2000-01-01'),  // 研究数据最早日期
  MAX_FUTURE_DATE: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),  // 最多提前 1 年
};

// 在 Controller 中使用
@Get('events')
async findEvents(
  @Query('startDate', new ParseISO8601Pipe({ 
    min: DATE_BOUNDS.MIN_RESEARCH_DATE 
  })) startDate: Date,
) {
  // ...
}
```

---

### 2. 组合使用可选日期管道

```typescript
@Get('analytics')
async getAnalytics(
  // 必填：报告日期
  @Query('reportDate', ParseISO8601Pipe) reportDate: Date,
  
  // 可选：时间范围（使用 ParseOptionalDatePipe）
  @Query('from', ParseOptionalDatePipe) fromDate?: Date,
  @Query('to', ParseOptionalDatePipe) toDate?: Date,
) {
  return this.analyticsService.generate(reportDate, {
    from: fromDate,
    to: toDate,
  });
}
```

---

### 3. 时区处理建议

```typescript
import { parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

@Get('daily-report')
async getDailyReport(
  @Query('date', ParseISO8601Pipe) date: Date,
) {
  // 转换为上海时区
  const shanghaiTime = utcToZonedTime(date, 'Asia/Shanghai');
  
  // 获取当天的开始和结束时间
  const startOfDay = startOfDay(shanghaiTime);
  const endOfDay = endOfDay(shanghaiTime);
  
  return this.reportsService.findByDateRange(startOfDay, endOfDay);
}
```

---

### 4. 单元测试示例

```typescript
// src/common/pipes/parse-iso8601.pipe.spec.ts
import { ParseISO8601Pipe } from './parse-iso8601.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseISO8601Pipe', () => {
  let pipe: ParseISO8601Pipe;

  beforeEach(() => {
    pipe = new ParseISO8601Pipe();
  });

  it('should parse valid ISO 8601 date string', () => {
    const result = pipe.transform('2026-03-31', {} as any);
    expect(result).toEqual(new Date('2026-03-31'));
  });

  it('should parse ISO 8601 datetime string', () => {
    const result = pipe.transform('2026-03-31T14:30:00.000Z', {} as any);
    expect(result.toISOString()).toBe('2026-03-31T14:30:00.000Z');
  });

  it('should reject undefined', () => {
    expect(() => pipe.transform(undefined, { data: 'date' } as any))
      .toThrow(BadRequestException);
  });

  it('should reject empty string', () => {
    expect(() => pipe.transform('', { data: 'date' } as any))
      .toThrow(BadRequestException);
  });

  it('should reject invalid date format', () => {
    expect(() => pipe.transform('invalid-date', { data: 'date' } as any))
      .toThrow(BadRequestException);
  });

  it('should enforce min date', () => {
    const pipeWithMin = new ParseISO8601Pipe({ 
      min: new Date('2026-01-01') 
    });
    expect(() => pipeWithMin.transform('2025-12-31', { data: 'date' } as any))
      .toThrow(BadRequestException);
  });

  it('should enforce max date', () => {
    const pipeWithMax = new ParseISO8601Pipe({ 
      max: new Date('2026-12-31') 
    });
    expect(() => pipeWithMax.transform('2027-01-01', { data: 'date' } as any))
      .toThrow(BadRequestException);
  });
});
```

---

## 🔗 相关文档

- [ParseDatePipe](./parse-date-pipe.md) - 通用日期解析管道
- [ParseOptionalDatePipe](./parse-optional-date-pipe.md) - 可选日期解析管道
- [PaginationPipe](./pagination-pipe.md) - 分页参数解析管道
- [API 设计文档](./api-design.md) - RESTful API 设计规范

---

## 📦 快速参考

```typescript
// 基本用法（必填）
@Query('date', ParseISO8601Pipe) date: Date

// 带最小值
@Query('from', new ParseISO8601Pipe({ min: new Date('2026-01-01') })) from: Date

// 带最大值
@Query('to', new ParseISO8601Pipe({ max: new Date() })) to: Date

// 带范围
@Query('date', new ParseISO8601Pipe({ 
  min: new Date('2026-01-01'),
  max: new Date('2026-12-31')
})) date: Date
```

---

*最后更新：2026-03-31*
