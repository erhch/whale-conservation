# ParseFloatPipe - 浮点数解析管道

## 概述

`ParseFloatPipe` 是一个用于处理**必填浮点数参数**的验证管道，适用于需要接收小数类型数据的 API 接口。

### 核心功能

- ✅ **必填验证** - 不允许 `undefined`/`null`/空字符串
- ✅ **类型转换** - 自动将字符串转换为浮点数
- ✅ **范围验证** - 支持 `min`/`max` 边界检查
- ✅ **精度控制** - 支持小数位数限制 (`precision`)
- ✅ **中文错误提示** - 友好的错误消息

---

## 快速开始

### 基础用法

```typescript
import { ParseFloatPipe } from '@/common/pipes';

// 必填浮点数参数
@Query('latitude', new ParseFloatPipe()) latitude: number;

// 带范围验证
@Query('depth', new ParseFloatPipe({ min: 0, max: 11000 })) depth: number;

// 带精度限制（最多 2 位小数）
@Query('weight', new ParseFloatPipe({ precision: 2 })) weight: number;
```

### 可选浮点数参数

对于可选的浮点数参数，使用 `ParseOptionalFloatPipe`：

```typescript
import { ParseOptionalFloatPipe } from '@/common/pipes';

@Query('minDepth', new ParseOptionalFloatPipe()) minDepth?: number;
```

---

## 使用场景

### 1. 地理坐标（经纬度）

```typescript
@Get('nearby')
findNearby(
  @Query('latitude', new ParseFloatPipe({ min: -90, max: 90, precision: 6 }))
  latitude: number,
  
  @Query('longitude', new ParseFloatPipe({ min: -180, max: 180, precision: 6 }))
  longitude: number,
  
  @Query('radius', new ParseFloatPipe({ min: 0.1, max: 100, precision: 2 }))
  radius: number,
) {
  return this.sightingsService.findNearby({ latitude, longitude, radius });
}
```

**请求示例:**
```
GET /api/v1/sightings/nearby?latitude=31.230412&longitude=121.473701&radius=5.5
```

---

### 2. 深度/高度范围筛选

```typescript
@Get('by-depth')
findByDepth(
  @Query('minDepth', new ParseFloatPipe({ min: 0, max: 11000, precision: 1 }))
  minDepth: number,
  
  @Query('maxDepth', new ParseFloatPipe({ min: 0, max: 11000, precision: 1 }))
  maxDepth: number,
) {
  return this.sightingsService.findByDepthRange(minDepth, maxDepth);
}
```

**请求示例:**
```
GET /api/v1/sightings/by-depth?minDepth=100&maxDepth=500
```

---

### 3. 测量数据（体重/体长）

```typescript
@Post('measurements')
recordMeasurement(
  @Body('weight', new ParseFloatPipe({ min: 0.1, max: 200000, precision: 2 }))
  weight: number,
  
  @Body('length', new ParseFloatPipe({ min: 0.1, max: 35, precision: 2 }))
  length: number,
  
  @Body('temperature', new ParseFloatPipe({ min: -2, max: 30, precision: 1 }))
  temperature: number,
) {
  return this.measurementsService.create({ weight, length, temperature });
}
```

**请求示例:**
```json
POST /api/v1/measurements
{
  "weight": 45000.50,
  "length": 15.8,
  "temperature": 18.5
}
```

---

### 4. 环境参数（水温/盐度/pH 值）

```typescript
@Get('environment')
getEnvironmentData(
  @Query('minTemp', new ParseFloatPipe({ min: -2, max: 30, precision: 1 }))
  minTemp: number,
  
  @Query('maxTemp', new ParseFloatPipe({ min: -2, max: 30, precision: 1 }))
  maxTemp: number,
  
  @Query('minSalinity', new ParseFloatPipe({ min: 0, max: 40, precision: 2 }))
  minSalinity: number,
  
  @Query('minPh', new ParseFloatPipe({ min: 6, max: 9, precision: 2 }))
  minPh: number,
) {
  return this.environmentService.query({ minTemp, maxTemp, minSalinity, minPh });
}
```

**请求示例:**
```
GET /api/v1/environment?minTemp=15&maxTemp=25&minSalinity=30&minPh=7.5
```

---

### 5. 距离/半径筛选

```typescript
@Get('within-distance')
findWithinDistance(
  @Query('distance', new ParseFloatPipe({ min: 0.01, max: 1000, precision: 2 }))
  distance: number,
  
  @Query('lat', new ParseFloatPipe({ min: -90, max: 90 }))
  lat: number,
  
  @Query('lng', new ParseFloatPipe({ min: -180, max: 180 }))
  lng: number,
) {
  return this.stationsService.findWithinDistance(distance, lat, lng);
}
```

**请求示例:**
```
GET /api/v1/stations/within-distance?distance=10.5&lat=31.23&lng=121.47
```

