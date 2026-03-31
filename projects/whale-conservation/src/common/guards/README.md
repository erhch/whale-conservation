# Guards - 守卫模块

> NestJS 守卫实现 - JWT 认证与角色授权

版本：v0.1.0  
最后更新：2026-03-31

---

## 📁 文件结构

```
guards/
├── index.ts              # 导出索引
├── jwt-auth.guard.ts     # JWT 身份验证守卫
└── roles.guard.ts        # 角色权限守卫
```

---

## 🔐 已实现守卫

### JwtAuthGuard

JWT 身份验证守卫，用于保护需要登录的 API 路由。

**功能：**
- 验证 JWT Token 的有效性
- 提取用户信息并附加到 `request.user`
- 支持配合 `@Public()` 装饰器跳过认证

**使用示例：**
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('whales')
export class WhalesController {
  
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateWhaleDto) {
    // request.user 可用
  }
}
```

### RolesGuard

基于角色的访问控制（RBAC）守卫，用于权限检查。

**功能：**
- 检查用户角色是否匹配所需角色
- 支持多角色匹配（任一匹配即可）
- 配合 `@Roles()` 装饰器使用

**预定义角色：**
| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `admin` | 管理员 | 所有功能 |
| `researcher` | 研究员 | 数据录入、编辑、分析 |
| `volunteer` | 志愿者 | 基础数据查看、活动报名 |
| `viewer` | 访客 | 公开数据查看 |

**使用示例：**
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Roles('admin')
  @Get('users')
  getAllUsers() {
    // 仅管理员可访问
  }
}
```

---

## 🚀 快速开始

### 组合使用（推荐）

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@Controller('protected')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedController {
  
  // 需要登录 + 管理员角色
  @Roles('admin')
  @Get('admin-only')
  adminFeature() {}
  
  // 需要登录 + 研究员或管理员
  @Roles('researcher', 'admin')
  @Get('research-data')
  researchData() {}
}
```

### 配合 @Public() 装饰器

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';
import { Public } from '@/common/decorators';

@Controller('auth')
@UseGuards(JwtAuthGuard)  // 默认需要认证
export class AuthController {
  
  // 公开路由 - 登录/注册不需要 Token
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {}
  
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {}
  
  // 需要认证
  @Get('me')
  getProfile() {
    // request.user 可用
  }
}
```

---

## 📝 最佳实践

### 1. 守卫顺序

```typescript
// ✅ 正确：先认证，后授权
@UseGuards(JwtAuthGuard, RolesGuard)

// ❌ 错误：顺序颠倒
@UseGuards(RolesGuard, JwtAuthGuard)
```

### 2. 访问用户信息

```typescript
import { Request } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return {
    id: req.user.sub,
    email: req.user.email,
    roles: req.user.roles,
  };
}
```

### 3. 错误响应

| 错误 | 状态码 | 说明 |
|------|--------|------|
| Token 缺失/无效 | 401 | Unauthorized |
| 角色权限不足 | 403 | Forbidden |

---

## 🔍 调试

### 查看守卫执行日志

启用 NestJS 日志：
```bash
# 在 .env 中设置
LOG_LEVEL=debug
```

### 测试 Token

```bash
# 获取 Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 使用 Token 访问受保护的路由
curl http://localhost:3000/api/v1/whales \
  -H "Authorization: Bearer <your-token-here>"
```

---

## 📚 相关文档

- [完整 Guards 文档](../../../docs/guards.md) - 详细使用指南
- [装饰器](../decorators/) - @Roles()、@Public()、@CurrentUser()
- [认证模块](../../auth/) - JWT 认证完整流程
- [异常过滤器](../filters/) - 统一错误处理

---

<div align="center">
  <sub>生物鲸创管理系统 - Guards 模块</sub>
</div>
