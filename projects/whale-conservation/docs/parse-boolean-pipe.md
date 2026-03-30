# ParseBooleanPipe 使用指南

> 布尔值解析管道 - 用于开关参数、状态筛选、功能启用等场景

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

`ParseBooleanPipe` 是用于将字符串/数字/布尔值转换为标准 boolean 类型的管道，适用于各种开关参数、状态筛选、功能启用/禁用等场景。

### 核心功能

- ✅ 支持多种真值格式：'true', '1', 'yes', 'on' (不区分大小写)
- ✅ 支持多种假值格式：'false', '0', 'no', 'off' (不区分大小写)
- ✅ 支持必填/可选配置
- ✅ 支持默认值设置
- ✅ 友好的中文错误提示
- ✅ 自动处理字符串大小写和空格

---

## 🚀 快速开始

### 基础用法 - 必填布尔参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseBooleanPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('isActive', new ParseBooleanPipe()) isActive: boolean
  ) {
    // isActive 已验证为有效的布尔值
    return this.whalesService.findAll({ isActive });
  }
}
```

**请求示例:**
```
GET /whales?isActive=true
GET /whales?isActive=1
GET /whales?isActive=yes
GET /whales?isActive=on
```

### 可选布尔参数

```typescript
@Get('sightings')
findSightings(
  @Query('verified', new ParseBooleanPipe({ required: false })) verified?: boolean
) {
  // 如果未提供 verified 参数，值为 undefined
  return this.sightingsService.find({ verified });
}
```

### 带默认值的布尔参数

```typescript
@Get('whales')
findAll(
  @Query('includeInactive', new ParseBooleanPipe({ required: false, defaultValue: false })) 
  includeInactive: boolean
) {
  // 如果未提供 includeInactive 参数，默认值为 false
  return this.whalesService.findAll({ includeInactive });
}
```

---

## 📋 实际应用场景

### 场景 1: 状态筛选

```typescript
import { ParseBooleanPipe, ParseStringPipe } from '@/common/pipes';

@Controller('stations')
export class StationsController {
  @Get()
  findAll(
    @Query('isActive', new ParseBooleanPipe()) isActive: boolean,
    @Query('name', new ParseStringPipe({ required: false })) name?: string
  ) {
    return this.stationsService.findAll({ isActive, name });
  }
}
```

**请求示例:**
```
GET /stations?isActive=true
GET /stations?isActive=false&name=东海观测站
```

### 场景 2: 功能开关

```typescript
@Controller('settings')
export class SettingsController {
  @Patch('notifications')
  updateNotifications(
    @Body('emailEnabled', new ParseBooleanPipe()) emailEnabled: boolean,
    @Body('smsEnabled', new ParseBooleanPipe()) smsEnabled: boolean,
    @Body('pushEnabled', new ParseBooleanPipe({ required: false, defaultValue: true })) 
    pushEnabled: boolean
  ) {
    return this.settingsService.updateNotifications({
      emailEnabled,
      smsEnabled,
      pushEnabled
    });
  }
}
```

**请求示例:**
```json
PATCH /settings/notifications
{
  "emailEnabled": true,
  "smsEnabled": false
}
```

**结果:** `pushEnabled` 将使用默认值 `true`

### 场景 3: 数据导出选项

```typescript
@Get('export')
exportData(
  @Query('includeArchived', new ParseBooleanPipe({ required: false, defaultValue: false }))
  includeArchived: boolean,
  @Query('detailed', new ParseBooleanPipe({ required: false, defaultValue: true }))
  detailed: boolean
) {
  return this.exportService.export({ includeArchived, detailed });
}
```

**请求示例:**
```
GET /export?includeArchived=yes&detailed=1
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
| 数字 | 1 | (JSON 请求体) |
| 布尔值 | true | (JSON 请求体) |

### 假值 (返回 `false`)

| 输入类型 | 值 | 示例 |
|---------|-----|------|
| 字符串 | 'false', 'FALSE', 'False' | `?active=false` |
| 字符串 | '0' | `?active=0` |
| 字符串 | 'no', 'NO', 'No' | `?active=no` |
| 字符串 | 'off', 'OFF', 'Off' | `?active=off` |
| 数字 | 0 | (JSON 请求体) |
| 布尔值 | false | (JSON 请求体) |

---

