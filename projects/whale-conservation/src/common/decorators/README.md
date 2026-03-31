# Common Decorators - 公共装饰器

装饰器用于标记路由元数据和提取请求上下文，是 NestJS 中实现代码复用和声明式编程的核心工具。

## 概览

| 装饰器 | 用途 | 配合使用 |
|--------|------|----------|
| `@Public()` | 标记公开路由，跳过 JWT 认证 | `JwtAuthGuard` |
| `@Roles(...)` | 标记路由需要的角色权限 | `RolesGuard` |
| `@CurrentUser()` | 从请求中提取已认证的用户信息 | `JwtAuthGuard` |

---

## @Public() - 公开路由装饰器

用于标记不需要认证的路由，允许特定路由跳过 JWT 认证检查。

### 使用场景

- 登录/注册接口
- 公开数据查询接口
- 健康检查接口
- 静态资源访问

### 用法示例

```typescript
import { Controller, Post, Get, Body } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  /**
   * 用户登录 - 无需认证
   */
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 获取物种列表 - 公开数据
   */
  @Public()
  @Get('species')
  findAllSpecies() {
    return this.speciesService.findAll();
  }
}
```

### 工作原理

`@Public()` 通过 `SetMetadata` 设置 `isPublic: true` 元数据，`JwtAuthGuard` 在拦截请求时会检查此元数据，如果为 `true` 则跳过认证。

---

## @Roles(...) - 角色权限装饰器

用于标记路由需要的角色权限，实现基于角色的访问控制（RBAC）。

### 可用角色

```typescript
enum UserRole {
  ADMIN = 'admin',           // 管理员 - 全部权限
  RESEARCHER = 'researcher', // 研究员 - 数据录入/编辑
  VOLUNTEER = 'volunteer',   // 志愿者 - 只读权限
}
```

### 用法示例

```typescript
import { Controller, Get, Delete, Param } from '@nestjs/common';
import { Roles } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('whales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhalesController {
  /**
   * 删除鲸鱼记录 - 仅管理员
   */
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.whalesService.remove(id);
  }

  /**
   * 更新鲸鱼数据 - 管理员或研究员
   */
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWhaleDto) {
    return this.whalesService.update(id, dto);
  }

  /**
   * 查看鲸鱼列表 - 所有认证用户
   */
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER, UserRole.VOLUNTEER)
  @Get()
  findAll() {
    return this.whalesService.findAll();
  }
}
```

### 多角色支持

可以传递多个角色，用户拥有其中任意一个角色即可访问：

```typescript
@Roles(UserRole.ADMIN, UserRole.RESEARCHER)
```

---

## @CurrentUser() - 当前用户装饰器

从请求中提取已认证的用户信息，方便在控制器中直接访问当前用户。

### 用法示例

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/entities/user.entity';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  /**
   * 获取当前用户个人资料
   */
  @Get()
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * 创建 sighting 记录 - 自动关联当前用户
   */
  @Post('sightings')
  createSighting(
    @CurrentUser() user: User,
    @Body() dto: CreateSightingDto
  ) {
    return this.sightingsService.create({
      ...dto,
      reporterId: user.id, // 自动设置报告人
    });
  }
}
```

### 完整示例 - 组合使用

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../auth/entities/user.entity';
import { User } from '../auth/entities/user.entity';

@Controller('sightings')
export class SightingsController {
  /**
   * 公开：获取所有鲸鱼目击记录
   */
  @Public()
  @Get()
  findAll() {
    return this.sightingsService.findAll();
  }

  /**
   * 认证用户：创建新的目击记录
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateSightingDto
  ) {
    return this.sightingsService.create({
      ...dto,
      reporterId: user.id,
      reporterName: user.name,
    });
  }

  /**
   * 管理员/研究员：删除目击记录
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sightingsService.remove(id);
  }
}
```

---

## 最佳实践

### 1. 装饰器顺序

当多个装饰器一起使用时，注意顺序：

```typescript
// ✅ 推荐：先认证，再授权
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete(':id')
remove(@Param('id') id: string) {}

// ❌ 避免：顺序混乱
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### 2. 默认保护

建议在控制器级别默认启用认证，然后用 `@Public()` 标记例外：

```typescript
@Controller('api')
@UseGuards(JwtAuthGuard) // 默认所有路由需要认证
export class ApiController {
  @Public() // 这个路由例外
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  // 这个路由继承控制器的 JwtAuthGuard
  @Get('protected-data')
  getProtectedData() {
    // ...
  }
}
```

### 3. 类型安全

使用 `@CurrentUser()` 时确保类型定义正确：

```typescript
// ✅ 推荐：明确类型
getProfile(@CurrentUser() user: User) {
  return user;
}

// ❌ 避免：any 类型
getProfile(@CurrentUser() user: any) {
  return user;
}
```

---

## 相关文件

- `public.decorator.ts` - 公开路由装饰器实现
- `roles.decorator.ts` - 角色权限装饰器实现
- `current-user.decorator.ts` - 当前用户装饰器实现
- `index.ts` - 统一导出

## 相关文档

- [Guards 文档](../../docs/guards.md) - JWT 认证和角色守卫
- [API 设计](../../docs/api-design.md) - 整体 API 架构
- [认证模块](../../auth/README.md) - 认证系统详解
