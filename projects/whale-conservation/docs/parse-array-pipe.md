# ParseArrayPipe 使用指南

> 数组解析验证管道 - 用于多选筛选、批量操作、标签过滤等场景

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

`ParseArrayPipe` 是用于解析逗号分隔的字符串为数组的管道，支持类型转换、长度验证和枚举验证。适用于多选筛选、批量操作、标签过滤等需要处理多个值的场景。

### 核心功能

- ✅ 逗号分隔字符串解析为数组
- ✅ 自定义分隔符支持（分号、空格等）
- ✅ 数组项类型转换（字符串 → 数字/布尔值等）
- ✅ 数组长度验证（minItems/maxItems）
- ✅ 枚举类型验证
- ✅ 自定义错误消息
- ✅ 空数组处理配置

---

## 🚀 快速开始

### 基础用法 - 字符串数组

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseArrayPipe } from '@/common/pipes';

@Controller('species')
export class SpeciesController {
  @Get()
  findAll(
    @Query('ids', new ParseArrayPipe()) ids: string[]
  ) {
    // ids: ['blue', 'fin', 'humpback']
    return this.speciesService.findByIds(ids);
  }
}
```

**请求示例:**
```
GET /species?ids=blue,fin,humpback
```

### 自定义分隔符

```typescript
@Get('tags')
findByTags(
  @Query('tags', new ParseArrayPipe({ separator: ';' })) tags: string[]
) {
  // tags: ['migration', 'feeding', 'breeding']
  return this.speciesService.findByTags(tags);
}
```

**请求示例:**
```
GET /species/tags?tags=migration;feeding;breeding
```

---

## 📋 实际应用场景

### 场景 1: 多选物种筛选

```typescript
import { ParseArrayPipe, ParseOptionalIntPipe } from '@/common/pipes';

@Controller('sightings')
export class SightingsController {
  @Get()
  findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20 })) limit: number,
    @Query('species', new ParseArrayPipe()) species: string[],
    @Query('status', new ParseArrayPipe()) status: string[]
  ) {
    return this.sightingsService.findAll({
      page,
      limit,
      filters: {
        species: species.length > 0 ? species : undefined,
        status: status.length > 0 ? status : undefined
      }
    });
  }
}
```

**请求示例:**
```
GET /sightings?species=blue,fin,humpback&status=confirmed,verified&page=1&limit=20
```

**响应示例:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### 场景 2: 批量删除操作

```typescript
@Delete('whales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESEARCHER)
async batchDelete(
  @Query('ids', new ParseArrayPipe({ 
    allowEmpty: false,
    minItems: 1,
    maxItems: 50,
    errorMessage: '请提供 1-50 个鲸鱼 ID，使用逗号分隔'
  })) ids: string[]
) {
  const result = await this.whalesService.batchDelete(ids);
  return {
    message: `成功删除 ${result.deletedCount} 条记录`,
    deletedIds: result.deletedIds
  };
}
```

**请求示例:**
```
DELETE /whales?ids=uuid1,uuid2,uuid3,uuid4,uuid5
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "message": "成功删除 5 条记录",
    "deletedIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
  }
}
```

**错误响应 (超过最大数量):**
```json
{
  "statusCode": 400,
  "message": "请提供 1-50 个鲸鱼 ID，使用逗号分隔",
  "error": "Bad Request"
}
```

---

### 场景 3: 数值列表筛选（带类型转换）

```typescript
@Get('environment/depths')
findAtDepths(
  @Query('depths', new ParseArrayPipe({ 
    transform: (item) => parseFloat(item),
    allowEmpty: true
  })) depths: number[]
) {
  // depths: [100, 200, 300.5]
  return this.environmentService.findByDepths(depths);
}
```

**请求示例:**
```
GET /environment/depths?depths=100,200,300.5
```

---

### 场景 4: 枚举值验证

```typescript
import { StationStatus } from '@/stations/entities/station.entity';

