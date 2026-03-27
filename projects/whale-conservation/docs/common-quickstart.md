# Common Module Quick Start Guide

> 鲸创管理系统 - 公共工具模块快速上手指南

版本：v0.1.0  
最后更新：2026-03-28

---

## 5 分钟快速上手

本指南帮助你快速了解和使用 `src/common/` 模块中的通用工具。

### 📦 核心功能一览

| 类别 | 功能 | 使用场景 |
|------|------|----------|
| **Filters** | 统一异常处理 | 全局错误响应格式化 |
| **Guards** | JWT 认证 + RBAC 权限 | 接口安全控制 |
| **Interceptors** | 日志/缓存/超时/响应转换 | 横切关注点统一处理 |
| **Pipes** | 参数验证与转换 | Query/Body 参数解析 |
| **Decorators** | @Public/@Roles/@CurrentUser | 路由元数据标记 |

---

## 全局注册 (main.ts)

在应用启动时注册全局工具：

```typescript
// src/main.ts
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';
import { TransformInterceptor, LoggingInterceptor } from '@/common/interceptors';
import { JwtAuthGuard } from '@/common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
  
  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
  
  // 全局守卫 (可选，推荐在 Controller 级别使用)
  // app.useGlobalGuards(new JwtAuthGuard());
  
  await app.listen(3000);
}
```

---

## 常用场景速查

### 🔐 场景 1: 公开接口 (无需登录)

```typescript
import { Public } from '@/common/decorators';

@Controller('auth')
export class AuthController {
  @Public()  // ← 跳过 JWT 认证
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### 🔐 场景 2: 需要登录的接口

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';

@Controller('whales')
@UseGuards(JwtAuthGuard)  // ← 需要 JWT 认证
export class WhalesController {
  @Get()
  findAll() {
    return this.whalesService.findAll();
  }
}
```

### 🔐 场景 3: 角色权限控制

```typescript
import { Roles } from '@/common/decorators';
import { RolesGuard } from '@/common/guards';
import { UserRole } from '@/auth/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Roles(UserRole.ADMIN)  // ← 仅管理员可访问
  @Delete('user/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
  
  @Roles(UserRole.ADMIN, UserRole.RESEARCHER)  // ← 管理员或研究员
  @Post('report')
  createReport(@Body() dto: ReportDto) {
    return this.reportService.create(dto);
  }
}
```

### 📊 场景 4: 获取当前用户信息

```typescript
import { CurrentUser } from '@/common/decorators';
import { User } from '@/auth/entities/user.entity';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    // user 包含：id, username, email, role, organization
    return {
      username: user.username,
      role: user.role,
      organization: user.organization,
    };
  }
}
```

### ⚡ 场景 5: 接口响应缓存

```typescript
import { UseInterceptors, CacheKey, CacheTTL } from '@/common/interceptors';

@Controller('species')
export class SpeciesController {
  // 默认缓存 5 分钟
  @UseInterceptors(CacheInterceptor)
  @Get()
  findAll() {
    return this.speciesService.findAll();
  }
  
  // 自定义缓存 1 小时
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600)
  @Get('statistics')
  getStatistics() {
    return this.statsService.getStatistics();
  }
  
  // 自定义缓存键
  @UseInterceptors(CacheInterceptor)
  @CacheKey('species-list-page-1')
  @Get('page/:page')
  findByPage(@Param('page') page: number) {
    return this.speciesService.findByPage(page);
  }
}
```

**清除缓存 (在 Service 中):**

```typescript
@Injectable()
export class SpeciesService {
  constructor(private cacheInterceptor: CacheInterceptor) {}
  
  async create(createDto: CreateSpeciesDto) {
    const result = await this.prisma.species.create({ data: createDto });
    this.cacheInterceptor.clearCache('cache:/api/v1/species');  // 清除列表缓存
    return result;
  }
}
```

### ⏱️ 场景 6: 请求超时控制

```typescript
import { UseInterceptors, Timeout } from '@/common/interceptors';

@Controller('import')
export class ImportController {
  // 自定义超时时间 (秒)
  @UseInterceptors(TimeoutInterceptor)
  @Timeout(60)  // 60 秒超时
  @Post('bulk')
  bulkImport(@Body() dto: BulkImportDto) {
    return this.importService.bulkImport(dto);
  }
}
```

### 🔢 场景 7: 分页参数验证

```typescript
import { ParseOptionalIntPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 }))
    page: number,
    
    @Query('pageSize', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 }))
    pageSize: number,
  ) {
    return this.whalesService.findAll({ page, pageSize });
  }
}
```

### 🎯 场景 8: 布尔值参数解析

```typescript
import { ParseOptionalBooleanPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    // 支持：true/false, 1/0, yes/no, on/off, y/n
    @Query('active', new ParseOptionalBooleanPipe({ defaultValue: true }))
    active: boolean,
    
    @Query('verified', ParseOptionalBooleanPipe)
    verified?: boolean,
  ) {
    return this.whalesService.findAll({ active, verified });
  }
}
```

### 📏 场景 9: 浮点数参数验证

```typescript
import { ParseOptionalFloatPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    // 鲸鱼体长：1-35 米，最多 2 位小数
    @Query('minLength', new ParseOptionalFloatPipe({ min: 1, max: 35, precision: 2 }))
    minLength?: number,
    
    // 水温：0-40°C
    @Query('waterTemp', new ParseOptionalFloatPipe({ min: 0, max: 40 }))
    waterTemp?: number,
  ) {
    return this.whalesService.findAll({ minLength, waterTemp });
  }
}
```

---

## 错误处理

所有异常会被全局过滤器统一处理，返回格式：

```json
{
  "statusCode": 400,
  "timestamp": "2026-03-28T08:00:00.000Z",
  "path": "/api/v1/whales",
  "message": "参数验证失败：page 必须大于等于 1",
  "error": "Bad Request"
}
```

---

## 响应格式

所有成功响应会被 `TransformInterceptor` 统一封装：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-03-28T08:00:00.000Z"
}
```

---

## 最佳实践

### ✅ 推荐做法

1. **公开接口使用 @Public()** - 登录/注册/健康检查等
2. **敏感操作使用 @Roles()** - 明确指定允许的角色
3. **列表查询使用缓存** - 减少数据库压力
4. **写操作后清除缓存** - 保证数据一致性
5. **长任务设置超时** - 防止资源阻塞

### ⚠️ 注意事项

1. **缓存键一致性** - 清除缓存时使用与实际缓存相同的键
2. **缓存清除顺序** - 先执行数据库操作，再清除缓存
3. **敏感数据不缓存** - 用户信息、密码等不应缓存
4. **超时时间合理** - 根据业务场景设置，避免过短或过长

---

## 相关文件

- 详细文档：`src/common/README.md`
- API 示例：`docs/api-examples.md`
- 数据库设计：`docs/database-design.md`

---

**有问题？** 查看 `src/common/` 目录下的源代码和注释获取更多信息。
