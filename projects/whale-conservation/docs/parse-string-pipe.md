# ParseStringPipe 使用指南

> 字符串解析管道 - 用于查询参数/请求体中的必需字符串字段验证

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseStringPipe` 是用于处理字符串类型参数的基础管道，适用于姓名、搜索关键词、描述文本等各种字符串字段的验证和处理。

### 核心功能

- ✅ 自动修剪首尾空格 (默认开启)
- ✅ 支持最小/最大长度验证
- ✅ 支持正则表达式格式验证
- ✅ 支持大小写转换 (toLowerCase/toUpperCase)
- ✅ 空值检测 (undefined/null/空字符串)
- ✅ 友好的中文错误提示

---

## 🚀 快速开始

### 基础用法 - 必填字符串参数

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseStringPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get('search')
  search(
    @Query('keyword', new ParseStringPipe()) keyword: string
  ) {
    // keyword 已验证为非空字符串
    return this.whalesService.search({ keyword });
  }
}
```

**请求示例:**
```
GET /whales/search?keyword=虎鲸
GET /whales/search?keyword=blue%20whale
```

### 带长度验证

```typescript
@Post('whales')
create(
  @Body('name', new ParseStringPipe({ minLength: 2, maxLength: 100 })) 
  name: string
) {
  // name 长度必须在 2-100 个字符之间
  return this.whalesService.create({ name });
}
```

### 带正则表达式验证

```typescript
@Post('researchers')
createResearcher(
  @Body('employeeId', new ParseStringPipe({ 
    pattern: /^RES-\d{6}$/,
    patternMessage: '员工编号格式必须为 RES-XXXXXX (6 位数字)'
  })) 
  employeeId: string
) {
  return this.researchersService.create({ employeeId });
}
```

### 带大小写转换

```typescript
@Post('tags')
createTag(
  @Body('name', new ParseStringPipe({ 
    trim: true, 
    toLowerCase: true 
  })) 
  name: string
) {
  // "Dolphin" → "dolphin", "  WHALE  " → "whale"
  return this.tagsService.create({ name });
}
```

---

## 📋 实际应用场景

### 场景 1: 搜索功能

```typescript
import { ParseStringPipe, ParseIntPipe } from '@/common/pipes';

@Controller('sightings')
export class SightingsController {
  @Get()
  findAll(
    @Query('location', new ParseStringPipe({ 
      minLength: 2, 
      maxLength: 50,
      trim: true 
    })) 
    location: string,
    @Query('page', new ParseIntPipe({ required: false, defaultValue: 1 })) 
    page: number
  ) {
    return this.sightingsService.findAll({ location, page });
  }
}
```

**请求示例:**
```
GET /sightings?location=东海&page=1
GET /sightings?location=Yellow%20Sea&page=2
```

### 场景 2: 用户注册

```typescript
@Controller('auth')
export class AuthController {
  @Post('register')
  register(
    @Body('username', new ParseStringPipe({ 
      minLength: 3, 
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/,
      patternMessage: '用户名只能包含字母、数字和下划线'
    })) 
    username: string,
    @Body('email', new ParseStringPipe({ 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: '请输入有效的邮箱地址'
    })) 
    email: string,
    @Body('nickname', new ParseStringPipe({ 
      minLength: 1, 
      maxLength: 50,
      trim: true 
    })) 
    nickname: string
  ) {
    return this.authService.register({ username, email, nickname });
  }
}
```

**请求示例:**
```json
POST /auth/register
{
  "username": "researcher_001",
  "email": "researcher@whale-conservation.org",
  "nickname": "海洋守护者"
}
```

### 场景 3: 数据标准化

```typescript
@Controller('organizations')
export class OrganizationsController {
  @Post()
  create(
    @Body('code', new ParseStringPipe({ 
      toUpperCase: true,
      trim: true 
    })) 
    code: string,
    @Body('name', new ParseStringPipe({ 
      trim: true 
    })) 
    name: string
  ) {
    // " shu-eco " → "SHU-ECO"
    // " 上海大学经济学院 " → "上海大学经济学院"
    return this.organizationsService.create({ code, name });
  }
}
```