@Get('stations')
findStations(
  @Query('status', new ParseArrayPipe({ 
    enum: StationStatus,
    allowEmpty: true 
  })) statuses: StationStatus[]
) {
  // statuses: ['ACTIVE', 'MAINTENANCE']
  return this.stationsService.findByStatus(statuses);
}
```

**请求示例:**
```
GET /stations?status=ACTIVE,MAINTENANCE
```

**错误响应 (无效枚举值):**
```json
{
  "statusCode": 400,
  "message": "值 \"INVALID\" 不是有效的枚举值",
  "error": "Bad Request"
}
```

---

### 场景 5: 标签搜索（带转换和清理）

```typescript
@Get('researchers')
findResearchers(
  @Query('tags', new ParseArrayPipe({ 
    separator: ';',
    transform: (item) => item.toLowerCase().trim(),
    allowEmpty: true
  })) tags: string[]
) {
  // tags: ['marine-biology', 'whale-tracking', 'data-analysis']
  return this.researchersService.findByTags(tags);
}
```

**请求示例:**
```
GET /researchers?tags=Marine-Biology; Whale-Tracking ;Data-Analysis
```

---

### 场景 6: 批量查询观测记录

```typescript
@Get('sightings/batch')
findBatchSightings(
  @Query('ids', new ParseArrayPipe({ 
    allowEmpty: false,
    minItems: 1,
    maxItems: 100
  })) ids: string[],
  @Query('fields', new ParseArrayPipe({ 
    allowEmpty: true,
    transform: (item) => item.toLowerCase()
  })) fields: string[]
) {
  // 支持字段选择
  const selectFields = fields.length > 0 ? fields : ['id', 'species', 'location', 'timestamp'];
  return this.sightingsService.findBatch(ids, selectFields);
}
```

**请求示例:**
```
GET /sightings/batch?ids=id1,id2,id3&fields=id,species,location,timestamp,notes
```

---

## ⚠️ 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `参数不能为空` | `allowEmpty: false` 且未提供参数 | 提供至少一个值或设置 `allowEmpty: true` |
| `数组长度不能少于 X 项` | 提供的值少于 `minItems` | 提供足够的值或调整 `minItems` |
| `数组长度不能超过 X 项` | 提供的值超过 `maxItems` | 减少值的数量或调整 `maxItems` |
| `值 "xxx" 不是有效的枚举值` | 值不在枚举类型中 | 检查枚举定义或使用有效值 |
| `请提供 1-50 个鲸鱼 ID` | 自定义错误消息 | 根据提示调整输入 |

### 空值处理行为

| 输入值 | `allowEmpty: true` | `allowEmpty: false` |
|--------|-------------------|---------------------|
| `undefined` | `[]` | ❌ 抛出异常 |
| `null` | `[]` | ❌ 抛出异常 |
| `''` (空字符串) | `[]` | ❌ 抛出异常 |
| `'a,b,c'` | `['a', 'b', 'c']` | `['a', 'b', 'c']` |

---

## 🔧 配置选项

### ParseArrayPipe 选项

```typescript
interface ParseArrayOptions {
  /** 分隔符，默认为逗号 */
  separator?: string;
  
  /** 是否允许空数组，默认为 true */
  allowEmpty?: boolean;
  
  /** 最小数组长度 */
  minItems?: number;
  
  /** 最大数组长度 */
  maxItems?: number;
  
  /** 数组项转换函数 */
  transform?: (item: string, index: number) => any;
  
  /** 枚举类型验证 */
  enum?: Type<any> | Record<string, any>;
  
  /** 自定义错误消息 */
  errorMessage?: string;
}
```

### 选项详解

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `separator` | `string` | `','` | 分隔符，支持任意字符（如 `;`、`|`、空格） |
| `allowEmpty` | `boolean` | `true` | 是否允许空数组，`false` 时空值抛出异常 |
| `minItems` | `number` | `0` | 数组最小长度限制 |
| `maxItems` | `number` | `Infinity` | 数组最大长度限制，防止滥用 |
| `transform` | `function` | `undefined` | 数组项转换函数，用于类型转换或数据清理 |
| `enum` | `Type/Record` | `undefined` | 枚举类型，验证数组项是否为有效枚举值 |
| `errorMessage` | `string` | `undefined` | 自定义错误消息，覆盖默认提示 |

---

## 📝 最佳实践

### ✅ 推荐做法

1. **设置合理的长度限制** - 使用 `minItems`/`maxItems` 防止空提交或恶意大量请求
   ```typescript
   @Query('ids', new ParseArrayPipe({ minItems: 1, maxItems: 50 }))
   ```

2. **使用枚举验证** - 对于固定选项使用 `enum` 确保数据有效性
   ```typescript
   @Query('status', new ParseArrayPipe({ enum: StationStatus }))
   ```

3. **提供清晰的错误消息** - 使用 `errorMessage` 自定义用户友好的提示
   ```typescript
   @Query('ids', new ParseArrayPipe({ 
     errorMessage: '请提供至少一个 ID，最多 50 个，使用逗号分隔'
   }))
   ```

4. **选择合适的分隔符** - 如果数据可能包含逗号，使用其他分隔符
   ```typescript
   @Query('tags', new ParseArrayPipe({ separator: ';' }))
   ```

5. **使用 transform 进行数据清理** - 自动转换大小写、去除空格等
   ```typescript
   @Query('tags', new ParseArrayPipe({ 
     transform: (item) => item.toLowerCase().trim()
   }))
   ```

### ❌ 避免的做法

1. **不要接受无限制的数组** - 始终设置 `maxItems` 防止资源耗尽
   ```typescript
   // ❌ 不推荐
   @Query('ids', new ParseArrayPipe()) ids: string[]
   
   // ✅ 推荐
   @Query('ids', new ParseArrayPipe({ maxItems: 100 })) ids: string[]
   ```

2. **不要在 transform 中执行复杂操作** - 转换函数应简单高效
   ```typescript
   // ❌ 不推荐 - 复杂操作
   @Query('ids', new ParseArrayPipe({ 
     transform: (item) => {
       // 数据库查询、API 调用等
     }
   }))
   
   // ✅ 推荐 - 简单转换
   @Query('ids', new ParseArrayPipe({ 
     transform: (item) => item.trim().toLowerCase()
   }))
   ```

3. **不要忽略空值处理** - 根据业务需求明确设置 `allowEmpty`
   ```typescript
   // 必填数组
   @Query('ids', new ParseArrayPipe({ allowEmpty: false, minItems: 1 }))
   
   // 可选数组
   @Query('tags', new ParseArrayPipe({ allowEmpty: true }))
   ```

---

## 🧪 测试示例

```typescript
import { ParseArrayPipe } from '@/common/pipes';
import { BadRequestException } from '@nestjs/common';

