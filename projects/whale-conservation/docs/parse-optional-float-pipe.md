# ParseOptionalFloatPipe 使用指南

> 可选浮点数解析管道 - 用于可选测量数据、科学记录、环境参数等场景

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseOptionalFloatPipe` 是用于将字符串/数字转换为标准浮点数类型的**可选**管道。与 `ParseFloatPipe` 不同，当参数未提供或为空时，它返回 `undefined` 或指定的默认值，而不会抛出错误。

### 核心功能

- ✅ **可选参数** - 未提供时不报错
- ✅ 支持默认值设置
- ✅ 支持最小值/最大值范围验证
- ✅ 支持小数精度验证
- ✅ 自动处理字符串到浮点数的转换
- ✅ 友好的中文错误提示
- ✅ 适用于科学测量数据

### 与 ParseFloatPipe 的区别

| 特性 | ParseFloatPipe | ParseOptionalFloatPipe |
|------|----------------|------------------------|
| 参数必填 | ✅ 是 | ❌ 否 |
| 未提供时 | 抛出错误 | 返回 `undefined` 或默认值 |
| 配置选项 | `defaultValue`, `min`, `max` | `defaultValue`, `min`, `max`, `precision` |
| 使用场景 | 必填浮点参数 (如坐标、精确测量) | 可选筛选条件 (如范围查询、环境参数) |

### 与 ParseOptionalIntPipe 的区别

| 特性 | ParseOptionalIntPipe | ParseOptionalFloatPipe |
|------|---------------------|------------------------|
| 数据类型 | 整数 | 浮点数 (小数) |
| 精度验证 | ❌ 不支持 | ✅ 支持 `precision` 选项 |
| 使用场景 | 数量、页码、偏移量 | 长度、重量、温度、盐度等测量值 |

---

## 🚀 快速开始

### 基础用法 - 可选浮点数参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseOptionalFloatPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get('by-size')
  findBySize(
    @Query('minLength', new ParseOptionalFloatPipe()) minLength?: number
  ) {
    // minLength 可能是 number/undefined
    return this.whalesService.findBySize({ minLength });
  }
}
```

**请求示例:**
```
GET /whales/by-size?minLength=12.5      # minLength = 12.5
GET /whales/by-size?minLength=15.75     # minLength = 15.75
GET /whales/by-size                     # minLength = undefined
GET /whales/by-size?minLength=          # minLength = undefined (空字符串)
```

### 带默认值的可选参数

```typescript
@Get('sightings')
findSightings(
  @Query('waterTemp', new ParseOptionalFloatPipe({ defaultValue: 20.0 })) 
  waterTemp: number
) {
  // 如果未提供 waterTemp 参数，默认值为 20.0
  return this.sightingsService.find({ waterTemp });
}
```

**请求示例:**
```
GET /sightings?waterTemp=18.5   # waterTemp = 18.5
GET /sightings                  # waterTemp = 20.0 (默认值)
```

### 带范围验证的可选参数

```typescript
@Get('stations')
findStations(
  @Query('ph', new ParseOptionalFloatPipe({ 
    defaultValue: 8.1, 
    min: 7.5, 
    max: 8.5 
  })) 
  ph: number
) {
  // pH 值必须在 7.5-8.5 之间 (正常海水 pH 范围)
  return this.stationsService.find({ ph });
}
```

**请求示例:**
```
GET /stations?ph=8.0           # ph = 8.0
GET /stations?ph=7.0           # ❌ 400 错误：ph 不能小于 7.5
GET /stations?ph=9.0           # ❌ 400 错误：ph 不能大于 8.5
GET /stations                  # ph = 8.1 (默认值)
```

### 带精度验证的可选参数

```typescript
@Get('whales')
findAll(
  @Query('weight', new ParseOptionalFloatPipe({ 
    min: 0, 
    precision: 2 
  })) 
  weight?: number
) {
  // weight 最多保留 2 位小数
  return this.whalesService.findAll({ weight });
}
```

**请求示例:**
```
GET /whales?weight=1500.50     # weight = 1500.5
GET /whales?weight=1500.567    # ❌ 400 错误：weight 最多保留 2 位小数
GET /whales?weight=1500        # weight = 1500
```

---

## 📋 实际应用场景

### 场景 1: 鲸鱼体长/体重筛选

```typescript
import { ParseOptionalFloatPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get('by-size')
  findBySize(
    @Query('minLength', new ParseOptionalFloatPipe({ min: 0 })) 
    minLength?: number,
    @Query('maxLength', new ParseOptionalFloatPipe({ min: 0 })) 
    maxLength?: number,
    @Query('minWeight', new ParseOptionalFloatPipe({ min: 0 })) 
    minWeight?: number,
    @Query('maxWeight', new ParseOptionalFloatPipe({ min: 0 })) 
    maxWeight?: number
  ) {
    // 所有参数都是可选的，用户可以灵活组合筛选
    return this.whalesService.findBySize({ 
      minLength, 
      maxLength, 
      minWeight, 
      maxWeight 
    });
  }
}
```

