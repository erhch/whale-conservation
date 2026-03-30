# ParseOptionalBooleanPipe 使用指南

> 可选布尔值解析管道 - 用于可选开关参数、筛选条件、功能启用等场景

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseOptionalBooleanPipe` 是用于将字符串/布尔值转换为标准 boolean 类型的**可选**管道。与 `ParseBooleanPipe` 不同，当参数未提供或为空时，它返回 `undefined` 或指定的默认值，而不会抛出错误。

### 核心功能

- ✅ 支持多种真值格式：'true', '1', 'yes', 'on', 'y' (不区分大小写)
- ✅ 支持多种假值格式：'false', '0', 'no', 'off', 'n' (不区分大小写)
- ✅ **可选参数** - 未提供时不报错
- ✅ 支持默认值设置
- ✅ 友好的中文错误提示
- ✅ 自动处理字符串大小写

### 与 ParseBooleanPipe 的区别

| 特性 | ParseBooleanPipe | ParseOptionalBooleanPipe |
|------|------------------|--------------------------|
| 参数必填 | ✅ 是 | ❌ 否 |
| 未提供时 | 抛出错误 | 返回 `undefined` 或默认值 |
| 配置选项 | `required`, `defaultValue` | `defaultValue` |
| 使用场景 | 必填开关参数 | 可选筛选条件 |

---

## 🚀 快速开始

### 基础用法 - 可选布尔参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseOptionalBooleanPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('isActive', new ParseOptionalBooleanPipe()) isActive?: boolean
  ) {
    // isActive 可能是 true/false/undefined
    return this.whalesService.findAll({ isActive });
  }
}
```

**请求示例:**
```
GET /whales?isActive=true      # isActive = true
GET /whales?isActive=false     # isActive = false
GET /whales                    # isActive = undefined
GET /whales?isActive=          # isActive = undefined (空字符串)
```

### 带默认值的可选参数

```typescript
@Get('sightings')
findSightings(
  @Query('verified', new ParseOptionalBooleanPipe({ defaultValue: true })) 
  verified: boolean
) {
  // 如果未提供 verified 参数，默认值为 true
  return this.sightingsService.find({ verified });
}
```

**请求示例:**
```
GET /sightings?verified=false  # verified = false
GET /sightings                 # verified = true (默认值)
```

---

## 📋 实际应用场景

### 场景 1: 可选筛选条件

```typescript
import { ParseOptionalBooleanPipe, ParseStringPipe } from '@/common/pipes';

@Controller('stations')
export class StationsController {
  @Get()
  findAll(
    @Query('isActive', new ParseOptionalBooleanPipe()) isActive?: boolean,
    @Query('name', new ParseStringPipe({ required: false })) name?: string
  ) {
    // isActive 未提供时，查询不限状态
    return this.stationsService.findAll({ isActive, name });
  }
}
```

**请求示例:**
```
GET /stations?isActive=true              # 只查询活跃站点
GET /stations?isActive=false             # 只查询非活跃站点
GET /stations                            # 查询所有站点
GET /stations?name=东海观测站             # 按名称筛选
```

### 场景 2: 导出选项

```typescript
@Controller('export')
export class ExportController {
  @Get('whales')
  exportWhales(
    @Query('includeInactive', new ParseOptionalBooleanPipe({ defaultValue: false }))
    includeInactive: boolean,
    @Query('detailed', new ParseOptionalBooleanPipe({ defaultValue: true }))
    detailed: boolean
  ) {
    return this.exportService.exportWhales({ 
      includeInactive,  // 默认 false
      detailed          // 默认 true
    });
  }
}
```

**请求示例:**
```
GET /export/whales?includeInactive=yes   # includeInactive=true, detailed=true
GET /export/whales?detailed=0            # includeInactive=false, detailed=false
GET /export/whales                       # includeInactive=false, detailed=true
```

### 场景 3: 统计查询

```typescript
@Controller('stats')
export class StatsController {
  @Get('sightings')
  getSightingStats(
    @Query('excludeUnverified', new ParseOptionalBooleanPipe()) 
    excludeUnverified?: boolean,
    @Query('groupBySpecies', new ParseOptionalBooleanPipe({ defaultValue: true }))
    groupBySpecies: boolean
  ) {
    return this.statsService.getSightingStats({
      excludeUnverified,
      groupBySpecies
    });
  }
}
```

**请求示例:**
```
GET /stats/sightings?excludeUnverified=true   # 排除未验证记录
GET /stats/sightings?groupBySpecies=false     # 不按物种分组
GET /stats/sightings                          # excludeUnverified=undefined, groupBySpecies=true
```

---

## 📊 支持的输入格式

### 真值 (返回 `true`)

| 输入类型 | 值 | 示例 |
|---------|-----|------|
| 字符串 | 'true', 'TRUE', 'True' | `?active=true` |
| 字符串 | '1' | `?active=1` |
| 字符串 | 'yes', 'YES', 'Yes' | `?active=yes` |
| 字符串 | 'on', 'ON', 'On' | `?active=on` |
| 字符串 | 'y', 'Y' | `?active=y` |
| 布尔值 | true | (JSON 请求体) |

### 假值 (返回 `false`)

| 输入类型 | 值 | 示例 |
|---------|-----|------|
| 字符串 | 'false', 'FALSE', 'False' | `?active=false` |
| 字符串 | '0' | `?active=0` |
| 字符串 | 'no', 'NO', 'No' | `?active=no` |
| 字符串 | 'off', 'OFF', 'Off' | `?active=off` |
| 字符串 | 'n', 'N' | `?active=n` |
| 布尔值 | false | (JSON 请求体) |

### 空值 (返回 `undefined` 或 `defaultValue`)

