# Guards 使用指南

> NestJS 守卫完整文档 - JWT 认证、角色授权、权限控制

版本：v0.1.1  
最后更新：2026-04-01

---

## 📌 概述

守卫（Guards）是 NestJS 中用于授权和访问控制的核心机制。本项目实现了基于 JWT 的身份认证和基于角色的访问控制（RBAC），确保 API 接口的安全性。

### 已实现守卫

| 守卫 | 用途 | 典型场景 |
|------|------|----------|
| `JwtAuthGuard` | JWT 身份验证 | 需要登录的 API |
| `RolesGuard` | 角色权限检查 | 管理员专属功能 |

### 执行流程

```
请求进入
    ↓
1. JwtAuthGuard (验证 JWT Token)
    ↓
2. RolesGuard (检查用户角色)
    ↓
3. 控制器处理
    ↓
响应返回
```

---

## 🚀 快速开始

### 全局注册 (可选)

```typescript
import { NestFactory } from '@nestjs/core';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局守卫（谨慎使用，可能影响公开 API）
  // app.useGlobalGuards(new JwtAuthGuard());
  
  await app.listen(3000);
}
```

### 推荐：按路由使用

在控制器或路由级别使用装饰器：

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('whales')
export class WhalesController {
  
  // 需要登录才能访问
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.whalesService.findAll();
  }
}
```

---

## 🔐 JwtAuthGuard - JWT 身份验证

### 功能特性

- ✅ 验证 JWT Token 的有效性
- ✅ 提取用户信息并附加到请求
- ✅ 支持公开路由（配合 `@Public()` 装饰器）
- ✅ 自动处理 Token 过期和无效情况

### 工作原理

1. 从请求头提取 `Authorization: Bearer <token>`
2. 使用 JWT 策略验证 Token
3. 验证成功后将用户信息附加到 `request.user`
4. 验证失败返回 401 Unauthorized

### 使用示例

#### 保护整个控制器

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('sightings')
@UseGuards(JwtAuthGuard)  // 所有路由都需要认证
export class SightingsController {
  
  @Get()
  findAll() {
    // request.user 可用
  }
  
  @Post()
  create(@Body() dto: CreateSightingDto) {
    // request.user 可用
  }
}
```

#### 保护单个路由

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('whales')
export class WhalesController {
  
  // 公开路由 - 任何人都可以访问
  @Get()
  findAll() {
    return this.whalesService.findAll();
  }
  
  // 需要认证 - 只有登录用户可以访问
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whalesService.findOne(id);
  }
  
  // 需要认证 - 创建鲸鱼记录
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateWhaleDto) {
    return this.whalesService.create(dto);
  }
}
```

#### 配合 @Public() 装饰器

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';
import { Public } from '@/common/decorators';

@Controller('auth')
@UseGuards(JwtAuthGuard)  // 默认需要认证
export class AuthController {
  
  // 公开路由 - 登录/注册不需要 Token
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
  
  // 需要认证 - 获取当前用户信息
  @Get('me')
  getProfile() {
    // request.user 可用
  }
}
```

### 访问用户信息

在控制器中访问已认证用户的信息：

```typescript
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('profile')
export class ProfileController {
  
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    // req.user 包含 JWT payload 中的用户信息
    return {
      id: req.user.sub,
      email: req.user.email,
      roles: req.user.roles,
    };
  }
}
```

### 错误响应

#### Token 缺失
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### Token 无效
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### Token 过期
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 👥 RolesGuard - 角色权限检查

### 功能特性

- ✅ 基于角色的访问控制（RBAC）
- ✅ 支持多角色匹配（任一匹配即可）
- ✅ 配合 `@Roles()` 装饰器使用
- ✅ 灵活的权限粒度控制

### 预定义角色

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `admin` | 管理员 | 所有功能 |
| `researcher` | 研究员 | 数据录入、编辑、分析 |
| `volunteer` | 志愿者 | 基础数据查看、活动报名 |
| `viewer` | 访客 | 公开数据查看 |

### 使用示例

#### 角色装饰器

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

#### 保护管理员路由

```typescript
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  // 只有管理员可以访问
  @Roles('admin')
  @Get('users')
  getAllUsers() {
    return this.userService.findAll();
  }
  
  // 管理员可以删除数据
  @Roles('admin')
  @Delete('whales/:id')
  removeWhale(@Param('id') id: string) {
    return this.whalesService.remove(id);
  }
}
```