**请求示例:**
```
GET /whales/by-size?minLength=10.5          # 只筛选长度 >= 10.5 米
GET /whales/by-size?minLength=10&maxLength=15  # 长度在 10-15 米之间
GET /whales/by-size?minWeight=500&maxWeight=2000  # 体重在 500-2000kg 之间
GET /whales/by-size?minLength=12&minWeight=800  # 长度 >= 12 米 且 体重 >= 800kg
GET /whales/by-size                         # 无筛选条件
```

### 场景 2: 海洋环境参数监测

```typescript
@Controller('stations')
export class StationsController {
  @Get('environment')
  findEnvironmentalData(
    @Query('waterTemp', new ParseOptionalFloatPipe({ 
      min: -2, 
      max: 30, 
      precision: 1 
    })) 
    waterTemp?: number,
    @Query('salinity', new ParseOptionalFloatPipe({ 
      min: 0, 
      max: 40, 
      precision: 2 
    })) 
    salinity?: number,
    @Query('ph', new ParseOptionalFloatPipe({ 
      min: 7.5, 
      max: 8.5, 
      precision: 2 
    })) 
    ph?: number,
    @Query('dissolvedOxygen', new ParseOptionalFloatPipe({ 
      min: 0, 
      max: 14, 
      precision: 2 
    })) 
    dissolvedOxygen?: number
  ) {
    // 海洋环境参数筛选
    return this.stationsService.findEnvironmentalData({
      waterTemp,      // 水温：-2°C 到 30°C
      salinity,       // 盐度：0 到 40 PSU
      ph,             // pH 值：7.5 到 8.5
      dissolvedOxygen // 溶解氧：0 到 14 mg/L
    });
  }
}
```

**请求示例:**
```
GET /stations/environment?waterTemp=18.5&salinity=34.5
# 水温 18.5°C，盐度 34.5 PSU

GET /stations/environment?ph=8.1
# pH 值 8.1

GET /stations/environment?waterTemp=35
# ❌ 400 错误：waterTemp 不能大于 30

GET /stations/environment?salinity=35.678
# ❌ 400 错误：salinity 最多保留 2 位小数
```

### 场景 3: 观测数据精度控制

```typescript
@Controller('sightings')
export class SightingsController {
  @Get()
  findAll(
    @Query('accuracy', new ParseOptionalFloatPipe({ 
      defaultValue: 100.0, 
      min: 0, 
      max: 1000, 
      precision: 1 
    })) 
    accuracy: number,
    @Query('distance', new ParseOptionalFloatPipe({ 
      min: 0, 
      precision: 2 
    })) 
    distance?: number
  ) {
    // accuracy: 观测精度 (米)，默认 100 米
    // distance: 观测距离 (公里)
    return this.sightingsService.findAll({ accuracy, distance });
  }
}
```

**请求示例:**
```
GET /sightings?accuracy=50.5&distance=2.5    # 精度 50.5 米，距离 2.5 公里
GET /sightings?accuracy=10                   # 精度 10 米，距离 undefined
GET /sightings?distance=5.25                 # 精度 100 米 (默认)，距离 5.25 公里
GET /sightings                               # 精度 100 米，距离 undefined
```

### 场景 4: 科学研究数据查询

```typescript
@Controller('research')
export class ResearchController {
  @Get('measurements')
  findMeasurements(
    @Query('confidence', new ParseOptionalFloatPipe({ 
      min: 0, 
      max: 1, 
      precision: 3 
    })) 
    confidence?: number,
    @Query('errorMargin', new ParseOptionalFloatPipe({ 
      min: 0, 
      precision: 4 
    })) 
    errorMargin?: number
  ) {
    // confidence: 置信度 (0-1)
    // errorMargin: 误差范围
    return this.researchService.findMeasurements({
      confidence,
      errorMargin
    });
  }
}
```

**请求示例:**
```
GET /research/measurements?confidence=0.95      # 置信度 95%
GET /research/measurements?confidence=0.999     # 置信度 99.9%
GET /research/measurements?errorMargin=0.0001   # 误差范围 0.01%
GET /research/measurements?confidence=0.9&errorMargin=0.05
# 置信度 90%，误差范围 5%
```

### 场景 5: 地理坐标范围查询

