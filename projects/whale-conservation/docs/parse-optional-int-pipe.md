# ParseOptionalIntPipe 使用指南

> 可选整数解析管道 - 用于可选数量参数、筛选条件、分页偏移等场景

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseOptionalIntPipe` 是用于将字符串/数字转换为标准整数类型的**可选**管道。与 `ParseIntPipe` 不同，当参数未提供或为空时，它返回 `undefined` 或指定的默认值，而不会抛出错误。

### 核心功能

- ✅ **可选参数** - 未提供时不报错
- ✅ 支持默认值设置
- ✅ 支持最小值/最大值范围验证
- ✅ 自动处理字符串到整数的转换
- ✅ 友好的中文错误提示
- ✅ 严格整数验证 (排除浮点数)

### 与 ParseIntPipe 的区别

| 特性 | ParseIntPipe | ParseOptionalIntPipe |
|------|--------------|----------------------|
| 参数必填 | ✅ 是 | ❌ 否 |
| 未提供时 | 抛出错误 | 返回 `undefined` 或默认值 |
| 配置选项 | `defaultValue`, `min`, `max` | `defaultValue`, `min`, `max` |
| 使用场景 | 必填整数参数 (如 ID、页码) | 可选筛选条件 (如偏移量、数量限制) |

---

## 🚀 快速开始

### 基础用法 - 可选整数参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseOptionalIntPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('limit', new ParseOptionalIntPipe()) limit?: number
  ) {
    // limit 可能是 number/undefined
    return this.whalesService.findAll({ limit });
  }
}
```

**请求示例:**
```
GET /whales?limit=10      # limit = 10
GET /whales?limit=50      # limit = 50
GET /whales               # limit = undefined
GET /whales?limit=        # limit = undefined (空字符串)
```

### 带默认值的可选参数

```typescript
@Get('sightings')
findSightings(
  @Query('offset', new ParseOptionalIntPipe({ defaultValue: 0 })) 
  offset: number
) {
  // 如果未提供 offset 参数，默认值为 0
  return this.sightingsService.find({ offset });
}
```

**请求示例:**
```
GET /sightings?offset=20   # offset = 20
GET /sightings             # offset = 0 (默认值)
```

### 带范围验证的可选参数

```typescript
@Get('whales')
findAll(
  @Query('page', new ParseOptionalIntPipe({ 
    defaultValue: 1, 
    min: 1, 
    max: 100 
  })) 
  page: number
) {
  // page 必须在 1-100 之间
  return this.whalesService.findAll({ page });
}
```

**请求示例:**
```
GET /whales?page=5         # page = 5
GET /whales?page=0         # ❌ 400 错误：page 不能小于 1
GET /whales?page=101       # ❌ 400 错误：page 不能大于 100
GET /whales                # page = 1 (默认值)
```

---

## 📋 实际应用场景

### 场景 1: 可选分页参数

```typescript
import { ParseOptionalIntPipe, ParseStringPipe } from '@/common/pipes';

@Controller('stations')
export class StationsController {
  @Get()
  findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) 
    page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 })) 
    limit: number,
    @Query('offset', new ParseOptionalIntPipe()) 
    offset?: number
  ) {
    // page 和 limit 有默认值，offset 完全可选
    return this.stationsService.findAll({ page, limit, offset });
  }
}
```

**请求示例:**
```
GET /stations?page=2&limit=50          # page=2, limit=50, offset=undefined
GET /stations?offset=100               # page=1, limit=20, offset=100
GET /stations                          # page=1, limit=20, offset=undefined
```

### 场景 2: 数量筛选条件

```typescript
@Controller('whales')
export class WhalesController {
  @Get('by-size')
  findBySize(
    @Query('minLength', new ParseOptionalIntPipe({ min: 0 })) 
    minLength?: number,
    @Query('maxLength', new ParseOptionalIntPipe({ min: 0 })) 
    maxLength?: number,
    @Query('minWeight', new ParseOptionalIntPipe({ min: 0 })) 
    minWeight?: number
  ) {
    // 所有参数都是可选的，用户可以灵活组合筛选
    return this.whalesService.findBySize({ 
      minLength, 
      maxLength, 
      minWeight 
    });
  }
}
```

**请求示例:**
```
GET /whales/by-size?minLength=1000          # 只筛选长度 >= 1000cm
GET /whales/by-size?minLength=1000&maxLength=1500  # 长度在 1000-1500cm 之间
GET /whales/by-size?minWeight=500           # 只筛选体重 >= 500kg
GET /whales/by-size                         # 无筛选条件
```

### 场景 3: 统计查询参数

```typescript
@Controller('stats')
export class StatsController {
  @Get('sightings')
  getSightingStats(
    @Query('limit', new ParseOptionalIntPipe({ 
      defaultValue: 100, 
      min: 1, 
      max: 1000 
    })) 
    limit: number,
    @Query('year', new ParseOptionalIntPipe({ min: 2000, max: 2030 })) 
    year?: number
  ) {
    return this.statsService.getSightingStats({
      limit,  // 默认 100，范围 1-1000
      year    // 可选，范围 2000-2030
    });
  }
}
```

