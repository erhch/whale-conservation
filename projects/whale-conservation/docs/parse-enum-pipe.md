# ParseEnumPipe 使用指南

> 枚举值解析管道 - 用于状态、类型、分类等有限选项参数的验证

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseEnumPipe` 是用于将字符串参数验证并转换为 TypeScript 枚举值的管道，适用于状态筛选、类型分类、排序方式等有限选项的场景。

### 核心功能

- ✅ 支持任意 TypeScript 枚举类型
- ✅ 自动提取枚举的有效值进行验证
- ✅ 支持必填/可选配置
- ✅ 支持默认值设置
- ✅ 友好的中文错误提示（列出所有有效选项）
- ✅ 自动处理 undefined/null/空字符串

---

## 🚀 快速开始

### 基础用法 - 必填枚举参数

首先定义枚举类型：

```typescript
// src/whales/whale.enum.ts
export enum WhaleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ENDANGERED = 'endangered',
  DECEASED = 'deceased'
}
```

然后在 Controller 中使用：

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseEnumPipe } from '@/common/pipes';
import { WhaleStatus } from './whales/whale.enum';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('status', new ParseEnumPipe({ enumType: WhaleStatus })) 
    status: WhaleStatus
  ) {
    // status 已验证为有效的 WhaleStatus 枚举值
    return this.whalesService.findAll({ status });
  }
}
```

**请求示例:**
```
GET /whales?status=active
GET /whales?status=endangered
```

### 可选枚举参数

```typescript
@Get('sightings')
findSightings(
  @Query('type', new ParseEnumPipe({ 
    enumType: SightingType,
    required: false 
  })) 
  type?: SightingType
) {
  // 如果未提供 type 参数，值为 undefined
  return this.sightingsService.find({ type });
}
```

### 带默认值的枚举参数

```typescript
@Get('whales')
findAll(
  @Query('sortBy', new ParseEnumPipe({ 
    enumType: SortField,
    required: false, 
    defaultValue: SortField.NAME 
  })) 
  sortBy: SortField
) {
  // 如果未提供 sortBy 参数，默认值为 SortField.NAME
  return this.whalesService.findAll({ sortBy });
}
```

---

## 📋 实际应用场景

### 场景 1: 状态筛选

```typescript
import { ParseEnumPipe, ParseStringPipe } from '@/common/pipes';
import { WhaleStatus } from './whales/whale.enum';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('status', new ParseEnumPipe({ enumType: WhaleStatus })) 
    status: WhaleStatus,
    @Query('name', new ParseStringPipe({ required: false })) name?: string
  ) {
    return this.whalesService.findAll({ status, name });
  }
}
```

**请求示例:**
```
GET /whales?status=active
GET /whales?status=endangered&name=大白
```

### 场景 2: 观测类型筛选

```typescript
// src/sightings/sighting.enum.ts
export enum SightingType {
  VISUAL = 'visual',
  ACOUSTIC = 'acoustic',
  DRONE = 'drone',
  SATELLITE = 'satellite'
}
```

```typescript
@Controller('sightings')
export class SightingsController {
  @Get()
  findAll(
    @Query('type', new ParseEnumPipe({ enumType: SightingType })) 
    type: SightingType,
    @Query('verified', new ParseBooleanPipe({ required: false })) 
    verified?: boolean
  ) {
    return this.sightingsService.findAll({ type, verified });
  }
}
```

**请求示例:**
```
GET /sightings?type=visual
GET /sightings?type=drone&verified=true
```

### 场景 3: 排序字段选择

```typescript
// src/common/enums/sort-field.enum.ts
export enum SortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SIGHTINGS_COUNT = 'sightingsCount'
}
```

```typescript
@Get('whales')
findAll(
  @Query('sortBy', new ParseEnumPipe({ 
    enumType: SortField,
    required: false,
    defaultValue: SortField.NAME
  })) 
  sortBy: SortField,
  @Query('sortOrder', new ParseEnumPipe({ 
    enumType: SortOrder,
    required: false,
    defaultValue: SortOrder.ASC
  })) 
  sortOrder: SortOrder
) {
  return this.whalesService.findAll({ sortBy, sortOrder });
}
```

**请求示例:**
```
GET /whales?sortBy=sightingsCount&sortOrder=desc
GET /whales?sortBy=createdAt
```