```typescript
@Controller('whales')
export class WhalesController {
  @Get('near')
  findNearLocation(
    @Query('lat', new ParseOptionalFloatPipe({ 
      min: -90, 
      max: 90, 
      precision: 6 
    })) 
    lat?: number,
    @Query('lng', new ParseOptionalFloatPipe({ 
      min: -180, 
      max: 180, 
      precision: 6 
    })) 
    lng?: number,
    @Query('radius', new ParseOptionalFloatPipe({ 
      defaultValue: 10.0, 
      min: 0.1, 
      max: 1000, 
      precision: 2 
    })) 
    radius: number
  ) {
    // lat/lng: 经纬度坐标
    // radius: 搜索半径 (公里)
    return this.whalesService.findNearLocation({ lat, lng, radius });
  }
}
```

**请求示例:**
```
GET /whales/near?lat=31.230959&lng=121.473703&radius=50
# 上海附近 50 公里范围内

GET /whales/near?lat=31.23&lng=121.47
# 上海附近 10 公里范围内 (默认半径)

GET /whales/near?radius=100
# 未指定坐标，仅使用默认半径

GET /whales/near?lat=95&lng=121
# ❌ 400 错误：lat 不能大于 90
```

---

## 📊 支持的输入格式

### 有效输入

| 输入类型 | 值 | 示例 | 结果 |
|---------|-----|------|------|
| 字符串 | '12.5' | `?weight=12.5` | 12.5 |
| 字符串 | '0.0' | `?offset=0.0` | 0.0 |
| 字符串 | '-3.14' | `?temp=-3.14` | -3.14 |
| 字符串 | '1e2' | `?value=1e2` | 100 |
| 字符串 | '3.14159' | `?pi=3.14159` | 3.14159 |
| 数字 | 12.5 | (JSON 请求体) | 12.5 |
| 数字 | 0 | (JSON 请求体) | 0 |
| 数字 | -3.14 | (JSON 请求体) | -3.14 |

### 空值 (返回 `undefined` 或 `defaultValue`)

| 输入 | 结果 |
|------|------|
| 参数未提供 | `undefined` 或 `defaultValue` |
| 空字符串 `''` | `undefined` 或 `defaultValue` |
| `null` | `undefined` 或 `defaultValue` |

### 无效输入 (抛出错误)

| 输入 | 错误信息 |
|------|----------|
| 'abc' | `{参数} 必须是有效的数字` |
| '12.5.6' | `{参数} 必须是有效的数字` |
| Infinity | `{参数} 必须是有效的数字` |
| NaN | `{参数} 必须是有效的数字` |
| 超出范围值 | `{参数} 不能小于/大于 {限制值}` |
| 精度超限 | `{参数} 最多保留 {n} 位小数` |

---

## ⚙️ 配置选项

### ParseOptionalFloatOptions 接口

```typescript
export interface ParseOptionalFloatOptions {
  defaultValue?: number;    // 默认值 (未提供参数时使用)
  min?: number;             // 最小值
  max?: number;             // 最大值
  precision?: number;       // 小数位数限制
}
```

### 选项详解

#### `defaultValue` (可选)

当参数未提供或为空时返回的默认值。

```typescript
@Query('threshold', new ParseOptionalFloatPipe({ defaultValue: 0.5 }))
threshold: number;  // 类型是 number (不是 number | undefined)
```

#### `min` (可选)

允许的最小值。

```typescript
@Query('weight', new ParseOptionalFloatPipe({ min: 0 }))
weight?: number;  // 不能是负数
```

#### `max` (可选)

允许的最大值。

```typescript
@Query('confidence', new ParseOptionalFloatPipe({ max: 1 }))
confidence?: number;  // 不能大于 1
```

#### `precision` (可选)

允许的最大小数位数。

```typescript
@Query('price', new ParseOptionalFloatPipe({ precision: 2 }))
price?: number;  // 最多 2 位小数 (如 19.99)
```

---

## 🔍 验证行为详解

### 精度验证逻辑

```typescript
// precision: 2 的验证示例
12.5      → ✅ 通过 (1 位小数)
12.50     → ✅ 通过 (2 位小数)
12.567    → ❌ 失败 (3 位小数)
12        → ✅ 通过 (0 位小数)
12.0      → ✅ 通过 (1 位小数)
```

### 范围验证逻辑

```typescript
// min: 0, max: 100 的验证示例
-1        → ❌ 失败 (小于最小值)
0         → ✅ 通过 (等于最小值)
50        → ✅ 通过 (在范围内)
100       → ✅ 通过 (等于最大值)
100.01    → ❌ 失败 (大于最大值)
```

### 空值处理逻辑

```typescript
// defaultValue: 10.0 的处理示例
undefined   → 10.0 (返回默认值)
null        → 10.0 (返回默认值)
''          → 10.0 (返回默认值)
'   '       → ❌ 失败 (空白字符串无法转换为数字)
```

---

## 🧪 测试用例

### 单元测试示例

