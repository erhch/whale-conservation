# ParseEmailPipe 使用指南

> 邮箱格式验证管道 - 用于用户注册、联系方式验证等场景

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

`ParseEmailPipe` 是用于验证邮箱地址格式的管道，适用于用户注册、联系方式收集、通知配置等需要邮箱验证的场景。

### 核心功能

- ✅ 标准邮箱格式验证（支持常见格式）
- ✅ 自动转换为小写并去除首尾空格
- ✅ 支持必填/可选配置
- ✅ 友好的中文错误提示
- ✅ 支持带标签的邮箱（如 user+tag@domain.com）

---

## 🚀 快速开始

### 基础用法 - 必填邮箱

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ParseEmailPipe } from '@/common/pipes';

@Controller('users')
export class UsersController {
  @Post('register')
  register(
    @Body('email', new ParseEmailPipe()) email: string
  ) {
    // email 已验证为有效邮箱格式
    return this.usersService.register({ email });
  }
}
```

### 可选邮箱参数

```typescript
@Post('profile')
updateProfile(
  @Body('contactEmail', new ParseEmailPipe({ required: false })) contactEmail?: string
) {
  // 如果未提供，contactEmail 为 undefined
  return this.usersService.updateProfile({ contactEmail });
}
```

---

## 📋 实际应用场景

### 场景 1: 用户注册

```typescript
import { ParseStringPipe, ParseEmailPipe } from '@/common/pipes';