### 场景 4: 观测站类型

```typescript
// src/stations/station.enum.ts
export enum StationType {
  COASTAL = 'coastal',
  OFFSHORE = 'offshore',
  MOBILE = 'mobile',
  RESEARCH = 'research'
}
```

```typescript
@Controller('stations')
export class StationsController {
  @Get()
  findAll(
    @Query('type', new ParseEnumPipe({ 
      enumType: StationType,
      required: false 
    })) 
    type?: StationType,
    @Query('region', new ParseStringPipe({ required: false })) 
    region?: string
  ) {
    return this.stationsService.findAll({ type, region });
  }
}
```

**请求示例:**
```
GET /stations?type=coastal
GET /stations?type=research&region=东海
```

---

## 📊 支持的枚举类型

### 字符串枚举 (推荐)

```typescript
export enum WhaleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ENDANGERED = 'endangered'
}
```

**请求:** `GET /whales?status=active`

### 数字枚举 (自动转换为字符串匹配)

```typescript
export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}
```

**注意:** 数字枚举在 URL 中仍需以字符串形式传递  
**请求:** `GET /tasks?priority=1`

### 混合枚举 (仅字符串值有效)

```typescript
export enum MixedEnum {
  STRING_VAL = 'string',
  NUMBER_VAL = 123  // 不会被包含在有效值中
}
```

**有效值:** 仅 `['string']`

---

## ⚠️ 错误处理

### 错误 1: 必填参数未提供

```typescript
@Query('status', new ParseEnumPipe({ enumType: WhaleStatus })) status: WhaleStatus
```

**请求:** `GET /whales` (缺少 status 参数)

**响应:**
```json
{
  "statusCode": 400,
  "message": "status 是必填项",
  "error": "Bad Request"
}
```

### 错误 2: 无效的枚举值

```typescript
@Query('type', new ParseEnumPipe({ enumType: SightingType })) type: SightingType
```

**请求:** `GET /sightings?type=unknown`

**响应:**
```json
{
  "statusCode": 400,
  "message": "type 必须是以下值之一：visual, acoustic, drone, satellite",
  "error": "Bad Request"
}
```

### 错误 3: 大小写不匹配

```typescript
@Query('status', new ParseEnumPipe({ enumType: WhaleStatus })) status: WhaleStatus
```

**请求:** `GET /whales?status=ACTIVE` (枚举定义为 'active')

**响应:**
```json
{
  "statusCode": 400,
  "message": "status 必须是以下值之一：active, inactive, endangered, deceased",
  "error": "Bad Request"
}
```

**注意:** 枚举值匹配是**区分大小写**的

---

## 🔧 配置选项

```typescript
interface ParseEnumOptions<T = any> {
  /**
   * 枚举类型 (必填)
   */
  enumType: T;

  /**
   * 是否必填
   * @default false
   */
  required?: boolean;

  /**
   * 默认值 (仅在 required=false 且值为空时使用)
   * @default undefined
   */
  defaultValue?: T[keyof T];
}
```

### 配置示例

```typescript
// 必填，无默认值
new ParseEnumPipe({ enumType: WhaleStatus })

// 可选，undefined 当未提供
new ParseEnumPipe({ enumType: SightingType, required: false })

// 可选，带默认值
new ParseEnumPipe({ 
  enumType: SortField, 
  required: false, 
  defaultValue: SortField.NAME 
})
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **使用字符串枚举**
   ```typescript
   // 好：URL 友好，易于调试
   export enum Status {
     ACTIVE = 'active',
     INACTIVE = 'inactive'
   }
   ```

2. **枚举值使用小写 + 下划线或驼峰**
   ```typescript
   // 好：一致的命名风格
   export enum SortOrder {
     ASC = 'asc',
     DESC = 'desc'
   }
   ```

3. **为常用参数设置合理的默认值**
   ```typescript
   // 好：明确默认排序方式
   @Query('sortOrder', new ParseEnumPipe({ 
     enumType: SortOrder,
     required: false,
     defaultValue: SortOrder.ASC
   }))
   ```

4. **在 Swagger 文档中注明枚举值**
   ```typescript
   @ApiQuery({
     name: 'status',
     enum: WhaleStatus,
     description: '鲸鱼状态筛选'
   })
   ```

### ❌ 避免做法

1. **避免使用数字枚举 (除非必要)**
   ```typescript
   // 避免：不够直观
   export enum Status {
     ACTIVE = 1,
     INACTIVE = 0
   }
   ```

2. **避免枚举值过多**
   ```typescript
   // 避免：超过 10 个选项考虑用其他方式
   export enum TooManyOptions {
     // ... 20 个选项
   }
   ```

3. **避免动态修改枚举**
   ```typescript
   // 避免：枚举应该是静态的
   Status['NEW_VALUE'] = 'new_value';
   ```

---

## 🧪 测试示例

```typescript
import { Test } from '@nestjs/testing';
import { ParseEnumPipe } from '@/common/pipes';