```typescript
import { ParseOptionalFloatPipe } from './parse-optional-float.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseOptionalFloatPipe', () => {
  it('should return undefined for undefined input', () => {
    const pipe = new ParseOptionalFloatPipe();
    expect(pipe.transform(undefined, { type: 'query', data: 'test' })).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const pipe = new ParseOptionalFloatPipe();
    expect(pipe.transform('', { type: 'query', data: 'test' })).toBeUndefined();
  });

  it('should return default value for undefined input', () => {
    const pipe = new ParseOptionalFloatPipe({ defaultValue: 5.5 });
    expect(pipe.transform(undefined, { type: 'query', data: 'test' })).toBe(5.5);
  });

  it('should parse valid float string', () => {
    const pipe = new ParseOptionalFloatPipe();
    expect(pipe.transform('12.5', { type: 'query', data: 'test' })).toBe(12.5);
  });

  it('should parse valid float number', () => {
    const pipe = new ParseOptionalFloatPipe();
    expect(pipe.transform(12.5, { type: 'query', data: 'test' })).toBe(12.5);
  });

  it('should throw for invalid string', () => {
    const pipe = new ParseOptionalFloatPipe();
    expect(() => pipe.transform('abc', { type: 'query', data: 'test' }))
      .toThrow(BadRequestException);
  });

  it('should throw for value below min', () => {
    const pipe = new ParseOptionalFloatPipe({ min: 0 });
    expect(() => pipe.transform('-5', { type: 'query', data: 'test' }))
      .toThrow(new BadRequestException('test 不能小于 0'));
  });

  it('should throw for value above max', () => {
    const pipe = new ParseOptionalFloatPipe({ max: 100 });
    expect(() => pipe.transform('150', { type: 'query', data: 'test' }))
      .toThrow(new BadRequestException('test 不能大于 100'));
  });

  it('should throw for precision exceeded', () => {
    const pipe = new ParseOptionalFloatPipe({ precision: 2 });
    expect(() => pipe.transform('12.567', { type: 'query', data: 'test' }))
      .toThrow(new BadRequestException('test 最多保留 2 位小数'));
  });

  it('should accept value within precision', () => {
    const pipe = new ParseOptionalFloatPipe({ precision: 2 });
    expect(pipe.transform('12.56', { type: 'query', data: 'test' })).toBe(12.56);
  });
});
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **为常用参数设置合理的默认值**
   ```typescript
   // 好的做法
   @Query('limit', new ParseOptionalFloatPipe({ defaultValue: 20, min: 1, max: 100 }))
   ```

2. **为科学测量数据设置精度限制**
   ```typescript
   // 好的做法 - pH 值通常保留 2 位小数
   @Query('ph', new ParseOptionalFloatPipe({ min: 7.5, max: 8.5, precision: 2 }))
   ```

3. **组合使用多个验证选项**
   ```typescript
   // 好的做法 - 完整的验证配置
   @Query('temperature', new ParseOptionalFloatPipe({
     defaultValue: 20.0,
     min: -2,
     max: 30,
     precision: 1
   }))
   ```

4. **为范围参数使用一致的命名**
   ```typescript
   // 好的做法 - 清晰的命名约定
   @Query('minLength', new ParseOptionalFloatPipe({ min: 0 }))
   @Query('maxLength', new ParseOptionalFloatPipe({ min: 0 }))
   ```

### ❌ 避免的做法

1. **不要为必填参数使用可选管道**
   ```typescript
   // 不好的做法 - 应该用 ParseFloatPipe
   @Query('id', new ParseOptionalFloatPipe())  // ❌
   ```

2. **不要设置不合理的精度限制**
   ```typescript
   // 不好的做法 - 经纬度需要 6 位小数
   @Query('lat', new ParseOptionalFloatPipe({ precision: 2 }))  // ❌ 精度不足
   ```

3. **不要忘记处理 undefined 情况**
   ```typescript
   // 不好的做法 - 没有设置默认值但直接使用
   @Query('weight', new ParseOptionalFloatPipe())
   weight?: number;
   
   // 使用时需要检查
   if (weight !== undefined) {  // ✅
     // ...
   }
   ```

---

## 🔗 相关文档

- [ParseFloatPipe](./parse-float-pipe.md) - 必填浮点数解析管道
- [ParseOptionalIntPipe](./parse-optional-int-pipe.md) - 可选整数解析管道
- [ParseOptionalStringPipe](./parse-optional-string-pipe.md) - 可选字符串解析管道
- [ParseOptionalBooleanPipe](./parse-optional-boolean-pipe.md) - 可选布尔值解析管道
- [API 设计文档](./api-design.md) - 整体 API 设计规范
- [数据字典](./data-dictionary.md) - 数据类型和格式规范

---

<div align="center">
  <sub>生物鲸创管理系统 - 通用管道文档</sub>
</div>
