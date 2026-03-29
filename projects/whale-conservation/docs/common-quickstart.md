# Common Module Quick Start Guide

> 鲸创管理系统 - 公共工具模块快速上手指南

版本：v0.1.3  
最后更新：2026-03-29

---

## 5 分钟快速上手

本指南帮助你快速了解和使用 `src/common/` 模块中的通用工具。

### 📦 核心功能一览

| 类别 | 功能 | 使用场景 |
|------|------|----------|
| **Filters** | 统一异常处理 | 全局错误响应格式化 |
| **Guards** | JWT 认证 + RBAC 权限 | 接口安全控制 |
| **Interceptors** | 日志/缓存/超时/响应转换/ETag | 横切关注点统一处理 |
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

### 🏷️ 场景 10: HTTP 条件请求 (ETag)

```typescript
import { UseInterceptors, ETag } from '@/common/interceptors';

@Controller('species')
export class SpeciesController {
  // 启用 ETag - 客户端缓存验证
  @UseInterceptors(ETagInterceptor)
  @Get()
  findAll() {
    return this.speciesService.findAll();
  }
  
  // 弱验证 ETag - 适用于语义相同但字节不同的响应
  @UseInterceptors(ETagInterceptor)
  @ETag(true)
  @Get('details/:id')
  findOne(@Param('id') id: string) {
    return this.speciesService.findOne(id);
  }
}
```

**客户端使用示例:**

```bash
# 首次请求 - 获取数据和 ETag
$ curl -i https://api.example.com/api/v1/species
# 响应包含：ETag: "a1b2c3d4e5f6g7h8"

# 后续请求 - 使用 If-None-Match 检查是否更新
$ curl -i -H 'If-None-Match: "a1b2c3d4e5f6g7h8"' https://api.example.com/api/v1/species
# 如果数据未变：HTTP 304 Not Modified (无响应体，节省带宽)
# 如果数据已变：HTTP 200 OK + 新数据 + 新 ETag
```

**与缓存拦截器配合使用:**

```typescript
// 同时启用服务器缓存和客户端 ETag 验证
@UseInterceptors(CacheInterceptor, ETagInterceptor)
@Get()
findAll() {
  return this.speciesService.findAll();
}
```

**优势:**
- 📉 减少带宽消耗 - 未变更数据返回 304 空响应
- ⚡ 提升响应速度 - 客户端可直接使用本地缓存
- 🔒 无状态 - 服务器无需维护缓存状态，ETag 从响应体生成

**注意:** ETag 仅对 `GET` 和 `HEAD` 请求生效。

---

### 📄 场景 11: 统一分页处理 (PaginationPipe)

使用 `PaginationPipe` 统一处理列表接口的分页参数，自动计算 offset 偏移量。

```typescript
import { PaginationPipe, type PaginationResult } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  // 基础用法 - 默认 page=1, limit=10
  @Get()
  findAll(@Query(new PaginationPipe()) pagination: PaginationResult) {
    // pagination: { page: 1, limit: 10, offset: 0 }
    return this.whalesService.findAll(pagination.page, pagination.limit);
  }
  
  // 自定义配置 - 默认页大小 20，最大 50
  @Get('species')
  findAllSpecies(
    @Query(new PaginationPipe({ defaultLimit: 20, maxLimit: 50 }))
    pagination: PaginationResult
  ) {
    return this.speciesService.findAll(pagination.page, pagination.limit);
  }
  
  // 组合其他筛选条件
  @Get('sightings')
  findSightings(
    @Query(new PaginationPipe({ defaultLimit: 25 })) pagination: PaginationResult,
    @Query('speciesId', new ParseOptionalIntPipe()) speciesId?: number,
    @Query('startDate', new ParseOptionalDatePipe()) startDate?: Date,
  ) {
    return this.sightingsService.findAll({
      ...pagination,
      speciesId,
      startDate,
    });
  }
}
```

**PaginationPipe 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `defaultPage` | `number` | `1` | 默认页码 (从 1 开始) |
| `defaultLimit` | `number` | `10` | 默认每页数量 |
| `minPage` | `number` | `1` | 最小页码 |
| `minLimit` | `number` | `1` | 最小每页数量 |
| `maxLimit` | `number` | `100` | 最大每页数量 (防止过度查询) |

**PaginationResult 返回值:**

| 属性 | 类型 | 说明 |
|------|------|------|
| `page` | `number` | 当前页码 (从 1 开始) |
| `limit` | `number` | 每页数量 |
| `offset` | `number` | 偏移量 (用于 SQL: OFFSET) |

**优势:**

- ✅ **统一分页逻辑** - 所有列表接口使用相同的分页参数处理
- ✅ **自动计算 offset** - 无需手动计算 `(page - 1) * limit`
- ✅ **安全限制** - 防止恶意请求过大的 `limit` 值
- ✅ **类型安全** - TypeScript 类型定义，IDE 自动补全

**对比传统方式:**

```typescript
// ❌ 传统方式 - 每个接口重复写分页参数
@Get()
findAll(
  @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 }))
  page: number,
  @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
  limit: number,
) {
  const offset = (page - 1) * limit;  // 手动计算
  return this.service.findAll(page, limit, offset);
}

// ✅ 使用 PaginationPipe - 简洁统一
@Get()
findAll(@Query(new PaginationPipe()) pagination: PaginationResult) {
  // pagination.offset 已自动计算
  return this.service.findAll(pagination.page, pagination.limit);
}
```

**请求示例:**

```bash
# 基础用法 - 第 1 页，每页 10 条
GET /api/v1/whales

# 自定义页码和页大小
GET /api/v1/whales?page=2&limit=25

# 超出最大限制会自动拒绝
GET /api/v1/whales?limit=500
# 响应：400 Bad Request - 每页数量不能超过 100
```

**注意:** 速率限制 (Rate Limiting) 的详细文档已在 `src/common/README.md` 中说明。

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