**请求示例:**
```json
POST /organizations
{
  "code": " shu-eco ",
  "name": " 上海大学经济学院 "
}
```

**结果:**
```json
{
  "code": "SHU-ECO",
  "name": "上海大学经济学院"
}
```

### 场景 4: 分类标签

```typescript
@Controller('categories')
export class CategoriesController {
  @Post()
  create(
    @Body('slug', new ParseStringPipe({ 
      pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
      patternMessage: 'slug 只能包含小写字母、数字和连字符，且不能以连字符开头或结尾',
      toLowerCase: true,
      trim: true
    })) 
    slug: string,
    @Body('name', new ParseStringPipe({ 
      minLength: 2, 
      maxLength: 50 
    })) 
    name: string
  ) {
    return this.categoriesService.create({ slug, name });
  }
}
```

**请求示例:**
```json
POST /categories
{
  "slug": "  Whale-Watching  ",
  "name": "观鲸活动"
}
```

**结果:**
```json
{
  "slug": "whale-watching",
  "name": "观鲸活动"
}
```

---

## ⚠️ 错误处理

### 错误 1: 参数为空

```typescript
@Query('keyword', new ParseStringPipe()) keyword: string
```

**请求:** `GET /whales/search` (缺少 keyword 参数)

**响应:**
```json
{
  "statusCode": 400,
  "message": "keyword 不能为空",
  "error": "Bad Request"
}
```

### 错误 2: 空字符串

```typescript
@Body('name', new ParseStringPipe()) name: string
```

**请求:**
```json
{
  "name": ""
}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "name 不能为空字符串",
  "error": "Bad Request"
}
```

### 错误 3: 长度不足

```typescript
@Body('username', new ParseStringPipe({ minLength: 3 })) username: string
```

**请求:**
```json
{
  "username": "ab"
}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "username 长度不能少于 3 个字符 (当前：2)",
  "error": "Bad Request"
}
```

### 错误 4: 长度超限

```typescript
@Body('description', new ParseStringPipe({ maxLength: 200 })) description: string
```

**请求:**
```json
{
  "description": "这是一个非常非常非常长的描述..." // 超过 200 字符
}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "description 长度不能超过 200 个字符 (当前：256)",
  "error": "Bad Request"
}
```

### 错误 5: 格式不匹配

```typescript
@Body('phone', new ParseStringPipe({ 
  pattern: /^1[3-9]\d{9}$/,
  patternMessage: '请输入有效的 11 位手机号码'
})) phone: string
```

**请求:**
```json
{
  "phone": "12345678901"
}
```

**响应:**
```json
{
  "statusCode": 400,
  "message": "请输入有效的 11 位手机号码",
  "error": "Bad Request"
}
```

---

## 🔧 配置选项

```typescript
interface ParseStringOptions {
  /**
   * 最小长度
   */
  minLength?: number;

  /**
   * 最大长度
   */
  maxLength?: number;

  /**
   * 正则表达式验证
   */
  pattern?: RegExp;

  /**
   * 正则验证失败时的自定义错误消息
   */
  patternMessage?: string;

  /**
   * 是否自动修剪首尾空格
   * @default true
   */
  trim?: boolean;

  /**
   * 是否转换为小写
   * @default false
   */
  toLowerCase?: boolean;

  /**
   * 是否转换为大写
   * @default false
   */
  toUpperCase?: boolean;
}
```

### 配置示例

```typescript
// 基础用法 - 仅验证非空
new ParseStringPipe()

// 带长度限制
new ParseStringPipe({ minLength: 2, maxLength: 50 })

// 带正则验证
new ParseStringPipe({ 
  pattern: /^[a-zA-Z0-9]+$/,
  patternMessage: '只能包含字母和数字'
})

// 带大小写转换
new ParseStringPipe({ toLowerCase: true, trim: true })

// 组合配置
new ParseStringPipe({ 
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
  trim: true,
  toLowerCase: true
})
```

---

## 💡 最佳实践

### ✅ 推荐做法

1. **始终启用 trim (默认已开启)**
   ```typescript
   // 好：自动处理用户输入的空格
   new ParseStringPipe({ trim: true })
   ```

