# ParseOptionalDatePipe 使用指南

> 可选日期解析管道 - 用于可选日期筛选、时间范围查询、观测记录等场景

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseOptionalDatePipe` 是用于将字符串/Date 对象转换为标准 Date 类型的**可选**管道。与 `ParseDatePipe` 不同，当参数未提供或为空时，它返回 `undefined` 或指定的默认值，而不会抛出错误。

### 核心功能

- ✅ **可选参数** - 未提供时不报错
- ✅ 支持默认值设置
- ✅ 支持最小值/最大值范围验证
- ✅ 支持 ISO 8601 格式 (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss.sssZ)
- ✅ 自动处理字符串到 Date 的转换
- ✅ 友好的中文错误提示
- ✅ 适用于观测记录、时间范围查询

### 与 ParseDatePipe 的区别

| 特性 | ParseDatePipe | ParseOptionalDatePipe |
|------|---------------|----------------------|
| 参数必填 | ✅ 是 | ❌ 否 |
| 未提供时 | 抛出错误 | 返回 `undefined` 或默认值 |
| 配置选项 | `defaultValue`, `min`, `max` | `defaultValue`, `min`, `max` |
| 使用场景 | 必填日期参数 (如观测时间、注册日期) | 可选筛选条件 (如日期范围、时间过滤) |

### 与 ParseISO8601Pipe 的区别

| 特性 | ParseISO8601Pipe | ParseOptionalDatePipe |
|------|------------------|----------------------|
| 参数必填 | ✅ 是 | ❌ 否 |
| 未提供时 | 抛出错误 | 返回 `undefined` 或默认值 |
| 使用场景 | 需要严格 ISO 8601 验证的必填字段 | 可选日期筛选条件 |

### 与 ParseOptionalStringPipe 的区别

| 特性 | ParseOptionalStringPipe | ParseOptionalDatePipe |
|------|------------------------|----------------------|
| 返回类型 | `string | undefined` | `Date | undefined` |
| 日期验证 | ❌ 仅字符串处理 | ✅ 严格日期格式验证 |
| 使用场景 | 任意可选字符串 | 可选日期参数 (自动解析为 Date 对象) |

---

## 🚀 快速开始

### 基础用法 - 可选日期参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseOptionalDatePipe } from '@/common/pipes';

@Controller('sightings')
export class SightingsController {
  @Get('by-date')
  findByDate(
    @Query('date', new ParseOptionalDatePipe()) date?: Date
  ) {
    // date 可能是 Date/undefined
    return this.sightingsService.findByDate({ date });
  }
}
```

**请求示例:**
```
GET /sightings/by-date?date=2026-03-15          # date = 2026-03-15T00:00:00.000Z
GET /sightings/by-date?date=2026-03-15T10:30:00 # date = 2026-03-15T10:30:00.000Z
GET /sightings/by-date                          # date = undefined
GET /sightings/by-date?date=                    # date = undefined (空字符串)
```

### 带默认值的可选参数

```typescript
@Get('recent')
findRecent(
  @Query('since', new ParseOptionalDatePipe({ 
    defaultValue: new Date('2026-01-01') 
  })) 
  since: Date
) {
  // 如果未提供 since 参数，默认值为 2026-01-01
  return this.sightingsService.findRecent({ since });
}
```

**请求示例:**
```
GET /sightings/recent?since=2026-03-01   # since = 2026-03-01T00:00:00.000Z
GET /sightings/recent                    # since = 2026-01-01T00:00:00.000Z (默认值)
```

### 带范围验证的可选参数

```typescript
@Get('historical')
findHistorical(
  @Query('startDate', new ParseOptionalDatePipe({ 
    min: new Date('2020-01-01'),
    max: new Date('2026-12-31')
  })) 
  startDate?: Date
) {
  // startDate 必须在 2020-01-01 到 2026-12-31 之间
  return this.sightingsService.findHistorical({ startDate });
}
```

**请求示例:**
```
GET /historical?startDate=2025-06-15     # ✅ startDate = 2025-06-15
GET /historical?startDate=2019-01-01     # ❌ 400 错误：startDate 不能早于 2020-01-01
GET /historical?startDate=2027-01-01     # ❌ 400 错误：startDate 不能晚于 2026-12-31
GET /historical                          # ✅ startDate = undefined
```

---

## ⚙️ 配置选项

### ParseOptionalDateOptions

```typescript
interface ParseOptionalDateOptions {
  defaultValue?: Date;  // 默认值 (未提供参数时使用)
  min?: Date;           // 最小日期 (早于此日期将抛出错误)
  max?: Date;           // 最大日期 (晚于此日期将抛出错误)
}
```

### 选项详解

| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `defaultValue` | `Date` | ❌ | 当参数未提供或为空时返回的默认值 |
| `min` | `Date` | ❌ | 允许的最小日期，早于此日期将抛出 400 错误 |
| `max` | `Date` | ❌ | 允许的最大日期，晚于此日期将抛出 400 错误 |

---

## 📖 使用场景

### 场景 1: 观测记录日期筛选

```typescript
@Get('sightings')
findSightings(
  @Query('date', new ParseOptionalDatePipe()) date?: Date,
  @Query('startDate', new ParseOptionalDatePipe()) startDate?: Date,
  @Query('endDate', new ParseOptionalDatePipe()) endDate?: Date
) {
  return this.sightingsService.find({
    date,
    startDate,
    endDate
  });
}
```

**请求示例:**
```
# 查询特定日期
GET /sightings?date=2026-03-15

# 查询日期范围
GET /sightings?startDate=2026-03-01&endDate=2026-03-31

# 查询所有记录 (无日期筛选)
GET /sightings
```

### 场景 2: 带默认值的最近记录