**请求示例:**
```
GET /stats/sightings?limit=500              # limit=500, year=undefined
GET /stats/sightings?year=2025              # limit=100, year=2025
GET /stats/sightings?limit=50&year=2024     # limit=50, year=2024
GET /stats/sightings                        # limit=100, year=undefined
```

### 场景 4: 导出选项

```typescript
@Controller('export')
export class ExportController {
  @Get('whales')
  exportWhales(
    @Query('batchSize', new ParseOptionalIntPipe({ 
      defaultValue: 1000, 
      min: 100, 
      max: 10000 
    })) 
    batchSize: number
  ) {
    // 导出批次大小，默认 1000 条
    return this.exportService.exportWhales({ batchSize });
  }
}
```

**请求示例:**
```
GET /export/whales?batchSize=5000    # batchSize=5000
GET /export/whales?batchSize=50      # ❌ 400 错误：batchSize 不能小于 100
GET /export/whales                   # batchSize=1000 (默认值)
```

---

## 📊 支持的输入格式

### 有效输入

| 输入类型 | 值 | 示例 | 结果 |
|---------|-----|------|------|
| 字符串 | '123' | `?limit=123` | 123 |
| 字符串 | '0' | `?offset=0` | 0 |
| 字符串 | '-50' | `?offset=-50` | -50 |
| 数字 | 123 | (JSON 请求体) | 123 |
| 数字 | 0 | (JSON 请求体) | 0 |

### 空值 (返回 `undefined` 或 `defaultValue`)

| 输入 | 结果 |
|------|------|
| 参数未提供 | `undefined` 或 `defaultValue` |
| 空字符串 `''` | `undefined` 或 `defaultValue` |
| `null` | `undefined` 或 `defaultValue` |

### 无效输入 (抛出错误)

| 输入 | 错误原因 |
|------|----------|
| 'abc' | 不是有效整数 |
| '12.5' | 是浮点数，不是整数 |
| '1,000' | 包含非法字符 |
| 12.5 | 是浮点数，不是整数 |
| 超出 min/max 范围的值 | 超出允许范围 |

---

## ⚠️ 错误处理

### 错误 1: 无效的整数值

```typescript
@Query('limit', new ParseOptionalIntPipe()) limit?: number
```

**请求:** `GET /whales?limit=abc`

**响应:**
```json
{
  "statusCode": 400,
  "message": "limit 必须是有效的整数",
  "error": "Bad Request"
}
```

### 错误 2: 浮点数输入

```typescript
@Query('count', new ParseOptionalIntPipe()) count?: number
```

**请求:** `GET /whales?count=10.5`

**响应:**
```json
{
  "statusCode": 400,
  "message": "count 必须是有效的整数",
  "error": "Bad Request"
}
```

### 错误 3: 小于最小值

```typescript
@Query('page', new ParseOptionalIntPipe({ min: 1 })) page?: number
```

**请求:** `GET /whales?page=0`

**响应:**
```json
{
  "statusCode": 400,
  "message": "page 不能小于 1",
  "error": "Bad Request"
}
```

### 错误 4: 大于最大值

```typescript
@Query('limit', new ParseOptionalIntPipe({ max: 100 })) limit?: number
```

**请求:** `GET /whales?limit=200`

**响应:**
```json
{
  "statusCode": 400,
  "message": "limit 不能大于 100",
  "error": "Bad Request"
}
```

### 正常情况：未提供参数

```typescript
@Query('offset', new ParseOptionalIntPipe()) offset?: number
```

**请求:** `GET /whales` (未提供 offset 参数)

**结果:** `offset = undefined` (不报错)

---

## 🔧 配置选项

```typescript
interface ParseOptionalIntOptions {
  /**
   * 默认值 (当值为 undefined/null/空字符串时使用)
   * @default undefined
   */
  defaultValue?: number;

  /**
   * 最小值 (包含)
   * @default undefined
   */
  min?: number;

  /**
   * 最大值 (包含)
   * @default undefined
   */
  max?: number;
}
```

### 配置示例