enum TestStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

describe('ParseEnumPipe', () => {
  let pipe: ParseEnumPipe<typeof TestStatus>;

  beforeEach(() => {
    pipe = new ParseEnumPipe({ enumType: TestStatus });
  });

  it('应该将有效字符串转换为枚举值', () => {
    expect(pipe.transform('active', { type: 'query', data: 'status' }))
      .toBe(TestStatus.ACTIVE);
  });

  it('应该拒绝无效的枚举值', () => {
    expect(() => pipe.transform('unknown', { type: 'query', data: 'status' }))
      .toThrow();
  });

  it('必填参数未提供时抛出异常', () => {
    expect(() => pipe.transform(undefined, { type: 'query', data: 'status' }))
      .toThrow();
  });

  it('可选参数未提供时返回 undefined', () => {
    const optionalPipe = new ParseEnumPipe({ 
      enumType: TestStatus, 
      required: false 
    });
    expect(optionalPipe.transform(undefined, { type: 'query', data: 'status' }))
      .toBeUndefined();
  });

  it('可选参数未提供时返回默认值', () => {
    const defaultPipe = new ParseEnumPipe({ 
      enumType: TestStatus, 
      required: false,
      defaultValue: TestStatus.PENDING
    });
    expect(defaultPipe.transform(undefined, { type: 'query', data: 'status' }))
      .toBe(TestStatus.PENDING);
  });

  it('空字符串视为未提供', () => {
    const optionalPipe = new ParseEnumPipe({ 
      enumType: TestStatus, 
      required: false 
    });
    expect(optionalPipe.transform('', { type: 'query', data: 'status' }))
      .toBeUndefined();
  });
});
```

---

## 🔗 完整枚举示例

### 鲸鱼状态枚举

```typescript
// src/whales/whale.enum.ts
export enum WhaleStatus {
  /** 活跃 - 正常活动的鲸鱼 */
  ACTIVE = 'active',
  
  /** 非活跃 - 暂时未观测到活动 */
  INACTIVE = 'inactive',
  
  /** 濒危 - 需要特别关注 */
  ENDANGERED = 'endangered',
  
  /** 已死亡 - 确认死亡 */
  DECEASED = 'deceased'
}

export enum WhaleSex {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown'
}

export enum WhaleAgeGroup {
  CALF = 'calf',
  JUVENILE = 'juvenile',
  ADULT = 'adult',
  SENIOR = 'senior'
}
```

### 观测类型枚举

```typescript
// src/sightings/sighting.enum.ts
export enum SightingType {
  /** 目视观测 */
  VISUAL = 'visual',
  
  /** 声学观测 */
  ACOUSTIC = 'acoustic',
  
  /** 无人机观测 */
  DRONE = 'drone',
  
  /** 卫星追踪 */
  SATELLITE = 'satellite'
}

export enum SightingQuality {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}
```

### 排序枚举

```typescript
// src/common/enums/sort.enum.ts
export enum SortField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  SIGHTINGS_COUNT = 'sightingsCount'
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}
```

---

## 📚 相关文档

- [ParseStringPipe](./parse-string-pipe.md) - 字符串验证管道
- [ParseBooleanPipe](./parse-boolean-pipe.md) - 布尔值验证管道
- [ParseIntPipe](./parse-int-pipe.md) - 整数验证管道
- [公共管道快速入门](./common-quickstart.md) - 所有公共管道概览

---

**最后更新**: 2026-03-31  
**维护者**: 鲸创项目团队
