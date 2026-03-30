# ParseCoordinatePipe 使用指南

> GPS 坐标参数验证管道 - 用于鲸鱼位置追踪和栖息地监测

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

`ParseCoordinatePipe` 是专门用于验证地理位置坐标（纬度/经度）的管道，适用于鲸鱼观测记录、栖息地监测、追踪数据等场景。

### 核心功能

- ✅ 纬度验证（范围：-90° 到 90°）
- ✅ 经度验证（范围：-180° 到 180°）
- ✅ 支持可选参数
- ✅ 坐标对联合验证
- ✅ 友好的中文错误提示

---

## 🚀 快速开始

### 基础用法 - 验证纬度

```typescript
import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { ParseCoordinatePipe } from '@/common/pipes';

@Controller('sightings')
export class SightingsController {
  @Get('by-latitude')
  findByLatitude(
    @Query('lat', new ParseCoordinatePipe({ type: 'latitude' })) latitude: number
  ) {
    // latitude 已验证为有效纬度值 (-90 到 90)
    return this.sightingsService.findByLatitude(latitude);
  }
}
```

### 基础用法 - 验证经度

```typescript
@Get('by-longitude')
findByLongitude(
  @Query('lng', new ParseCoordinatePipe({ type: 'longitude' })) longitude: number
) {
  // longitude 已验证为有效经度值 (-180 到 180)
  return this.sightingsService.findByLongitude(longitude);
}
```

### 可选坐标参数

```typescript
@Get('search')
searchSightings(
  @Query('lat', new ParseCoordinatePipe({ type: 'latitude', allowOptional: true })) latitude?: number,
  @Query('lng', new ParseCoordinatePipe({ type: 'longitude', allowOptional: true })) longitude?: number
) {
  // 如果未提供参数，latitude/longitude 为 undefined
  if (latitude && longitude) {
    return this.sightingsService.findByCoordinates(latitude, longitude);
  }
  return this.sightingsService.findAll();
}
```

---

## 📐 坐标对验证

使用 `ParseCoordinatePairPipe` 同时验证纬度和经度：

```typescript
import { ParseCoordinatePairPipe, type CoordinatePair } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get('location')
  getByLocation(
    @Query(new ParseCoordinatePairPipe()) coords: CoordinatePair
  ) {
    // coords = { latitude: number, longitude: number }
    return this.whalesService.findByLocation(coords.latitude, coords.longitude);
  }
}
```

### 可选坐标对

```typescript
@Get('nearby')
findNearby(
  @Query(new ParseCoordinatePairPipe({ allowOptional: true })) coords?: CoordinatePair
) {
  if (!coords) {
    return this.whalesService.findAll();
  }
  return this.whalesService.findNearby(coords.latitude, coords.longitude, 50); // 50km 范围
}
```

---

## 🐋 实际应用场景

### 场景 1: 鲸鱼观测记录查询

```typescript
@Get('sightings/near')
@UseGuards(JwtAuthGuard)
findNearbySightings(
  @Query('lat', new ParseCoordinatePipe({ type: 'latitude' })) lat: number,
  @Query('lng', new ParseCoordinatePipe({ type: 'longitude' })) lng: number,
  @Query('radius', new ParseFloatPipe({ min: 1, max: 500 })) radius: number
) {
  // 查询指定坐标点附近 radius 公里内的鲸鱼观测记录
  return this.sightingsService.findNearby({ lat, lng }, radius);
}
```

**请求示例:**
```
GET /sightings/near?lat=31.2304&lng=121.4737&radius=50
```

**有效响应:**
```json
{
  "data": [...],
  "count": 12
}
```

**错误响应 (无效纬度):**
```json
{
  "statusCode": 400,
  "message": "lat 必须在 -90 到 90 之间",
  "error": "Bad Request"
}
```

---

### 场景 2: 栖息地边界定义

```typescript
@Post('habitat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESEARCHER, UserRole.ADMIN)
createHabitat(
  @Body('northLat', new ParseCoordinatePipe({ type: 'latitude' })) northLat: number,
  @Body('southLat', new ParseCoordinatePipe({ type: 'latitude' })) southLat: number,
  @Body('eastLng', new ParseCoordinatePipe({ type: 'longitude' })) eastLng: number,
  @Body('westLng', new ParseCoordinatePipe({ type: 'longitude' })) westLng: number,
  @Body('name') name: string
) {
  return this.habitatService.create({
    name,
    bounds: { northLat, southLat, eastLng, westLng }
  });
}
```

**请求示例:**
```json
POST /habitat
{
  "name": "长江口中华鲟保护区",
  "northLat": 31.5,
  "southLat": 31.0,
  "eastLng": 122.0,
  "westLng": 121.5
}
```

---

### 场景 3: 鲸鱼迁徙轨迹记录