```typescript
// 可选，无默认值，无范围限制
new ParseOptionalIntPipe()

// 可选，带默认值
new ParseOptionalIntPipe({ defaultValue: 0 })

// 可选，带最小值
new ParseOptionalIntPipe({ min: 1 })

// 可选，带最大值
new ParseOptionalIntPipe({ max: 100 })

// 可选，带完整范围
new ParseOptionalIntPipe({ 
  defaultValue: 10, 
  min: 1, 
  max: 100 
})
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **为分页参数设置合理的默认值和范围**
   ```typescript
   // 好：页码从 1 开始，每页最多 100 条
   @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number
   @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 })) limit: number
   ```

2. **为数量限制设置上限防止滥用**
   ```typescript
   // 好：限制最大导出数量
   @Query('batchSize', new ParseOptionalIntPipe({ 
     defaultValue: 1000, 
     max: 10000 
   })) batchSize: number
   ```

3. **与必填管道组合使用**
   ```typescript
   // 好：必填参数 + 可选参数
   @Get('whales')
   findAll(
     @Query('speciesId', new ParseUuidPipe()) speciesId: string,  // 必填
     @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20 })) limit: number  // 可选
   )
   ```

### ❌ 避免做法

1. **需要必填参数时不要使用 Optional 版本**
   ```typescript
   // 避免：如果 id 是必填的，应该用 ParseIntPipe 或 ParseUuidPipe
   @Query('id', new ParseOptionalIntPipe()) id?: number
   
   // 正确：
   @Query('id', new ParseIntPipe()) id: number
   ```

2. **不要设置矛盾的范围**
   ```typescript
   // 避免：min > max 会导致所有值都无效
   new ParseOptionalIntPipe({ min: 100, max: 10 })
   
   // 正确：
   new ParseOptionalIntPipe({ min: 10, max: 100 })
   ```

3. **注意负数的使用场景**
   ```typescript
   // 避免：页码不应该是负数
   @Query('page', new ParseOptionalIntPipe({ min: -10 })) page?: number
   
   // 正确：
   @Query('page', new ParseOptionalIntPipe({ min: 1 })) page: number
   ```

---

## 🧪 测试示例

```typescript
import { ParseOptionalIntPipe } from '@/common/pipes';

describe('ParseOptionalIntPipe', () => {
  let pipe: ParseOptionalIntPipe;

  beforeEach(() => {
    pipe = new ParseOptionalIntPipe();
  });

  it('应该将字符串 "123" 转换为 123', () => {
    expect(pipe.transform('123', { type: 'query', data: 'limit' })).toBe(123);
  });

  it('应该将字符串 "0" 转换为 0', () => {
    expect(pipe.transform('0', { type: 'query', data: 'offset' })).toBe(0);
  });

  it('应该将字符串 "-50" 转换为 -50', () => {
    expect(pipe.transform('-50', { type: 'query', data: 'offset' })).toBe(-50);
  });

  it('应该将数字 123 转换为 123', () => {
    expect(pipe.transform(123, { type: 'query', data: 'limit' })).toBe(123);
  });

  it('未提供参数时返回 undefined', () => {
    expect(pipe.transform(undefined, { type: 'query', data: 'limit' })).toBeUndefined();
  });

  it('空字符串返回 undefined', () => {
    expect(pipe.transform('', { type: 'query', data: 'limit' })).toBeUndefined();
  });

  it('带默认值时返回默认值', () => {
    const pipeWithDefault = new ParseOptionalIntPipe({ defaultValue: 10 });
    expect(pipeWithDefault.transform(undefined, { type: 'query', data: 'limit' })).toBe(10);
  });

  it('带最小值验证 - 有效值', () => {
    const pipeWithMin = new ParseOptionalIntPipe({ min: 1 });
    expect(pipeWithMin.transform('5', { type: 'query', data: 'page' })).toBe(5);
  });

  it('带最小值验证 - 无效值抛出异常', () => {
    const pipeWithMin = new ParseOptionalIntPipe({ min: 1 });
    expect(() => pipeWithMin.transform('0', { type: 'query', data: 'page' }))
      .toThrow('page 不能小于 1');
  });

  it('带最大值验证 - 有效值', () => {
    const pipeWithMax = new ParseOptionalIntPipe({ max: 100 });
    expect(pipeWithMax.transform('50', { type: 'query', data: 'limit' })).toBe(50);
  });

  it('带最大值验证 - 无效值抛出异常', () => {
    const pipeWithMax = new ParseOptionalIntPipe({ max: 100 });
    expect(() => pipeWithMax.transform('200', { type: 'query', data: 'limit' }))
      .toThrow('limit 不能大于 100');
  });

  it('浮点数抛出异常', () => {
    expect(() => pipe.transform('12.5', { type: 'query', data: 'count' }))
      .toThrow('count 必须是有效的整数');
  });

  it('非数字字符串抛出异常', () => {
    expect(() => pipe.transform('abc', { type: 'query', data: 'limit' }))
      .toThrow('limit 必须是有效的整数');
  });
});
```

---

## 📚 相关文档

- [ParseIntPipe](./parse-int-pipe.md) - 必填整数管道
- [ParseOptionalFloatPipe](./parse-optional-float-pipe.md) - 可选浮点数管道
- [ParseOptionalStringPipe](./parse-optional-string-pipe.md) - 可选字符串管道
- [PaginationPipe](./pagination-pipe.md) - 分页参数管道
- [公共管道快速入门](./common-quickstart.md) - 所有公共管道概览

---

**最后更新**: 2026-03-31  
**维护者**: 鲸创项目团队