2. **为有意义的字段设置长度限制**
   ```typescript
   // 好：防止数据库溢出和滥用
   new ParseStringPipe({ minLength: 2, maxLength: 100 })
   ```

3. **使用正则表达式验证格式**
   ```typescript
   // 好：确保数据格式一致
   new ParseStringPipe({ 
     pattern: /^[\u4e00-\u9fa5a-zA-Z0-9]+$/,
     patternMessage: '只能包含中文、字母和数字'
   })
   ```

4. **为需要标准化的字段使用大小写转换**
   ```typescript
   // 好：确保代码/标识符一致性
   new ParseStringPipe({ toUpperCase: true })
   new ParseStringPipe({ toLowerCase: true })
   ```

### ❌ 避免做法

1. **不要同时使用 toLowerCase 和 toUpperCase**
   ```typescript
   // 避免：互相冲突
   new ParseStringPipe({ toLowerCase: true, toUpperCase: true })
   ```

2. **不要对自由文本使用过于严格的正则**
   ```typescript
   // 避免：限制用户表达
   new ParseStringPipe({ pattern: /^[a-zA-Z]+$/ }) // 不支持中文/数字/空格
   ```

3. **不要忘记设置合理的 maxLength**
   ```typescript
   // 避免：可能导致数据库问题
   new ParseStringPipe() // 无长度限制
   ```

---

## 🧪 测试示例

```typescript
import { Test } from '@nestjs/testing';
import { ParseStringPipe } from '@/common/pipes';

describe('ParseStringPipe', () => {
  let pipe: ParseStringPipe;

  beforeEach(() => {
    pipe = new ParseStringPipe();
  });

  it('应该接受有效字符串', () => {
    expect(pipe.transform('hello', { type: 'body', data: 'name' })).toBe('hello');
  });

  it('应该自动修剪空格', () => {
    expect(pipe.transform('  hello  ', { type: 'body', data: 'name' })).toBe('hello');
  });

  it('应该拒绝 undefined', () => {
    expect(() => pipe.transform(undefined, { type: 'query', data: 'keyword' }))
      .toThrow('keyword 不能为空');
  });

  it('应该拒绝 null', () => {
    expect(() => pipe.transform(null, { type: 'body', data: 'name' }))
      .toThrow('name 不能为空');
  });

  it('应该拒绝空字符串', () => {
    expect(() => pipe.transform('', { type: 'body', data: 'name' }))
      .toThrow('name 不能为空字符串');
  });

  it('应该验证最小长度', () => {
    const minPipe = new ParseStringPipe({ minLength: 3 });
    expect(() => minPipe.transform('ab', { type: 'body', data: 'name' }))
      .toThrow('name 长度不能少于 3 个字符 (当前：2)');
  });

  it('应该验证最大长度', () => {
    const maxPipe = new ParseStringPipe({ maxLength: 5 });
    expect(() => maxPipe.transform('abcdef', { type: 'body', data: 'name' }))
      .toThrow('name 长度不能超过 5 个字符 (当前：6)');
  });

  it('应该验证正则表达式', () => {
    const patternPipe = new ParseStringPipe({ 
      pattern: /^[a-z]+$/,
      patternMessage: '只能包含小写字母'
    });
    expect(() => patternPipe.transform('ABC', { type: 'body', data: 'code' }))
      .toThrow('只能包含小写字母');
  });

  it('应该转换为小写', () => {
    const lowerPipe = new ParseStringPipe({ toLowerCase: true });
    expect(lowerPipe.transform('HELLO', { type: 'body', data: 'code' })).toBe('hello');
  });

  it('应该转换为大写', () => {
    const upperPipe = new ParseStringPipe({ toUpperCase: true });
    expect(upperPipe.transform('hello', { type: 'body', data: 'code' })).toBe('HELLO');
  });
});
```

---

## 📚 相关文档

- [ParseBooleanPipe](./parse-boolean-pipe.md) - 布尔值验证管道
- [ParseIntPipe](./parse-int-pipe.md) - 整数验证管道
- [ParseEmailPipe](./parse-email-pipe.md) - 邮箱验证管道
- [公共管道快速入门](./common-quickstart.md) - 所有公共管道概览

---

**最后更新**: 2026-03-31  
**维护者**: 鲸创项目团队
