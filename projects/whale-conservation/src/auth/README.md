# 🔐 Auth Module - 认证与授权模块

> JWT 认证 + RBAC 权限管理系统

## 📖 模块概述

Auth 模块提供完整的用户认证和权限管理功能，基于 JWT (JSON Web Token) 和 RBAC (Role-Based Access Control) 模型。

### 核心功能

- ✅ 用户注册与登录
- ✅ JWT Token 生成与验证
- ✅ 角色权限控制 (RBAC)
- ✅ 密码加密存储 (bcrypt)
- ✅ 公开接口标记 (@Public)
- ✅ 当前用户信息获取 (@CurrentUser)

## 🏗️ 模块结构

```
auth/
├── auth.controller.ts      # 认证控制器 (注册/登录/个人信息)
├── auth.service.ts         # 认证服务 (业务逻辑)
├── auth.module.ts          # 模块定义
├── strategies/
│   └── jwt.strategy.ts     # JWT 验证策略
├── entities/
│   └── user.entity.ts      # 用户实体
└── dto/
    ├── register.dto.ts     # 注册请求 DTO
    └── login.dto.ts        # 登录请求 DTO
```

## 🚀 快速开始

### 1. 注册新用户

```typescript
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "张三",
  "role": "researcher"  // admin | researcher | volunteer
}
```

**响应示例:**

```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "张三",
    "role": "researcher",
    "createdAt": "2026-03-28T10:00:00.000Z"
  }
}
```

### 2. 登录获取 Token

```typescript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**响应示例:**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "张三",
      "role": "researcher"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

### 3. 使用 Token 访问受保护接口

```typescript
GET /api/v1/species
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. 修改密码

```typescript
POST /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**响应示例:**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 5. 获取当前用户信息

```typescript
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "张三",
    "role": "researcher",
    "createdAt": "2026-03-28T10:00:00.000Z",
    "updatedAt": "2026-03-28T10:00:00.000Z"
  }
}
```

### 6. 获取用户列表 (管理员专用)

```typescript
GET /api/v1/auth/users?page=1&limit=10&role=admin&isActive=true
Authorization: Bearer <admin-token>
```

**查询参数:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 10 | 每页数量 (最大 100) |
| `role` | UserRole | - | 按角色筛选 (admin/researcher/volunteer/public) |
| `isActive` | boolean | - | 按激活状态筛选 |

**响应示例:**

```json
{
  "data": [
    {
      "id": "usr_abc123",
      "username": "admin",
      "email": "admin@example.com",
      "nickname": "管理员",
      "role": "admin",
      "isActive": true,
      "lastLoginAt": "2026-03-29T10:00:00.000Z",
      "lastLoginIp": "192.168.1.100",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-03-29T10:00:00.000Z"
    },
    {
      "id": "usr_def456",
      "username": "researcher1",
      "email": "researcher@example.com",
      "nickname": "研究员 A",
      "role": "researcher",
      "isActive": true,
      "lastLoginAt": "2026-03-28T14:30:00.000Z",
      "lastLoginIp": "192.168.1.101",
      "createdAt": "2026-01-15T08:00:00.000Z",
      "updatedAt": "2026-03-28T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**权限要求:** 仅限 `admin` 角色访问

## 🛡️ 权限控制

### 角色定义

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `admin` | 管理员 | 全部权限 |
| `researcher` | 研究员 | 数据读写 + 统计分析 |
| `volunteer` | 志愿者 | 数据查看 + 观测记录 |

### 使用 @Roles() 装饰器

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('species')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SpeciesController {
  
  // 仅管理员可删除
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.speciesService.remove(id);
  }
  
  // 研究员和管理员可编辑
  @Patch(':id')
  @Roles('researcher', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateSpeciesDto) {
    return this.speciesService.update(id, dto);
  }
  
  // 所有认证用户可查询
  @Get()
  findAll() {
    return this.speciesService.findAll();
  }
}
```

### 使用 @Public() 标记公开接口

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  
  // 健康检查接口 - 无需认证
  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date() };
  }
}
```

### 获取当前用户信息

```typescript
import { Controller, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  
  @Get()
  getProfile(@CurrentUser() user: User) {
    // 直接获取当前登录用户信息
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }
}
```

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置:

```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=86400  # Token 有效期 (秒)，默认 24 小时

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/whale_conservation
```

### 模块注册

在 `app.module.ts` 中:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonAppModule } from './common/common.module';

@Module({
  imports: [
    CommonAppModule,  // 必须先导入 Common 模块 (提供装饰器和 Guard)
    AuthModule,
    // ... 其他模块
  ],
})
export class AppModule {}
```

## 🔑 JWT Token 结构

```json
{
  "sub": "usr_abc123",
  "email": "user@example.com",
  "role": "researcher",
  "iat": 1711620000,
  "exp": 1711706400
}
```

| 字段 | 说明 |
|------|------|
| `sub` | 用户 ID |
| `email` | 用户邮箱 |
| `role` | 用户角色 |
| `iat` | Token 签发时间 (Unix 时间戳) |
| `exp` | Token 过期时间 (Unix 时间戳) |

## 🧪 测试示例

### cURL 测试

```bash
# 1. 注册
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "测试用户",
    "role": "volunteer"
  }'