---

### 6. 百分比/比率数据

```typescript
@Get('statistics')
getStatistics(
  @Query('confidenceThreshold', new ParseFloatPipe({ min: 0, max: 1, precision: 2 }))
  confidenceThreshold: number,
  
  @Query('minAccuracy', new ParseFloatPipe({ min: 0, max: 100, precision: 1 }))
  minAccuracy: number,
) {
  return this.analyticsService.getStats({ confidenceThreshold, minAccuracy });
}
```

**请求示例:**
```
GET /api/v1/statistics?confidenceThreshold=0.85&minAccuracy=95
```

---

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min` | `number` | `undefined` | 最小值（包含边界） |
| `max` | `number` | `undefined` | 最大值（包含边界） |
| `precision` | `number` | `undefined` | 最多保留的小数位数 |

---

## 验证规则

### 1. 必填验证

以下情况会抛出异常：
- 参数为 `undefined`
- 参数为 `null`
- 参数为空字符串 `''`

### 2. 类型转换

- 字符串 `'123.45'` → 数字 `123.45`
- 字符串 `'-0.5'` → 数字 `-0.5`
- 字符串 `'1e5'` → 数字 `100000`（科学计数法）
- 数字 `123.45` → 数字 `123.45`（保持不变）

### 3. 范围验证

- `min` 验证：值必须 `>= min`
- `max` 验证：值必须 `<= max`
- 可以同时设置 `min` 和 `max`

### 4. 精度验证

- 检查小数点后的位数是否超过 `precision`
- 整数（无小数点）始终通过精度验证

---

## 错误响应

### 必填参数未提供

```json
{
  "statusCode": 400,
  "message": "latitude 是必填项，请提供有效的数字",
  "error": "Bad Request"
}
```

### 无效的浮点数

```json
{
  "statusCode": 400,
  "message": "depth 必须是有效的数字",
  "error": "Bad Request"
}
```

### 超出最小值

```json
{
  "statusCode": 400,
  "message": "depth 不能小于 0",
  "error": "Bad Request"
}
```

### 超出最大值

```json
{
  "statusCode": 400,
  "message": "latitude 不能大于 90",
  "error": "Bad Request"
}
```

### 精度超限

```json
{
  "statusCode": 400,
  "message": "weight 最多保留 2 位小数",
  "error": "Bad Request"
}
```

---

## 边界情况处理

| 输入值 | 配置 | 结果 |
|--------|------|------|
| `undefined` | 任意 | ❌ 抛出异常（必填） |
| `null` | 任意 | ❌ 抛出异常（必填） |
| `''` | 任意 | ❌ 抛出异常（必填） |
| `'123'` | 任意 | ✅ `123` |
| `'123.45'` | 任意 | ✅ `123.45` |
| `'1e5'` | 任意 | ✅ `100000` |
| `'-0.5'` | 任意 | ✅ `-0.5` |
| `'abc'` | 任意 | ❌ 抛出异常（无效数字） |
| `123` | 任意 | ✅ `123` |
| `123.456` | `precision: 2` | ❌ 抛出异常（精度超限） |
| `-1` | `min: 0` | ❌ 抛出异常（小于最小值） |
| `101` | `max: 100` | ❌ 抛出异常（大于最大值） |

---

## 最佳实践

### ✅ 推荐做法

**1. 为地理坐标设置合理的范围**

```typescript
// 纬度：-90 到 90
@Query('lat', new ParseFloatPipe({ min: -90, max: 90 }))

// 经度：-180 到 180
@Query('lng', new ParseFloatPipe({ min: -180, max: 180 }))
```

**2. 为测量数据设置精度限制**

```typescript
// 体重：最多 2 位小数（千克）
@Body('weight', new ParseFloatPipe({ min: 0, precision: 2 }))

// 体长：最多 2 位小数（米）
@Body('length', new ParseFloatPipe({ min: 0, precision: 2 }))
```

**3. 为百分比数据设置 0-1 或 0-100 范围**

```typescript
// 0-1 范围（比率）
@Query('ratio', new ParseFloatPipe({ min: 0, max: 1, precision: 4 }))

// 0-100 范围（百分比）
@Query('percentage', new ParseFloatPipe({ min: 0, max: 100, precision: 2 }))
```

**4. 组合使用多个验证**

```typescript
@Query('depth', new ParseFloatPipe({ 
  min: 0, 
  max: 11000, 
  precision: 1 
}))
depth: number;
```

---

### ❌ 避免的做法

**1. 不要对可选参数使用 ParseFloatPipe**

```typescript
// ❌ 错误：可选参数不应该用必填管道
@Query('optionalValue', new ParseFloatPipe()) optionalValue?: number;