```typescript
@Post('whales/:id/trajectory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESEARCHER)
recordTrajectory(
  @Param('id') whaleId: string,
  @Body('positions', new ParseArrayPipe({
    items: Object,
    validateEach: true,
    optionalEach: {
      latitude: new ParseCoordinatePipe({ type: 'latitude' }),
      longitude: new ParseCoordinatePipe({ type: 'longitude' }),
      timestamp: new ParseIso8601Pipe()
    }
  })) positions: Array<{ latitude: number; longitude: number; timestamp: string }>
) {
  return this.whalesService.addTrajectory(whaleId, positions);
}
```

**请求示例:**
```json
POST /whales/whale-001/trajectory
{
  "positions": [
    { "latitude": 31.2304, "longitude": 121.4737, "timestamp": "2026-03-30T08:00:00Z" },
    { "latitude": 31.2500, "longitude": 121.5000, "timestamp": "2026-03-30T09:00:00Z" },
    { "latitude": 31.2800, "longitude": 121.5500, "timestamp": "2026-03-30T10:00:00Z" }
  ]
}
```

---

## ⚠️ 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `lat 是必填项，请提供有效的坐标值` | 未提供参数或参数为空 | 确保请求包含有效的纬度参数 |
| `lat 必须是有效的数字` | 参数不是数字格式 | 检查参数值是否为数字字符串 |
| `lat 必须在 -90 到 90 之间` | 纬度超出有效范围 | 纬度值必须在 -90° 到 90° 之间 |
| `lng 必须在 -180 到 180 之间` | 经度超出有效范围 | 经度值必须在 -180° 到 180° 之间 |
| `坐标数据不能为空` | ParseCoordinatePairPipe 收到空对象 | 确保同时提供 latitude 和 longitude |

---

## 🔧 配置选项

### ParseCoordinatePipe 选项

```typescript
interface ParseCoordinateOptions {
  type: 'latitude' | 'longitude';  // 必填：坐标类型
  allowOptional?: boolean;          // 可选：是否允许为空，默认 false
}
```

### ParseCoordinatePairPipe 选项

```typescript
interface ParseCoordinatePairOptions {
  allowOptional?: boolean;  // 可选：是否允许坐标对为空，默认 false
}
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **始终指定坐标类型** - 明确声明是纬度还是经度
2. **使用坐标对简化代码** - 当需要同时验证经纬度时使用 `ParseCoordinatePairPipe`
3. **合理设置可选参数** - 对于搜索类接口，考虑设置 `allowOptional: true`
4. **配合范围参数使用** - 坐标查询通常配合半径/范围参数

### ❌ 避免的做法

1. **不要混用坐标类型** - 不要用 latitude 的 pipe 验证经度
2. **不要忽略边界值** - 记住极地 (-90/90) 和国际日期变更线 (-180/180) 是有效值
3. **不要在不需要时强制必填** - 搜索接口的坐标参数通常应该是可选的

---

## 🧪 测试示例

```typescript
import { ParseCoordinatePipe } from '@/common/pipes';
import { BadRequestException } from '@nestjs/common';

describe('ParseCoordinatePipe', () => {
  const latPipe = new ParseCoordinatePipe({ type: 'latitude' });
  const lngPipe = new ParseCoordinatePipe({ type: 'longitude' });

  it('should validate valid latitude', () => {
    expect(latPipe.transform('31.2304', { type: 'query' })).toBe(31.2304);
    expect(latPipe.transform('-90', { type: 'query' })).toBe(-90);
    expect(latPipe.transform('90', { type: 'query' })).toBe(90);
  });

  it('should validate valid longitude', () => {
    expect(lngPipe.transform('121.4737', { type: 'query' })).toBe(121.4737);
    expect(lngPipe.transform('-180', { type: 'query' })).toBe(-180);
    expect(lngPipe.transform('180', { type: 'query' })).toBe(180);
  });

  it('should reject invalid latitude', () => {
    expect(() => latPipe.transform('91', { type: 'query' }))
      .toThrow(BadRequestException);
    expect(() => latPipe.transform('-91', { type: 'query' }))
      .toThrow(BadRequestException);
  });

  it('should reject invalid longitude', () => {
    expect(() => lngPipe.transform('181', { type: 'query' }))
      .toThrow(BadRequestException);
    expect(() => lngPipe.transform('-181', { type: 'query' }))
      .toThrow(BadRequestException);
  });
});
```

---

## 📚 相关文档

- [API Design](./api-design.md) - API 设计规范
- [API Examples](./api-examples.md) - API 使用示例
- [Database Design](./database-design.md) - 数据库设计（包含坐标字段定义）
- [Common Quickstart](./common-quickstart.md) - 公共模块快速入门

---

**🐋 保护鲸鱼，从精确的坐标开始！**