```typescript
@Get('recent')
findRecentSightings(
  @Query('since', new ParseOptionalDatePipe({ 
    defaultValue: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 天前
  })) 
  since: Date
) {
  // 默认查询最近 7 天的记录
  return this.sightingsService.findRecent({ since });
}
```

### 场景 3: 历史数据范围限制

```typescript
@Get('archive')
findArchive(
  @Query('year', new ParseOptionalDatePipe({ 
    min: new Date('2020-01-01'),
    max: new Date('2025-12-31')
  })) 
  year?: Date
) {
  // 仅允许查询 2020-2025 年的数据
  return this.sightingsService.findArchive({ year });
}
```

### 场景 4: 与 DTO 结合使用

```typescript
// dto/filter-sightings.dto.ts
export class FilterSightingsDto {
  @ApiPropertyOptional({
    description: '观测日期',
    example: '2026-03-15'
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: '起始日期',
    example: '2026-03-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '结束日期',
    example: '2026-03-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// controller
@Get()
findAll(@Query() filter: FilterSightingsDto) {
  const options: any = {};
  
  if (filter.date) {
    options.date = new ParseOptionalDatePipe().transform(filter.date, { type: 'query', data: 'date' });
  }
  
  if (filter.startDate) {
    options.startDate = new ParseOptionalDatePipe({
      min: new Date('2020-01-01')
    }).transform(filter.startDate, { type: 'query', data: 'startDate' });
  }
  
  return this.sightingsService.find(options);
}
```

---

## ❌ 错误处理

### 无效日期格式

```typescript
@Get('test')
test(
  @Query('date', new ParseOptionalDatePipe()) date?: Date
) {
  return { date };
}
```

**请求:**
```
GET /test?date=invalid-date
```

**响应 (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "date 必须是有效的日期格式 (ISO 8601)",
  "error": "Bad Request"
}
```

### 超出最小日期范围

```typescript
@Get('test')
test(
  @Query('date', new ParseOptionalDatePipe({ 
    min: new Date('2020-01-01') 
  })) date?: Date
) {
  return { date };
}
```

**请求:**
```
GET /test?date=2019-06-15
```

**响应 (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "date 不能早于 2020-01-01",
  "error": "Bad Request"
}
```

### 超出最大日期范围

```typescript
@Get('test')
test(
  @Query('date', new ParseOptionalDatePipe({ 
    max: new Date('2026-12-31') 
  })) date?: Date
) {
  return { date };
}
```

**请求:**
```
GET /test?date=2027-05-20
```

**响应 (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "date 不能晚于 2026-12-31",
  "error": "Bad Request"
}
```

---

## 🧪 测试示例

```typescript
// parse-optional-date.pipe.spec.ts
import { ParseOptionalDatePipe } from './parse-optional-date.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseOptionalDatePipe', () => {
  let pipe: ParseOptionalDatePipe;

  beforeEach(() => {
    pipe = new ParseOptionalDatePipe();
  });

  it('应该返回 undefined 当参数未提供', () => {
    const result = pipe.transform(undefined, { type: 'query', data: 'date' });
    expect(result).toBeUndefined();
  });

  it('应该返回 undefined 当参数为空字符串', () => {
    const result = pipe.transform('', { type: 'query', data: 'date' });
    expect(result).toBeUndefined();
  });

  it('应该解析有效的 ISO 8601 日期字符串', () => {
    const result = pipe.transform('2026-03-15', { type: 'query', data: 'date' });
    expect(result).toEqual(new Date('2026-03-15'));
  });

  it('应该解析带时间的 ISO 8601 日期字符串', () => {
    const result = pipe.transform('2026-03-15T10:30:00', { type: 'query', data: 'date' });
    expect(result).toEqual(new Date('2026-03-15T10:30:00'));
  });

  it('应该返回默认值当参数未提供', () => {
    const defaultValue = new Date('2026-01-01');
    pipe = new ParseOptionalDatePipe({ defaultValue });
    
    const result = pipe.transform(undefined, { type: 'query', data: 'date' });
    expect(result).toEqual(defaultValue);
  });

  it('应该在日期早于 min 时抛出错误', () => {
    pipe = new ParseOptionalDatePipe({ min: new Date('2020-01-01') });
    
    expect(() => {
      pipe.transform('2019-06-15', { type: 'query', data: 'date' });
    }).toThrow(BadRequestException);
  });

  it('应该在日期晚于 max 时抛出错误', () => {
    pipe = new ParseOptionalDatePipe({ max: new Date('2026-12-31') });
    
    expect(() => {
      pipe.transform('2027-05-20', { type: 'query', data: 'date' });
    }).toThrow(BadRequestException);
  });

  it('应该在日期无效时抛出错误', () => {
    expect(() => {
      pipe.transform('invalid-date', { type: 'query', data: 'date' });
    }).toThrow(BadRequestException);
  });
});
```

---

## 🔗 相关文档

- [ParseDatePipe](./parse-date-pipe.md) - 必填日期解析管道
- [ParseISO8601Pipe](./parse-iso8601-pipe.md) - 严格 ISO 8601 验证管道
- [ParseOptionalStringPipe](./parse-optional-string-pipe.md) - 可选字符串解析管道
- [ParseOptionalBooleanPipe](./parse-optional-boolean-pipe.md) - 可选布尔值解析管道
- [API 设计文档](./api-design.md) - 完整 API 设计规范

---

## 📝 更新日志

### v0.1.0 (2026-03-31)
- ✨ 初始版本
- ✅ 支持可选日期参数
- ✅ 支持默认值配置
- ✅ 支持 min/max 范围验证
- ✅ 支持 ISO 8601 格式解析
- ✅ 中文错误提示