| 输入 | 结果 |
|------|------|
| 参数未提供 | `undefined` 或 `defaultValue` |
| 空字符串 `''` | `undefined` 或 `defaultValue` |
| `null` | `undefined` 或 `defaultValue` |

---

## ⚠️ 错误处理

### 错误 1: 无效的布尔值

```typescript
@Query('verified', new ParseOptionalBooleanPipe()) verified?: boolean
```

**请求:** `GET /sightings?verified=maybe`

**响应:**
```json
{
  "statusCode": 400,
  "message": "verified 必须是有效的布尔值 (true/false, 1/0, yes/no, on/off)",
  "error": "Bad Request"
}
```

### 错误 2: 无效的数字值

```typescript
@Body('enabled', new ParseOptionalBooleanPipe()) enabled?: boolean
```

**请求:**
```json
{
  "enabled": 2
}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "enabled 必须是有效的布尔值 (true/false, 1/0, yes/no, on/off)",
  "error": "Bad Request"
}
```

### 正常情况：未提供参数

```typescript
@Query('isActive', new ParseOptionalBooleanPipe()) isActive?: boolean
```

**请求:** `GET /whales` (未提供 isActive 参数)

**结果:** `isActive = undefined` (不报错)

---

## 🔧 配置选项

```typescript
interface ParseOptionalBooleanOptions {
  /**
   * 默认值 (当值为 undefined/null/空字符串时使用)
   * @default undefined
   */
  defaultValue?: boolean;
}
```

### 配置示例

```typescript
// 可选，无默认值 (返回 undefined)
new ParseOptionalBooleanPipe()

// 可选，带默认值 false
new ParseOptionalBooleanPipe({ defaultValue: false })

// 可选，带默认值 true
new ParseOptionalBooleanPipe({ defaultValue: true })
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **用于可选筛选条件**
   ```typescript
   // 好：用户可以选择是否筛选
   @Query('isActive', new ParseOptionalBooleanPipe()) isActive?: boolean
   ```

2. **为常用选项设置合理默认值**
   ```typescript
   // 好：默认显示详细数据
   @Query('detailed', new ParseOptionalBooleanPipe({ defaultValue: true }))
   detailed: boolean
   ```

3. **与必填管道组合使用**
   ```typescript
   // 好：必填参数 + 可选参数
   @Get('whales')
   findAll(
     @Query('speciesId', new ParseUuidPipe()) speciesId: string,  // 必填
     @Query('includeCalves', new ParseOptionalBooleanPipe()) includeCalves?: boolean  // 可选
   )
   ```

### ❌ 避免做法

1. **需要必填参数时不要使用 Optional 版本**
   ```typescript
   // 避免：如果 isActive 是必填的，应该用 ParseBooleanPipe
   @Query('isActive', new ParseOptionalBooleanPipe()) isActive?: boolean
   
   // 正确：
   @Query('isActive', new ParseBooleanPipe()) isActive: boolean
   ```

2. **不要混淆 undefined 和 false**
   ```typescript
   // 注意：undefined 表示"未指定"，false 表示"明确指定为否"
   // 在业务逻辑中要区分处理
   if (isActive === undefined) {
     // 用户未指定，使用默认查询逻辑
   } else if (isActive === true) {
     // 用户明确要求活跃
   } else {
     // 用户明确要求非活跃
   }
   ```

---

## 🧪 测试示例

```typescript
import { ParseOptionalBooleanPipe } from '@/common/pipes';

describe('ParseOptionalBooleanPipe', () => {
  let pipe: ParseOptionalBooleanPipe;

  beforeEach(() => {
    pipe = new ParseOptionalBooleanPipe();
  });

  it('应该将字符串 "true" 转换为 true', () => {
    expect(pipe.transform('true', { type: 'query', data: 'active' })).toBe(true);
  });

  it('应该将字符串 "FALSE" 转换为 false', () => {
    expect(pipe.transform('FALSE', { type: 'query', data: 'active' })).toBe(false);
  });

  it('应该将 "yes" 转换为 true', () => {
    expect(pipe.transform('yes', { type: 'query', data: 'active' })).toBe(true);
  });

  it('应该将 "0" 转换为 false', () => {
    expect(pipe.transform('0', { type: 'query', data: 'active' })).toBe(false);
  });

  it('应该将 "on" 转换为 true', () => {
    expect(pipe.transform('on', { type: 'query', data: 'active' })).toBe(true);
  });

  it('应该将 "off" 转换为 false', () => {
    expect(pipe.transform('off', { type: 'query', data: 'active' })).toBe(false);
  });

  it('未提供参数时返回 undefined', () => {
    expect(pipe.transform(undefined, { type: 'query', data: 'active' })).toBeUndefined();
  });

  it('空字符串返回 undefined', () => {
    expect(pipe.transform('', { type: 'query', data: 'active' })).toBeUndefined();
  });

  it('带默认值时返回默认值', () => {
    const pipeWithDefault = new ParseOptionalBooleanPipe({ defaultValue: true });
    expect(pipeWithDefault.transform(undefined, { type: 'query', data: 'active' })).toBe(true);
  });

  it('无效值抛出异常', () => {
    expect(() => pipe.transform('maybe', { type: 'query', data: 'active' }))
      .toThrow('active 必须是有效的布尔值');
  });
});
```

---

## 📚 相关文档

- [ParseBooleanPipe](./parse-boolean-pipe.md) - 必填布尔值管道
- [ParseOptionalStringPipe](./parse-optional-string-pipe.md) - 可选字符串管道
- [ParseOptionalIntPipe](./parse-optional-int-pipe.md) - 可选整数管道
- [公共管道快速入门](./common-quickstart.md) - 所有公共管道概览

---

**最后更新**: 2026-03-31  
**维护者**: 鲸创项目团队
