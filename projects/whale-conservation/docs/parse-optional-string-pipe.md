# ParseOptionalStringPipe 使用指南

> 可选字符串解析管道 - 用于处理查询参数中的可选字符串字段，支持自动修剪、长度验证、正则匹配

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

`ParseOptionalStringPipe` 是用于处理可选字符串参数的管道，适用于搜索过滤、可选配置、模糊查询等场景。当值为 `undefined`/`null`/空字符串时返回默认值。

### 核心功能

- ✅ 自动去除首尾空格（默认开启）
- ✅ 支持最小/最大长度验证
- ✅ 支持正则表达式匹配
- ✅ 支持大小写转换（toLowerCase/toUpperCase）
- ✅ 空值自动返回默认值
- ✅ 友好的中文错误提示

---

## 🚀 快速开始

### 基础用法 - 可选搜索关键词

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseOptionalStringPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('name', new ParseOptionalStringPipe({ trim: true })) name?: string,
    @Query('species', new ParseOptionalStringPipe({ toLowerCase: true })) species?: string
  ) {
    // name: 自动修剪空格
    // species: 自动转换为小写
    return this.whalesService.findAll({ name, species });
  }
}
```

### 带默认值的可选参数

```typescript
@Get('sightings')
findSightings(
  @Query('status', new ParseOptionalStringPipe({ 
    defaultValue: 'active',
    toLowerCase: true 
  })) status: string
) {
  // 如果未提供 status 参数，默认为 'active'
  return this.sightingsService.find({ status });
}
```

---

## 📋 实际应用场景

### 场景 1: 鲸鱼搜索 - 多条件模糊查询

```typescript
import { ParseOptionalStringPipe, ParseOptionalIntPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get('search')
  searchWhales(
    @Query('name', new ParseOptionalStringPipe({ 
      trim: true, 
      maxLength: 50 
    })) name?: string,
    @Query('tagId', new ParseOptionalStringPipe({ 
      pattern: /^[A-Z]{2,4}-\d{4,6}$/,
      patternMessage: '标签 ID 格式不正确，应为 2-4 个大写字母 + 短横线 + 4-6 位数字'
    })) tagId?: string,
    @Query('location', new ParseOptionalStringPipe({ 
      toLowerCase: true,
      trim: true 
    })) location?: string,
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 })) limit: number
  ) {
    return this.whalesService.search({ name, tagId, location, page, limit });
  }
}
```

**请求示例:**
```http
GET /whales/search?name=  Freedom  &tagId=AB-12345&location=South%20Pacific&page=1&limit=10
```

**处理结果:**
- `name`: `"Freedom"` (自动修剪空格)
- `tagId`: `"AB-12345"` (通过正则验证)
- `location`: `"south pacific"` (转换为小写)
- `page`: `1`
- `limit`: `10`

---

### 场景 2: 研究人员筛选 - 带格式验证

```typescript
@Controller('researchers')
export class ResearchersController {
  @Get()
  filterResearchers(
    @Query('institution', new ParseOptionalStringPipe({ 
      trim: true,
      maxLength: 100
    })) institution?: string,
    @Query('researchArea', new ParseOptionalStringPipe({ 
      toLowerCase: true,
      trim: true 
    })) researchArea?: string,
    @Query('title', new ParseOptionalStringPipe({ 
      pattern: /^(教授 | 副教授 | 讲师 | 研究员 | 助理研究员)$/,
      patternMessage: '职称必须是：教授、副教授、讲师、研究员、助理研究员'
    })) title?: string,
    @Query('email', new ParseOptionalStringPipe({ 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: '邮箱格式不正确'
    })) email?: string
  ) {
    return this.researchersService.filter({ institution, researchArea, title, email });
  }
}
```

**请求示例:**
```http
GET /researchers?institution=上海大学&researchArea= 海洋生态 &title=教授
```

**有效响应:**
```json
{
  "data": [
    {
      "id": "researcher-001",
      "name": "张教授",
      "institution": "上海大学经济学院",
      "title": "教授",
      "researchArea": "海洋生态保护",
      "email": "zhang.prof@shu.edu.cn"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**错误响应 (无效职称):**
```json
{
  "statusCode": 400,
  "message": "职称必须是：教授、副教授、讲师、研究员、助理研究员",
  "error": "Bad Request"
}
```

---

### 场景 3: 观测站查询 - 区域代码验证

```typescript
@Controller('stations')
export class StationsController {
  @Get()
  getStations(
    @Query('regionCode', new ParseOptionalStringPipe({ 
      pattern: /^[A-Z]{2}(-[A-Z]{2})?$/,
      patternMessage: '区域代码格式应为 XX 或 XX-XX (如：SP-SC)',
      toUpperCase: true
    })) regionCode?: string,
    @Query('status', new ParseOptionalStringPipe({ 
      defaultValue: 'active',
      toLowerCase: true,
      pattern: /^(active|inactive|maintenance)$/
    })) status: string,
    @Query('sortBy', new ParseOptionalStringPipe({ 
      defaultValue: 'createdAt',
      pattern: /^(createdAt|updatedAt|name|regionCode)$/
    })) sortBy: string,
    @Query('sortOrder', new ParseOptionalStringPipe({ 
      defaultValue: 'desc',
      pattern: /^(asc|desc)$/
    })) sortOrder: string
  ) {
    return this.stationsService.query({ regionCode, status, sortBy, sortOrder });
  }
}
```

**请求示例:**
```http
GET /stations?regionCode=sp-sc&status=ACTIVE&sortBy=name&sortOrder=ASC
```

**处理结果:**
- `regionCode`: `"SP-SC"` (自动转大写，通过验证)
- `status`: `"active"` (自动转小写，使用默认值验证)
- `sortBy`: `"name"` (通过白名单验证)
- `sortOrder`: `"asc"` (通过白名单验证)

---

### 场景 4: 环境变量监测 - 参数名标准化

```typescript
@Controller('environment')
export class EnvironmentController {
  @Get('metrics')
  getMetrics(
    @Query('metricType', new ParseOptionalStringPipe({ 
      toLowerCase: true,
      trim: true,
      pattern: /^(temperature|salinity|ph|dissolved_oxygen|turbidity)$/
    })) metricType?: string,
    @Query('stationId', new ParseOptionalStringPipe({ 
      trim: true 
    })) stationId?: string,
    @Query('unit', new ParseOptionalStringPipe({ 
      defaultValue: 'metric',
      pattern: /^(metric|imperial)$/
    })) unit: string
  ) {
    return this.environmentService.getMetrics({ metricType, stationId, unit });
  }
}
```

**请求示例:**
```http
GET /environment/metrics?metricType=  Temperature  &stationId=station-001&unit=METRIC
```

**处理结果:**
- `metricType`: `"temperature"` (修剪 + 小写)
- `stationId`: `"station-001"` (修剪)
- `unit`: `"metric"` (小写 + 默认值)

---

## ⚠️ 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `参数长度不能少于 X 个字符 (当前：Y)` | 字符串长度小于 minLength | 增加输入长度或调整 minLength |
| `参数长度不能超过 X 个字符 (当前：Y)` | 字符串长度大于 maxLength | 减少输入长度或调整 maxLength |
| `参数格式不正确` 或自定义 message | 不满足正则表达式 | 检查输入格式或调整 pattern |
| (无错误，返回 defaultValue) | 值为 undefined/null/空字符串 | 预期行为，使用默认值 |

### 边界情况处理

```typescript
// ✅ 这些情况会返回 defaultValue (如果设置了) 或 undefined
new ParseOptionalStringPipe().transform(undefined)  // undefined
new ParseOptionalStringPipe().transform(null)       // undefined
new ParseOptionalStringPipe().transform('')         // undefined
new ParseOptionalStringPipe({ defaultValue: 'N/A' }).transform('')  // 'N/A'

// ✅ 修剪后为空字符串也会返回默认值
new ParseOptionalStringPipe({ defaultValue: 'unknown' }).transform('   ')  // 'unknown'

// ❌ 这些情况会抛出 BadRequestException
new ParseOptionalStringPipe({ minLength: 5 }).transform('abc')  // 太短
new ParseOptionalStringPipe({ maxLength: 10 }).transform('this is too long')  // 太长
new ParseOptionalStringPipe({ pattern: /^\d+$/ }).transform('abc')  // 不匹配
```

---

## 🔧 配置选项

### ParseOptionalStringPipe 选项

```typescript
interface ParseOptionalStringOptions {
  /** 默认值，当输入为 undefined/null/空字符串时返回 */
  defaultValue?: string;
  
  /** 最小长度 */
  minLength?: number;
  
  /** 最大长度 */
  maxLength?: number;
  
  /** 正则表达式验证 */
  pattern?: RegExp;
  
  /** 正则验证失败时的错误消息 */
  patternMessage?: string;
  
  /** 是否自动去除首尾空格，默认 true */
  trim?: boolean;
  
  /** 是否转换为小写，默认 false */
  toLowerCase?: boolean;
  
  /** 是否转换为大写，默认 false */
  toUpperCase?: boolean;
}
```

### 选项组合示例

```typescript
// 用户名搜索 - 修剪 + 长度限制
new ParseOptionalStringPipe({ 
  trim: true, 
  maxLength: 20 
})

// 区域代码 - 大写 + 正则验证
new ParseOptionalStringPipe({ 
  toUpperCase: true,
  pattern: /^[A-Z]{2}(-[A-Z]{2})?$/,
  patternMessage: '区域代码格式应为 XX 或 XX-XX'
})

// 排序字段 - 小写 + 默认值 + 白名单
new ParseOptionalStringPipe({ 
  defaultValue: 'createdAt',
  toLowerCase: true,
  pattern: /^(createdAt|updatedAt|name)$/
})

// 状态过滤 - 小写 + 默认值 + 枚举验证
new ParseOptionalStringPipe({ 
  defaultValue: 'active',
  toLowerCase: true,
  pattern: /^(active|inactive|pending)$/
})
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **始终设置 trim: true** - 除非有特殊需求，否则自动修剪空格能避免很多问题
2. **使用 toLowerCase/toUpperCase 标准化输入** - 特别是用于搜索、过滤、排序的字段
3. **为枚举值设置 pattern** - 确保输入值在预期范围内
4. **提供有意义的 patternMessage** - 帮助用户理解正确的格式要求
5. **合理使用 defaultValue** - 为可选参数设置合理的默认值

### ❌ 避免的做法

1. **不要同时设置 toLowerCase 和 toUpperCase** - 只会生效最后一个
2. **不要在 pattern 中重复 trim 逻辑** - trim 会在正则验证之前执行
3. **不要对敏感信息使用 toLowerCase/toUpperCase** - 如密码、API 密钥等
4. **不要忽略 patternMessage** - 默认错误消息不够友好

---

## 🧪 测试示例

```typescript
import { ParseOptionalStringPipe } from '@/common/pipes';
import { BadRequestException } from '@nestjs/common';

describe('ParseOptionalStringPipe', () => {
  describe('基础功能', () => {
    it('should return undefined for empty values', () => {
      const pipe = new ParseOptionalStringPipe();
      expect(pipe.transform(undefined)).toBeUndefined();
      expect(pipe.transform(null)).toBeUndefined();
      expect(pipe.transform('')).toBeUndefined();
    });

    it('should return defaultValue for empty values', () => {
      const pipe = new ParseOptionalStringPipe({ defaultValue: 'default' });
      expect(pipe.transform(undefined)).toBe('default');
      expect(pipe.transform(null)).toBe('default');
      expect(pipe.transform('')).toBe('default');
      expect(pipe.transform('   ')).toBe('default'); // 修剪后为空
    });

    it('should trim whitespace by default', () => {
      const pipe = new ParseOptionalStringPipe();
      expect(pipe.transform('  hello  ')).toBe('hello');
      expect(pipe.transform('\tworld\n')).toBe('world');
    });

    it('should disable trim when option is false', () => {
      const pipe = new ParseOptionalStringPipe({ trim: false });
      expect(pipe.transform('  hello  ')).toBe('  hello  ');
    });
  });

  describe('大小写转换', () => {
    it('should convert to lowercase', () => {
      const pipe = new ParseOptionalStringPipe({ toLowerCase: true });
      expect(pipe.transform('HELLO')).toBe('hello');
      expect(pipe.transform('Hello World')).toBe('hello world');
    });

    it('should convert to uppercase', () => {
      const pipe = new ParseOptionalStringPipe({ toUpperCase: true });
      expect(pipe.transform('hello')).toBe('HELLO');
      expect(pipe.transform('Hello World')).toBe('HELLO WORLD');
    });
  });

  describe('长度验证', () => {
    it('should validate minLength', () => {
      const pipe = new ParseOptionalStringPipe({ minLength: 5 });
      expect(pipe.transform('hello')).toBe('hello');
      expect(() => pipe.transform('hi')).toThrow(BadRequestException);
    });

    it('should validate maxLength', () => {
      const pipe = new ParseOptionalStringPipe({ maxLength: 5 });
      expect(pipe.transform('hi')).toBe('hi');
      expect(() => pipe.transform('hello world')).toThrow(BadRequestException);
    });
  });

  describe('正则验证', () => {
    it('should validate pattern', () => {
      const pipe = new ParseOptionalStringPipe({ 
        pattern: /^\d{3}-\d{4}$/,
        patternMessage: '格式应为 XXX-XXXX'
      });
      expect(pipe.transform('123-4567')).toBe('123-4567');
      expect(() => pipe.transform('1234567')).toThrow(BadRequestException);
    });

    it('should use custom patternMessage', () => {
      const pipe = new ParseOptionalStringPipe({ 
        pattern: /^[A-Z]+$/,
        patternMessage: '必须是大写字母'
      });
      try {
        pipe.transform('abc');
      } catch (error) {
        expect(error.message).toBe('必须是大写字母');
      }
    });
  });

  describe('组合选项', () => {
    it('should apply trim before validation', () => {
      const pipe = new ParseOptionalStringPipe({ 
        trim: true,
        minLength: 5,
        toLowerCase: true
      });
      // '  HELLO  ' -> 'HELLO' -> 'hello' (长度 5，通过验证)
      expect(pipe.transform('  HELLO  ')).toBe('hello');
    });

    it('should handle complex validation', () => {
      const pipe = new ParseOptionalStringPipe({ 
        defaultValue: 'asc',
        toLowerCase: true,
        pattern: /^(asc|desc)$/
      });
      expect(pipe.transform(undefined)).toBe('asc');
      expect(pipe.transform('DESC')).toBe('desc');
      expect(pipe.transform('  ASC  ')).toBe('asc');
    });
  });
});
```

---

## 🔗 相关管道

| 管道 | 用途 |
|------|------|
| `ParseStringPipe` | 必填字符串验证 |
| `ParseOptionalIntPipe` | 可选整数参数 |
| `ParseOptionalFloatPipe` | 可选浮点数参数 |
| `ParseOptionalBooleanPipe` | 可选布尔参数 |
| `ParseOptionalDatePipe` | 可选日期参数 |
| `ParseEnumPipe` | 枚举值验证 |
| `ParseArrayPipe` | 数组验证 |

---

## 📚 相关文档

- [API Design](./api-design.md) - API 设计规范
- [API Examples](./api-examples.md) - API 使用示例
- [Common Quickstart](./common-quickstart.md) - 公共模块快速入门
- [Data Dictionary](./data-dictionary.md) - 数据字典
- [Development Setup](./development-setup.md) - 开发环境配置

---

**🐋 灵活的字符串处理，让搜索更智能！**