@Controller('auth')
export class AuthController {
  @Post('register')
  register(
    @Body('username', new ParseStringPipe({ min: 3, max: 20 })) username: string,
    @Body('email', new ParseEmailPipe()) email: string,
    @Body('password', new ParseStringPipe({ min: 8 })) password: string
  ) {
    return this.authService.register({ username, email, password });
  }
}
```

**请求示例:**
```json
POST /auth/register
{
  "username": "researcher_zhang",
  "email": "zhang@example.com",
  "password": "securePassword123"
}
```

**有效响应:**
```json
{
  "data": {
    "id": "user-001",
    "username": "researcher_zhang",
    "email": "zhang@example.com"
  },
  "message": "注册成功"
}
```

**错误响应 (无效邮箱):**
```json
{
  "statusCode": 400,
  "message": "invalid-email 不是有效的邮箱地址格式",
  "error": "Bad Request"
}
```

---

### 场景 2: 联系方式更新

```typescript
@Patch('profile')
@UseGuards(JwtAuthGuard)
updateProfile(
  @CurrentUser() user: User,
  @Body('phone', new ParsePhonePipe({ required: false })) phone?: string,
  @Body('contactEmail', new ParseEmailPipe({ required: false })) contactEmail?: string,
  @Body('organization', new ParseStringPipe({ max: 100, required: false })) organization?: string
) {
  return this.usersService.updateProfile(user.id, { phone, contactEmail, organization });
}
```

**请求示例:**
```json
PATCH /users/profile
{
  "contactEmail": "researcher.zhang@shu.edu.cn",
  "organization": "上海大学经济学院"
}
```

---

### 场景 3: 邮件通知配置

```typescript
@Post('notifications/email')
@UseGuards(JwtAuthGuard)
configureEmailNotifications(
  @CurrentUser() user: User,
  @Body('recipientEmail', new ParseEmailPipe()) recipientEmail: string,
  @Body('notificationTypes', new ParseArrayPipe({ items: String, min: 1 })) notificationTypes: string[]
) {
  return this.notificationService.configureEmail({
    userId: user.id,
    recipientEmail,
    notificationTypes
  });
}
```

**请求示例:**
```json
POST /notifications/email
{
  "recipientEmail": "alerts@whale-conservation.org",
  "notificationTypes": ["sighting_alert", "habitat_change", "system_maintenance"]
}
```

---

### 场景 4: 批量导入研究人员邮箱

```typescript
@Post('researchers/import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
importResearchers(
  @Body('researchers', new ParseArrayPipe({
    items: Object,
    validateEach: true,
    optionalEach: {
      name: new ParseStringPipe({ min: 1, max: 50 }),
      email: new ParseEmailPipe(),
      institution: new ParseStringPipe({ max: 100, required: false }),
      researchArea: new ParseStringPipe({ max: 200, required: false })
    }
  })) researchers: Array<{ name: string; email: string; institution?: string; researchArea?: string }>
) {
  return this.researchersService.bulkImport(researchers);
}
```

**请求示例:**
```json
POST /researchers/import
{
  "researchers": [
    {
      "name": "张教授",
      "email": "zhang.prof@shu.edu.cn",
      "institution": "上海大学经济学院",
      "researchArea": "海洋生态保护"
    },
    {
      "name": "李研究员",
      "email": "li.researcher@whale-conservation.org",
      "institution": "鲸创保护中心",
      "researchArea": "鲸鱼迁徙追踪"
    }
  ]
}
```

---

## ⚠️ 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `邮箱地址是必填项，请提供有效的邮箱地址` | 未提供参数或参数为空 | 确保请求包含有效的邮箱参数 |
| `xxx 不是有效的邮箱地址格式` | 邮箱格式不正确 | 检查邮箱格式是否符合标准 |
| `邮箱地址不能为空` | 空字符串传入 | 移除空值或设置 `required: false` |

### 支持的邮箱格式

```typescript
// ✅ 有效格式
user@domain.com
user.name@domain.com
user+tag@domain.com           // 带标签的邮箱
user_name@domain.co.uk         // 带下划线和子域名
user123@sub.domain.org         // 数字和子域名

// ❌ 无效格式
@domain.com                    // 缺少用户名
user@                          // 缺少域名
user@domain                    // 缺少顶级域名
user name@domain.com           // 包含空格
user@domain@com                // 多个 @ 符号
```

---

## 🔧 配置选项

### ParseEmailPipe 选项

```typescript
interface ParseEmailOptions {
  /** 是否必填，默认 true */
  required?: boolean;
}
```

### 使用示例

```typescript
// 必填邮箱 (默认)
@Body('email', new ParseEmailPipe()) email: string

// 可选邮箱
@Body('contactEmail', new ParseEmailPipe({ required: false })) contactEmail?: string
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **统一转换为小写** - ParseEmailPipe 会自动将邮箱转换为小写，避免大小写不一致问题
2. **合理使用必填选项** - 对于核心功能（如登录、注册）使用必填，对于辅助功能（如备用联系方式）使用可选
3. **配合其他验证管道使用** - 与 ParseStringPipe 等配合使用，确保数据完整性
4. **在 DTO 中明确标注可选** - 使用 `?` 标注可选字段，与 `required: false` 保持一致

### ❌ 避免的做法

1. **不要在前端重复验证** - 信任后端的 ParseEmailPipe，前端验证仅用于用户体验
2. **不要存储原始大小写** - ParseEmailPipe 已自动转换为小写，直接使用返回值
3. **不要忽略错误提示** - 将管道返回的错误信息直接传递给用户，帮助其纠正输入

---

## 🧪 测试示例

```typescript
import { ParseEmailPipe } from '@/common/pipes';
import { BadRequestException } from '@nestjs/common';

describe('ParseEmailPipe', () => {
  const requiredPipe = new ParseEmailPipe();
  const optionalPipe = new ParseEmailPipe({ required: false });

  describe('必填邮箱验证', () => {
    it('should validate valid email', () => {
      expect(requiredPipe.transform('test@example.com')).toBe('test@example.com');
      expect(requiredPipe.transform('USER@DOMAIN.COM')).toBe('user@domain.com'); // 自动转小写
      expect(requiredPipe.transform('  user+tag@domain.co.uk  ')).toBe('user+tag@domain.co.uk'); // 自动 trim
    });

    it('should reject invalid email', () => {
      expect(() => requiredPipe.transform('invalid-email'))
        .toThrow(BadRequestException);
      expect(() => requiredPipe.transform('@domain.com'))
        .toThrow(BadRequestException);
      expect(() => requiredPipe.transform('user@'))
        .toThrow(BadRequestException);
    });

    it('should reject empty value', () => {
      expect(() => requiredPipe.transform(''))
        .toThrow(BadRequestException);
      expect(() => requiredPipe.transform(undefined))
        .toThrow(BadRequestException);
      expect(() => requiredPipe.transform(null))
        .toThrow(BadRequestException);
    });
  });

  describe('可选邮箱验证', () => {
    it('should accept undefined', () => {
      expect(optionalPipe.transform(undefined)).toBeUndefined();
      expect(optionalPipe.transform(null)).toBeUndefined();
      expect(optionalPipe.transform('')).toBeUndefined();
    });

    it('should validate when provided', () => {
      expect(optionalPipe.transform('test@example.com')).toBe('test@example.com');
    });
  });
});
```

---

## 🔗 相关管道

| 管道 | 用途 |
|------|------|
| `ParsePhonePipe` | 电话号码验证 |
| `ParseUrlPipe` | URL 地址验证 |
| `ParseStringPipe` | 字符串验证（长度、格式等） |
| `ParseArrayPipe` | 数组验证（批量邮箱导入场景） |

---

## 📚 相关文档

- [API Design](./api-design.md) - API 设计规范
- [API Examples](./api-examples.md) - API 使用示例
- [Common Quickstart](./common-quickstart.md) - 公共模块快速入门
- [ParsePhonePipe](./parse-phone-pipe.md) - 电话号码验证管道（待创建）
- [ParseUrlPipe](./parse-url-pipe.md) - URL 验证管道（待创建）

---

**🐋 保护鲸鱼，从有效的联系方式开始！**