## ⚠️ 错误处理

### 错误 1: 必填参数未提供

```typescript
@Query('isActive', new ParseBooleanPipe()) isActive: boolean
```

**请求:** `GET /whales` (缺少 isActive 参数)

**响应:**
```json
{
  "statusCode": 400,
  "message": "isActive 是必填项，请提供有效的布尔值 (true/false)",
  "error": "Bad Request"
}
```

### 错误 2: 无效的布尔值

```typescript
@Query('verified', new ParseBooleanPipe()) verified: boolean
```

**请求:** `GET /sightings?verified=maybe`

**响应:**
```json
{
  "statusCode": 400,
  "message": "verified 必须是有效的布尔值 (true/false/1/0/yes/no/on/off)",
  "error": "Bad Request"
}
```

### 错误 3: 无效的数字值

```typescript
@Body('enabled', new ParseBooleanPipe()) enabled: boolean
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
  "message": "enabled 必须是有效的布尔值 (0 或 1)",
  "error": "Bad Request"
}
```

---

## 🔧 配置选项

```typescript
interface ParseBooleanOptions {
  /**
   * 是否必填
   * @default true
   */
  required?: boolean;

  /**
   * 默认值 (仅在 required=false 且值为空时使用)
   * @default false
   */
  defaultValue?: boolean;
}
```

### 配置示例

```typescript
// 必填，无默认值
new ParseBooleanPipe()

// 可选，undefined 当未提供
new ParseBooleanPipe({ required: false })

// 可选，带默认值 false
new ParseBooleanPipe({ required: false, defaultValue: false })

// 可选，带默认值 true
new ParseBooleanPipe({ required: false, defaultValue: true })
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **URL 查询参数使用字符串格式**
   ```typescript
   // 好：URL 友好的字符串值
   GET /whales?isActive=true
   ```

2. **JSON 请求体使用布尔值**
   ```typescript
   // 好：JSON 原生的布尔值
   { "isActive": true }
   ```

3. **为可选参数设置合理的默认值**
   ```typescript
   // 好：明确默认行为
   @Query('includeArchived', new ParseBooleanPipe({ 
     required: false, 
     defaultValue: false 
   }))
   ```

### ❌ 避免做法

1. **不要依赖隐式转换**
   ```typescript
   // 避免：字符串 "true " 带空格可能出错
   // 管道会自动 trim，但最好保持输入整洁
   ```

2. **不要使用模糊的值**
   ```typescript
   // 避免：可能引起歧义
   ?enabled=maybe
   ?enabled=unknown
   ```

---

## 🧪 测试示例

```typescript
import { Test } from '@nestjs/testing';
import { ParseBooleanPipe } from '@/common/pipes';

describe('ParseBooleanPipe', () => {
  let pipe: ParseBooleanPipe;

  beforeEach(() => {
    pipe = new ParseBooleanPipe();
  });

  it('应该将字符串 "true" 转换为 true', () => {
    expect(pipe.transform('true', { type: 'query' })).toBe(true);
  });

  it('应该将字符串 "FALSE" 转换为 false', () => {
    expect(pipe.transform('FALSE', { type: 'query' })).toBe(false);
  });

  it('应该将数字 1 转换为 true', () => {
    expect(pipe.transform(1, { type: 'body' })).toBe(true);
  });

  it('应该将数字 0 转换为 false', () => {
    expect(pipe.transform(0, { type: 'body' })).toBe(false);
  });

  it('应该保持布尔值不变', () => {
    expect(pipe.transform(true, { type: 'body' })).toBe(true);
    expect(pipe.transform(false, { type: 'body' })).toBe(false);
  });

  it('可选参数未提供时返回默认值', () => {
    const optionalPipe = new ParseBooleanPipe({ required: false, defaultValue: true });
    expect(optionalPipe.transform(undefined, { type: 'query' })).toBe(true);
  });
});
```

---

## 📚 相关文档

- [ParseStringPipe](./parse-string-pipe.md) - 字符串验证管道
- [ParseIntPipe](./parse-int-pipe.md) - 整数验证管道
- [ParseEnumPipe](./parse-enum-pipe.md) - 枚举值验证管道
- [公共管道快速入门](./common-quickstart.md) - 所有公共管道概览

---

**最后更新**: 2026-03-30  
**维护者**: 鲸创项目团队
