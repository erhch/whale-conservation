# ParseJSONPipe - JSON 字符串解析验证管道

> 将 JSON 字符串安全地解析为 JavaScript 对象，并提供可选的验证功能。

**文件位置:** `src/common/pipes/parse-json.pipe.ts`  
**版本:** 1.0.0  
**最后更新:** 2026-03-31

---

## 📋 概述

`ParseJSONPipe` 用于将 JSON 字符串解析为 JavaScript 对象，并在解析失败时抛出 `BadRequestException`。适用于以下场景：

- 查询参数中传递复杂的过滤条件
- 表单数据中接收 JSON 字符串
- API 参数需要结构化数据但只能接收字符串

---

## 🚀 快速开始

### 基本用法

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseJSONPipe } from '@/common/pipes';

@Controller('search')
export class SearchController {
  @Get('advanced')
  search(
    @Query('filters', new ParseJSONPipe()) filters: any,
  ) {
    // filters 已经是解析后的对象
    return this.searchService.find(filters);
  }
}
```

**请求示例:**

```bash
GET /search/advanced?filters={"species":"humpback","minLength":10}
```

---

## ⚙️ 配置选项

### ParseJSONPipeOptions

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `optional` | `boolean` | `false` | 是否允许空值。如果为 `true` 且值为空，则返回 `null` 而不抛出异常 |
| `errorMessage` | `string` | `'验证失败：无效的 JSON 格式'` | 自定义错误消息 |
| `validate` | `function` | `undefined` | 解析后的类型验证函数，返回 `boolean` 或错误消息 `string` |

---

## 📖 使用示例

### 1. 可选的 JSON 参数

```typescript
@Get('list')
findAll(
  @Query('sort', new ParseJSONPipe({ optional: true })) sort?: { field: string; order: 'ASC' | 'DESC' },
) {
  // sort 可以是 null 或解析后的对象
  const defaultSort = { field: 'createdAt', order: 'DESC' as const };
  return this.service.find({ sort: sort ?? defaultSort });
}
```

### 2. 自定义错误消息

```typescript
@Post('config')
updateConfig(
  @Body('settings', new ParseJSONPipe({ 
    errorMessage: '配置格式错误：请提供有效的 JSON 对象' 
  })) settings: any,
) {
  return this.configService.update(settings);
}
```

### 3. 带验证函数的用法

```typescript
@Get('whales')
findWhales(
  @Query('filter', new ParseJSONPipe({
    validate: (value) => {
      // 验证必须是对象且包含必要的字段
      if (typeof value !== 'object' || value === null) {
        return '过滤器必须是 JSON 对象';
      }
      if (value.species && typeof value.species !== 'string') {
        return 'species 字段必须是字符串';
      }
      if (value.minLength && typeof value.minLength !== 'number') {
        return 'minLength 字段必须是数字';
      }
      return true;
    }
  })) filter: any,
) {
  return this.whalesService.find(filter);
}
```

### 4. 复杂的过滤条件

```typescript
@Get('sightings')
findSightings(
  @Query('dateRange', new ParseJSONPipe({ optional: true })) dateRange?: { start: string; end: string },
  @Query('location', new ParseJSONPipe({ optional: true })) location?: { lat: number; lng: number; radius: number },
  @Query('species', new ParseArrayPipe({ optional: true })) species?: string[],
) {
  return this.sightingsService.find({ dateRange, location, species });
}
```

**请求示例:**

```bash
GET /sightings?dateRange={"start":"2026-01-01","end":"2026-03-31"}&location={"lat":31.2304,"lng":121.4737,"radius":50}&species=humpback,blue
```

---

## ❌ 错误响应

### 无效的 JSON 格式

**请求:**
```bash
GET /search/advanced?filters={invalid json}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "验证失败：无效的 JSON 格式",
  "error": "Bad Request"
}
```

### 必填参数缺失

**请求:**
```bash
GET /search/advanced
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "验证失败：无效的 JSON 格式",
  "error": "Bad Request"
}
```

### 可选参数缺失 (不会报错)

```typescript
@Query('filters', new ParseJSONPipe({ optional: true }))
```

**请求:**
```bash
GET /search/advanced
```

**响应:** 正常处理，参数值为 `null`

---

## 🔒 安全注意事项

### 1. 避免原型污染

解析后的对象应该谨慎使用，避免直接合并到现有对象：

```typescript
// ❌ 不安全
const config = { default: true };
Object.assign(config, userProvidedJson);

// ✅ 安全
const config = { default: true, ...userProvidedJson };
// 或者使用 deep merge 库并进行验证
```

### 2. 验证数据结构

始终使用 `validate` 选项或后续的 DTO 验证来确保数据结构符合预期：

```typescript
@Get('data')
getData(
  @Query('query', new ParseJSONPipe({
    validate: (value) => {
      if (!value || typeof value !== 'object') {
        return '查询必须是对象';
      }
      if (Array.isArray(value)) {
        return '查询不能是数组';
      }
      return true;
    }
  })) query: any,
) {
  // 现在可以安全地使用 query
}
```

---

## 🧪 单元测试示例

```typescript
import { ParseJSONPipe } from './parse-json.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ParseJSONPipe', () => {
  let pipe: ParseJSONPipe;

  beforeEach(() => {
    pipe = new ParseJSONPipe();
  });

  it('应该解析有效的 JSON 字符串', () => {
    const result = pipe.transform('{"name":"test"}', {} as any);
    expect(result).toEqual({ name: 'test' });
  });

  it('应该抛出异常对于无效的 JSON', () => {
    expect(() => pipe.transform('invalid', {} as any)).toThrow(BadRequestException);
  });

  it('应该允许空值当 optional 为 true', () => {
    const optionalPipe = new ParseJSONPipe({ optional: true });
    const result = optionalPipe.transform('', {} as any);
    expect(result).toBeNull();
  });

  it('应该使用自定义验证函数', () => {
    const validatePipe = new ParseJSONPipe({
      validate: (value) => value.id !== undefined
    });
    const result = validatePipe.transform('{"id":1}', {} as any);
    expect(result).toEqual({ id: 1 });
  });
});
```

---

## 📝 最佳实践

1. **始终验证结构** - 使用 `validate` 选项或 DTO 验证解析后的数据
2. **使用 optional 处理可选参数** - 避免不必要的 400 错误
3. **提供清晰的错误消息** - 帮助 API 使用者理解问题
4. **记录预期的 JSON 结构** - 在 API 文档中说明格式要求
5. **避免深度嵌套** - 复杂的 JSON 结构考虑使用专门的 DTO

---

## 🔗 相关文件

- 实现：`src/common/pipes/parse-json.pipe.ts`
- 导出：`src/common/pipes/index.ts`
- 其他管道：`docs/parse-*.md`

---

## 📅 更新日志

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-31 | 1.0.0 | 初始版本 |