# 2. 登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 3. 访问受保护接口 (替换 <token>)
curl -X GET http://localhost:3000/api/v1/species \
  -H "Authorization: Bearer <token>"

# 4. 获取当前用户信息
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

### JavaScript/TypeScript 示例

```typescript
// 登录并保存 Token
async login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const { data } = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
}

// 带 Token 的请求
async fetchSpecies() {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/v1/species', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}
```

## 🔒 安全最佳实践

### 密码安全

- ✅ 使用 bcrypt 加密存储 (cost factor: 10)
- ✅ 密码长度要求：最少 8 位
- ✅ 密码复杂度：包含大小写字母、数字、特殊字符
- ❌ 明文密码永不存储或传输

### Token 安全

- ✅ 使用强密钥 (JWT_SECRET 至少 32 字符)
- ✅ 设置合理的过期时间 (建议 24 小时)
- ✅ HTTPS 传输 Token
- ❌ Token 不存储在 localStorage (生产环境建议用 httpOnly cookie)

### 权限控制

- ✅ 默认拒绝所有未明确允许的请求
- ✅ 所有写操作必须验证角色权限
- ✅ 敏感操作 (删除、权限变更) 仅限 admin
- ✅ 记录所有认证相关日志

## 📊 常见错误处理

| HTTP 状态码 | 错误信息 | 说明 |
|------------|----------|------|
| `401` | `Unauthorized` | 未提供 Token 或 Token 无效 |
| `403` | `Forbidden` | Token 有效但权限不足 |
| `400` | `Invalid credentials` | 邮箱或密码错误 |
| `409` | `User already exists` | 邮箱已被注册 |

## 🔄 Token 刷新策略

当前版本使用简单 Token 模式 (无刷新 Token)。建议的刷新策略:

```typescript
// 方案 1: 短有效期 + 定期重新登录
// JWT_EXPIRATION = 3600 (1 小时)
// 前端检测 Token 过期后引导用户重新登录

// 方案 2: 双 Token 模式 (待实现)
// access_token: 15 分钟
// refresh_token: 7 天 (存储于 httpOnly cookie)
// /auth/refresh 端点用于刷新 access_token
```

## 📝 待扩展功能

- [ ] Token 刷新机制 (refresh token)
- [ ] 密码重置 (邮件验证)
- [ ] 双因素认证 (2FA)
- [ ] 登录日志与异常检测
- [ ] OAuth2 第三方登录 (GitHub/Google)
- [ ] API Key 支持 (服务端对服务端认证)
- [x] 用户列表管理 (管理员专用) - ✅ 已实现 `GET /auth/users` 端点

## 📋 更新日志

- **2026-03-29**: 新增用户列表接口 (`GET /auth/users`) - 管理员专用，支持分页和筛选
- **2026-03-29**: 新增修改密码接口 (`POST /auth/change-password`)

## 📚 相关文档

- [Common Module 快速上手](../common/README.md) - @Public() 装饰器使用
- [API 使用示例](../../docs/api-examples.md) - 完整认证流程示例
- [数据字典](../../docs/data-dictionary.md) - 用户实体字段说明

---

<div align="center">
  <sub>最后更新：2026-03-29</sub>
</div>