// ✅ 正确：使用 ParseOptionalFloatPipe
@Query('optionalValue', new ParseOptionalFloatPipe()) optionalValue?: number;
```

**2. 不要设置不合理的精度限制**

```typescript
// ❌ 错误：精度限制过严，科学计算可能需要更多小数位
@Query('coordinate', new ParseFloatPipe({ precision: 2 }))

// ✅ 正确：地理坐标通常需要 6 位小数（约 0.1 米精度）
@Query('coordinate', new ParseFloatPipe({ precision: 6 }))
```

**3. 不要忘记边界值验证**

```typescript
// ❌ 错误：没有范围验证，可能接收无效数据
@Query('temperature', new ParseFloatPipe()) temperature: number;

// ✅ 正确：设置合理的水温范围
@Query('temperature', new ParseFloatPipe({ min: -2, max: 30 })) temperature: number;
```

---

## 完整测试示例

```typescript
import { ParseFloatPipe } from './parse-float.pipe';

describe('ParseFloatPipe', () => {
  let pipe: ParseFloatPipe;

  beforeEach(() => {
    pipe = new ParseFloatPipe();
  });

  it('应该将字符串 "123.45" 转换为数字 123.45', () => {
    expect(pipe.transform('123.45', { type: 'query' })).toBe(123.45);
  });

  it('应该将字符串 "-0.5" 转换为数字 -0.5', () => {
    expect(pipe.transform('-0.5', { type: 'query' })).toBe(-0.5);
  });

  it('应该将科学计数法 "1e5" 转换为数字 100000', () => {
    expect(pipe.transform('1e5', { type: 'query' })).toBe(100000);
  });

  it('应该保持数字不变', () => {
    expect(pipe.transform(123.45, { type: 'body' })).toBe(123.45);
  });

  it('undefined 应该抛出异常', () => {
    expect(() => pipe.transform(undefined, { type: 'query', data: 'value' }))
      .toThrow('value 是必填项，请提供有效的数字');
  });

  it('null 应该抛出异常', () => {
    expect(() => pipe.transform(null, { type: 'body', data: 'value' }))
      .toThrow('value 是必填项，请提供有效的数字');
  });

  it('空字符串应该抛出异常', () => {
    expect(() => pipe.transform('', { type: 'query', data: 'value' }))
      .toThrow('value 是必填项，请提供有效的数字');
  });

  it('无效字符串应该抛出异常', () => {
    expect(() => pipe.transform('abc', { type: 'query', data: 'value' }))
      .toThrow('value 必须是有效的数字');
  });

  it('小于 min 应该抛出异常', () => {
    const pipeWithMin = new ParseFloatPipe({ min: 0 });
    expect(() => pipeWithMin.transform(-1, { type: 'query', data: 'value' }))
      .toThrow('value 不能小于 0');
  });

  it('大于 max 应该抛出异常', () => {
    const pipeWithMax = new ParseFloatPipe({ max: 100 });
    expect(() => pipeWithMax.transform(101, { type: 'query', data: 'value' }))
      .toThrow('value 不能大于 100');
  });

  it('精度超限应该抛出异常', () => {
    const pipeWithPrecision = new ParseFloatPipe({ precision: 2 });
    expect(() => pipeWithPrecision.transform(123.456, { type: 'body', data: 'value' }))
      .toThrow('value 最多保留 2 位小数');
  });

  it('边界值应该通过验证', () => {
    const pipeWithRange = new ParseFloatPipe({ min: 0, max: 100 });
    expect(pipeWithRange.transform(0, { type: 'query' })).toBe(0);
    expect(pipeWithRange.transform(100, { type: 'query' })).toBe(100);
  });
});
```

---

## 相关管道

| 管道 | 用途 | 区别 |
|------|------|------|
| `ParseIntPipe` | 整数解析 | 只接受整数，不支持小数 |
| `ParseOptionalFloatPipe` | 可选浮点数 | 允许 `undefined`，可设置默认值 |
| `ParseOptionalIntPipe` | 可选整数 | 允许 `undefined`，可设置默认值 |
| `ParseCoordinatePipe` | 坐标解析 | 专门用于经纬度坐标对 |
| `ParseStringPipe` | 字符串解析 | 保持字符串格式，不转换 |

---

## 快速参考

```typescript
// 基础用法
@Query('value', new ParseFloatPipe()) value: number;

// 范围验证
@Query('value', new ParseFloatPipe({ min: 0, max: 100 })) value: number;

// 精度控制
@Query('value', new ParseFloatPipe({ precision: 2 })) value: number;

// 组合使用
@Query('latitude', new ParseFloatPipe({ 
  min: -90, 
  max: 90, 
  precision: 6 
})) latitude: number;
```

---

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-03-30 | 初始版本：支持必填浮点数解析、范围验证、精度控制 |

---

*文档最后更新：2026-03-31 01:21 (Asia/Shanghai)*