describe('ParseArrayPipe', () => {
  describe('基础解析', () => {
    const pipe = new ParseArrayPipe();

    it('should parse comma-separated string', () => {
      expect(pipe.transform('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(pipe.transform('a, b, c')).toEqual(['a', 'b', 'c']); // 自动 trim
    });

    it('should handle empty values', () => {
      expect(pipe.transform('')).toEqual([]);
      expect(pipe.transform(undefined)).toEqual([]);
      expect(pipe.transform(null)).toEqual([]);
    });

    it('should handle single value', () => {
      expect(pipe.transform('single')).toEqual(['single']);
    });
  });

  describe('自定义分隔符', () => {
    const pipe = new ParseArrayPipe({ separator: ';' });

    it('should parse semicolon-separated string', () => {
      expect(pipe.transform('a;b;c')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('长度验证', () => {
    it('should enforce minItems', () => {
      const pipe = new ParseArrayPipe({ minItems: 2 });
      expect(() => pipe.transform('a')).toThrow(BadRequestException);
      expect(pipe.transform('a,b')).toEqual(['a', 'b']);
    });

    it('should enforce maxItems', () => {
      const pipe = new ParseArrayPipe({ maxItems: 2 });
      expect(() => pipe.transform('a,b,c')).toThrow(BadRequestException);
      expect(pipe.transform('a,b')).toEqual(['a', 'b']);
    });
  });

  describe('类型转换', () => {
    it('should transform to numbers', () => {
      const pipe = new ParseArrayPipe({ 
        transform: (item) => parseFloat(item)
      });
      expect(pipe.transform('1,2,3')).toEqual([1, 2, 3]);
      expect(pipe.transform('1.5,2.7,3.9')).toEqual([1.5, 2.7, 3.9]);
    });

    it('should transform to lowercase', () => {
      const pipe = new ParseArrayPipe({ 
        transform: (item) => item.toLowerCase()
      });
      expect(pipe.transform('A,B,C')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('不允许空数组', () => {
    const pipe = new ParseArrayPipe({ allowEmpty: false });

    it('should reject empty values', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
      expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
      expect(() => pipe.transform(null)).toThrow(BadRequestException);
    });

    it('should accept non-empty values', () => {
      expect(pipe.transform('a')).toEqual(['a']);
    });
  });

  describe('自定义错误消息', () => {
    it('should use custom error message', () => {
      const pipe = new ParseArrayPipe({ 
        allowEmpty: false,
        errorMessage: '请提供至少一个值'
      });
      try {
        pipe.transform('');
      } catch (error) {
        expect(error.message).toBe('请提供至少一个值');
      }
    });
  });
});
```

---

## 🔗 相关管道

| 管道 | 用途 | 配合场景 |
|------|------|---------|
| `ParseEnumPipe` | 单个枚举值验证 | 单选 vs 多选枚举 |
| `ParseStringPipe` | 字符串验证 | 单个字符串 vs 字符串数组 |
| `ParseIntPipe` | 整数验证 | 单个数字 vs 数字数组 |
| `ParseOptionalIntPipe` | 可选整数 | 分页参数配合数组筛选 |

---

## 📚 相关文档

- [API Design](./api-design.md) - API 设计规范
- [API Examples](./api-examples.md) - API 使用示例
- [Common Quickstart](./common-quickstart.md) - 公共模块快速入门
- [ParseEnumPipe](./common-quickstart.md#parseenum-pipe) - 枚举值验证管道
- [PaginationPipe](./common-quickstart.md#pagination-pipe) - 分页参数管道

---

## 🎯 快速参考

### 常用配置组合

```typescript
// 1. 多选筛选（可选）
@Query('tags', new ParseArrayPipe({ allowEmpty: true }))

// 2. 批量操作（必填，限制数量）
@Query('ids', new ParseArrayPipe({ 
  allowEmpty: false, 
  minItems: 1, 
  maxItems: 50 
}))

// 3. 数值列表（带转换）
@Query('depths', new ParseArrayPipe({ 
  transform: (item) => parseFloat(item),
  allowEmpty: true 
}))

// 4. 枚举验证
@Query('status', new ParseArrayPipe({ 
  enum: StationStatus,
  allowEmpty: true 
}))

// 5. 自定义分隔符 + 清理
@Query('keywords', new ParseArrayPipe({ 
  separator: ';',
  transform: (item) => item.toLowerCase().trim()
}))
```

---

**🐋 批量处理，从有效的数组验证开始！**
