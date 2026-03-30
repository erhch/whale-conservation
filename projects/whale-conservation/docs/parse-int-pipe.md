# ParseIntPipe - 整数解析管道

## 概述

`ParseIntPipe` 是一个用于处理**必填整数参数**的验证管道，适用于需要接收整数类型数据的 API 接口。

### 核心功能

- ✅ **必填验证** - 不允许 `undefined`/`null`/空字符串
- ✅ **类型转换** - 自动将字符串转换为整数
- ✅ **范围验证** - 支持 `min`/`max` 边界检查
- ✅ **中文错误提示** - 友好的错误消息

---

## 快速开始

### 基础用法

```typescript
import { ParseIntPipe } from '@/common/pipes';

// 必填整数参数
@Query('page', new ParseIntPipe()) page: number;

// 带范围验证
@Query('limit', new ParseIntPipe({ min: 1, max: 100 })) limit: number;

// 路径参数
@Get(':id')
findOne(@Param('id', new ParseIntPipe()) id: number) {
  return this.whalesService.findOne(id);
}
```

### 可选整数参数

对于可选的整数参数，使用 `ParseOptionalIntPipe`：

```typescript
import { ParseOptionalIntPipe } from '@/common/pipes';

// 可选参数，带默认值
@Query('offset', new ParseOptionalIntPipe({ defaultValue: 0 })) offset?: number;

// 可选参数，带范围
@Query('year', new ParseOptionalIntPipe({ min: 2000, max: 2030 })) year?: number;
```

---

## 使用场景

### 1. 分页参数

```typescript
@Get('whales')
findAll(
  @Query('page', new ParseIntPipe({ min: 1 })) page: number,
  @Query('limit', new ParseIntPipe({ min: 1, max: 100 })) limit: number,
) {
  return this.whalesService.findAll({ page, limit });
}
```

**示例请求：**
```
GET /whales?page=1&limit=20
```

**错误响应：**
```json
{
  "statusCode": 400,
  "message": "page 不能小于 1",
  "error": "Bad Request"
}
```

### 2. 资源 ID（路径参数）

```typescript
@Get(':id')
findOne(@Param('id', new ParseIntPipe()) id: number) {
  return this.whalesService.findOne(id);
}
```

**示例请求：**
```
GET /whales/123
```

**错误响应：**
```json
{
  "statusCode": 400,
  "message": "id 必须是有效的整数",
  "error": "Bad Request"
}
```

### 3. 数量/计数参数

```typescript
@Post('sightings/batch')
createBatch(
  @Body('count', new ParseIntPipe({ min: 1, max: 50 })) count: number,
  @Body('data') data: any[],
) {
  return this.sightingsService.createBatch(count, data);
}
```

### 4. 时间范围（年份/月份）

```typescript
@Get('stats/yearly')
getYearlyStats(
  @Query('year', new ParseIntPipe({ min: 2000, max: 2030 })) year: number,
) {
  return this.statsService.getYearlyStats(year);
}
```

---

## 配置选项

### ParseIntOptions

| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `min` | `number` | 否 | 最小值（包含） |
| `max` | `number` | 否 | 最大值（包含） |

---

## 验证行为

### 输入处理

| 输入值 | 结果 |
|--------|------|
| `"123"` | ✅ 转换为 `123` |
| `123` | ✅ 保持 `123` |
| `""` | ❌ 抛出异常（必填项不能为空） |
| `null` | ❌ 抛出异常（必填项不能为空） |
| `undefined` | ❌ 抛出异常（必填项不能为空） |
| `"abc"` | ❌ 抛出异常（无法转换为整数） |
| `"12.5"` | ❌ 抛出异常（不是有效整数） |
| `12.5` | ❌ 抛出异常（不是有效整数） |

### 范围验证

```typescript
@Query('age', new ParseIntPipe({ min: 0, max: 150 })) age: number;
```

| 输入值 | 结果 |
|--------|------|
| `0` | ✅ 通过 |
| `150` | ✅ 通过 |
| `-1` | ❌ "age 不能小于 0" |
| `151` | ❌ "age 不能大于 150" |

---

## 错误消息

### 必填验证失败

```json
{
  "statusCode": 400,
  "message": "参数 是必填项，请提供有效的整数",
  "error": "Bad Request"
}
```

### 类型转换失败

```json
{
  "statusCode": 400,
  "message": "参数 必须是有效的整数",
  "error": "Bad Request"
}
```

### 范围验证失败

```json
{
  "statusCode": 400,
  "message": "参数 不能小于 1",
  "error": "Bad Request"
}
```

---

## 与相关管道对比

| 管道 | 必填/可选 | 类型 | 说明 |
|------|-----------|------|------|
| `ParseIntPipe` | **必填** | `number` | 本管道 |
| `ParseOptionalIntPipe` | 可选 | `number \| undefined` | 可选整数 |
| `ParseFloatPipe` | **必填** | `number` | 必填浮点数 |
| `ParseOptionalFloatPipe` | 可选 | `number \| undefined` | 可选浮点数 |

---

## 最佳实践

### ✅ 推荐

```typescript
// 明确指定范围
@Query('limit', new ParseIntPipe({ min: 1, max: 100 })) limit: number;

// 用于路径参数 ID
@Param('id', new ParseIntPipe()) id: number;

// 分页参数组合
@Query('page', new ParseIntPipe({ min: 1 })) page: number;
@Query('limit', new ParseIntPipe({ min: 1, max: 50 })) limit: number;
```

### ❌ 避免

```typescript
// 不要用于可选参数（应使用 ParseOptionalIntPipe）
@Query('offset') offset?: number;  // 没有验证

// 不要用于浮点数（应使用 ParseFloatPipe）
@Query('price', new ParseIntPipe()) price: number;  // 会丢失小数

// 不要设置不合理的范围
@Query('count', new ParseIntPipe({ min: 0, max: 1000000 })) count: number;  // 范围过大
```

---

## 完整示例

### 分页查询控制器

```typescript
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ParseIntPipe, ParseOptionalIntPipe } from '@/common/pipes';
import { WhalesService } from './whales.service';

@Controller('whales')
export class WhalesController {
  constructor(private readonly whalesService: WhalesService) {}

  // GET /whales?page=1&limit=20&offset=0
  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ min: 1 })) page: number,
    @Query('limit', new ParseIntPipe({ min: 1, max: 100 })) limit: number,
    @Query('offset', new ParseOptionalIntPipe({ defaultValue: 0 })) offset: number,
  ) {
    return this.whalesService.findAll({ page, limit, offset });
  }

  // GET /whales/123
  @Get(':id')
  findOne(@Param('id', new ParseIntPipe()) id: number) {
    return this.whalesService.findOne(id);
  }

  // GET /whales/by-year/2024
  @Get('by-year/:year')
  findByYear(@Param('year', new ParseIntPipe({ min: 2000, max: 2030 })) year: number) {
    return this.whalesService.findByYear(year);
  }
}
```

---

## 相关文件

- [ParseOptionalIntPipe](./parse-optional-int-pipe.md) - 可选整数管道
- [ParseFloatPipe](./parse-float-pipe.md) - 浮点数管道
- [ParseArrayPipe](./parse-array-pipe.md) - 数组解析管道
- [API 设计指南](./api-design.md) - 整体 API 设计规范