#### 多角色支持

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@Controller('sightings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SightingsController {
  
  // 研究员和管理员可以创建观测记录
  @Roles('researcher', 'admin')
  @Post()
  create(@Body() dto: CreateSightingDto) {
    return this.sightingsService.create(dto);
  }
  
  // 所有登录用户都可以查看
  @Roles('viewer', 'volunteer', 'researcher', 'admin')
  @Get()
  findAll() {
    return this.sightingsService.findAll();
  }
  
  // 只有研究员和管理员可以编辑
  @Roles('researcher', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSightingDto) {
    return this.sightingsService.update(id, dto);
  }
}
```

#### 组合使用示例

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body,
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles, Public } from '@/common/decorators';

@Controller('whales')
export class WhalesController {
  
  // 公开 - 任何人都可以查看鲸鱼列表
  @Public()
  @Get()
  findAll() {
    return this.whalesService.findAll();
  }
  
  // 公开 - 任何人都可以查看鲸鱼详情
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whalesService.findOne(id);
  }
  
  // 需要登录 - 研究员和管理员可以创建
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('researcher', 'admin')
  @Post()
  create(@Body() dto: CreateWhaleDto) {
    return this.whalesService.create(dto);
  }
  
  // 需要登录 - 研究员和管理员可以编辑
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('researcher', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWhaleDto) {
    return this.whalesService.update(id, dto);
  }
  
  // 仅管理员可以删除
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whalesService.remove(id);
  }
}
```

### 错误响应

#### 角色权限不足
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

---

## 🔧 自定义守卫

### 创建自定义守卫

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由元数据
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    
    if (!requiredPermissions) {
      return true;
    }
    
    // 获取请求对象
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // 检查权限
    return requiredPermissions.every(permission => 
      user.permissions?.includes(permission)
    );
  }
}
```

### 使用自定义装饰器

```typescript
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
```

---

## 📝 最佳实践

### 1. 守卫顺序很重要

```typescript
// ✅ 正确：先认证，后授权
@UseGuards(JwtAuthGuard, RolesGuard)

// ❌ 错误：先检查角色，但用户还没认证
@UseGuards(RolesGuard, JwtAuthGuard)
```

### 2. 使用装饰器提高可读性

```typescript
// ✅ 推荐：使用装饰器
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete(':id')
remove(@Param('id') id: string) {}

// ❌ 不推荐：硬编码角色
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
remove(@Param('id') id: string) {
  // 在代码里检查角色
}
```

### 3. 公开路由使用 @Public()

```typescript
// ✅ 推荐：使用 @Public() 装饰器
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  @Public()
  @Post('login')
  login() {}
}

// ❌ 不推荐：每个路由都写 @UseGuards
@Controller('auth')
export class AuthController {
  @Post('login')  // 忘记加守卫，可能不安全
  login() {}
  
  @UseGuards(JwtAuthGuard)
  @Post('register')
  register() {}
}
```

### 4. 角色命名规范

```typescript
// ✅ 推荐：使用小写、单数形式
@Roles('admin', 'researcher', 'volunteer')

// ❌ 不推荐：混合大小写、复数形式
@Roles('Admin', 'Researchers', 'VOLUNTEER')
```

### 5. 错误处理

守卫抛出异常时，使用过滤器统一处理：

```typescript
// 在 HttpExceptionFilter 中处理
catch(exception: unknown, host: ArgumentsHost) {
  if (exception instanceof UnauthorizedException) {
    // 处理 401
  }
  if (exception instanceof ForbiddenException) {
    // 处理 403
  }
}
```

---

## 🔍 调试技巧

### 查看守卫执行日志

在守卫中添加日志：

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class DebugGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log('=== Guard Debug Info ===');
    console.log('Path:', request.path);
    console.log('Method:', request.method);
    console.log('Headers:', request.headers);
    console.log('User:', request.user);
    return true;
  }
}
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

## 🧪 测试覆盖

### Guards 单元测试

项目包含完整的守卫单元测试，覆盖以下场景：

#### JwtAuthGuard 测试 (`jwt-auth.guard.spec.ts`)

| 测试场景 | 描述 |
|----------|------|
| `@Public()` 路由 | 验证公开路由允许无认证访问 |
| 受保护路由 | 验证 JWT 认证守卫正确委托给父类 AuthGuard |
| 管理员路由保护 | 验证未认证用户被拒绝访问 |
| 已认证用户访问 | 验证有效 Token 允许访问 |
| 健康检查端点 | 验证健康检查端点标记为公开 |

#### RolesGuard 测试 (`roles.guard.spec.ts`)

| 测试场景 | 描述 |
|----------|------|
| 无角色要求 | 验证无角色要求时允许访问 |
| 空角色数组 | 验证空角色数组允许访问 |
| 未认证用户 | 验证未认证用户被拒绝 |
| 用户有所需角色 | 验证角色匹配时允许访问 |
| 用户无所需角色 | 验证角色不匹配时拒绝访问 |
| 多角色 (OR 逻辑) | 验证用户有多个角色之一时允许访问 |
| ADMIN 专属端点 | 验证普通用户无法访问管理员端点 |
| 边缘情况 | 验证用户对象缺少 role 属性时的处理 |

### 运行测试

```bash
# 运行 Guards 相关测试
npm test -- guards

# 运行所有测试
npm test

# 带覆盖率报告
npm test -- --coverage
```

---

## 📚 相关文档

- [认证模块](./auth-module.md) - JWT 认证完整流程
- [装饰器](./decorators.md) - @Roles()、@Public() 等装饰器
- [拦截器](./interceptors.md) - 请求/响应拦截
- [异常过滤器](../src/common/filters/README.md) - 统一错误处理

---

<div align="center">
  <sub>Built with ❤️ for 鲸类保护事业</sub>
</div>
