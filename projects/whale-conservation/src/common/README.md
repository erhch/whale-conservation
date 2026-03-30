# Common Utilities - 公共工具模块

本目录包含全局通用的 NestJS 工具类，用于统一处理跨模块的通用逻辑。

## 目录结构

```
common/
├── decorators/      # 自定义装饰器
├── filters/         # 异常过滤器
├── guards/          # 路由守卫
├── interceptors/    # 拦截器
└── pipes/           # 验证管道
```

## 已实现功能

### 📁 Filters (异常过滤器)

| 文件 | 说明 |
|------|------|
| `http-exception.filter.ts` | 统一格式化 HTTP 异常响应 |
| `index.ts` | 统一导出 (推荐使用 `import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters'`) |

**使用示例:**

```typescript
// main.ts
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';

app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
```

**过滤器说明:**

- `HttpExceptionFilter` - 捕获并格式化 HTTP 异常 (HttpException 及其子类)
- `AllExceptionsFilter` - 捕获所有未处理的异常，作为最后一道防线

**统一错误响应格式:**

```json
{
  "statusCode": 404,
  "timestamp": "2026-03-27T13:30:00.000Z",
  "path": "/api/v1/whales/999",
  "message": "鲸鱼个体不存在",
  "error": "Not Found"
}
```

---

### Filters 详细用法

#### 1. HttpExceptionFilter - HTTP 异常过滤器

**作用:** 捕获所有 `HttpException` 及其子类异常，统一格式化错误响应。

**捕获的异常类型:**
- `HttpException` - 基础 HTTP 异常
- `BadRequestException` - 400 请求错误
- `UnauthorizedException` - 401 未授权
- `ForbiddenException` - 403 禁止访问
- `NotFoundException` - 404 资源不存在
- `ConflictException` - 409 资源冲突
- `InternalServerErrorException` - 500 服务器错误
- 所有其他 `HttpException` 子类

**使用场景:**

```typescript
// 在控制器中抛出标准 HTTP 异常
@Get('whales/:id')
findOne(@Param('id') id: string) {
  const whale = this.whalesService.findOne(id);
  if (!whale) {
    throw new NotFoundException(`鲸鱼个体 ${id} 不存在`);
  }
  return whale;
}

// 抛出带错误码的异常
throw new BadRequestException({
  message: '参数验证失败',
  error: 'InvalidParams',
  details: [{ field: 'latitude', message: '必须是 -90 到 90 之间的数字' }]
});
```

**响应格式说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusCode` | number | HTTP 状态码 (400/401/404/500 等) |
| `timestamp` | string | ISO 8601 格式时间戳 |
| `path` | string | 请求路径 |
| `message` | string \| string[] | 错误消息 (可能是字符串或数组) |
| `error` | string | 错误类型名称 (可选) |

---

#### 2. AllExceptionsFilter - 全局异常过滤器

**作用:** 捕获所有未被处理的异常，作为最后一道防线，防止服务器崩溃并返回友好的错误响应。

**捕获的异常类型:**
- 未捕获的 JavaScript 异常
- 数据库连接错误
- 第三方 API 调用失败
- 代码逻辑错误
- 所有未被 `HttpExceptionFilter` 捕获的异常

**使用场景:**

```typescript
// 未捕获的异常会被 AllExceptionsFilter 捕获
@Get('whales/:id/sightings')
async getSightings(@Param('id') id: string) {
  // 如果数据库连接失败，会被 AllExceptionsFilter 捕获
  return this.sightingsService.findByWhaleId(id);
}

// 第三方 API 调用失败
@Get('weather/:stationId')
async getWeather(@Param('stationId') id: string) {
  // 如果天气 API 超时或失败，会被捕获
  return this.weatherService.getCurrent(id);
}
```

**日志记录建议:**

```typescript
// 在 AllExceptionsFilter 中添加日志记录
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // 记录详细错误日志用于排查
    this.logger.error('未捕获的异常:', exception);
    
    // ... 其余处理逻辑
  }
}
```

---

### 过滤器注册顺序

在 `main.ts` 中注册过滤器的推荐顺序:

```typescript
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';
import { LoggingInterceptor, TransformInterceptor } from '@/common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. 先注册过滤器 (异常处理)
  app.useGlobalFilters(
    new HttpExceptionFilter(),      // 先处理标准 HTTP 异常
    new AllExceptionsFilter()       // 再处理所有其他异常 (兜底)
  );
  
  // 2. 再注册拦截器 (请求/响应处理)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),       // 日志记录 (最先执行)
    new TransformInterceptor()      // 响应转换
  );
  
  await app.listen(3000);
}
```

**执行顺序:**
1. 请求进入 → `LoggingInterceptor` (记录请求)
2. 控制器执行 → 可能抛出异常
3. 异常抛出 → `HttpExceptionFilter` (如果是 HTTP 异常)
4. 未处理异常 → `AllExceptionsFilter` (兜底捕获)
5. 响应返回 → `TransformInterceptor` (格式化响应)
6. 响应发出 → `LoggingInterceptor` (记录响应)

---

### 常见 HTTP 状态码参考

| 状态码 | 异常类 | 说明 | 示例场景 |
|--------|--------|------|----------|
| 400 | `BadRequestException` | 请求参数错误 | 经纬度超出范围、必填字段缺失 |
| 401 | `UnauthorizedException` | 未认证 | Token 缺失或过期 |
| 403 | `ForbiddenException` | 禁止访问 | 用户角色权限不足 |
| 404 | `NotFoundException` | 资源不存在 | 鲸鱼 ID 不存在、观测站不存在 |
| 409 | `ConflictException` | 资源冲突 | 重复的观测记录、唯一约束冲突 |
| 422 | `UnprocessableEntityException` | 数据验证失败 | 数据格式错误 |
| 500 | `InternalServerErrorException` | 服务器错误 | 数据库连接失败、代码 bug |
| 503 | `ServiceUnavailableException` | 服务不可用 | 外部 API 超时、系统维护 |

---

### 自定义异常响应

**场景:** 需要返回更详细的错误信息时

```typescript
// 自定义错误响应格式
throw new HttpException(
  {
    statusCode: 400,
    message: '观测数据验证失败',
    error: 'ValidationFailed',
    details: [
      { field: 'latitude', message: '必须在 -90 到 90 之间' },
      { field: 'longitude', message: '必须在 -180 到 180 之间' },
      { field: 'timestamp', message: '不能是未来时间' }
    ],
    timestamp: new Date().toISOString(),
    path: '/api/v1/sightings'
  },
  HttpStatus.BAD_REQUEST
);
```

---

### 最佳实践

**✅ 推荐:**

1. **统一错误格式** - 所有错误响应保持相同结构，便于前端处理
2. **使用语义化异常** - 选择正确的异常类型 (NotFoundException vs BadRequestException)
3. **提供有意义的错误消息** - 避免暴露敏感信息，但要有足够信息用于排查
4. **记录详细日志** - 在过滤器中记录完整错误堆栈用于排查
5. **兜底保护** - AllExceptionsFilter 确保没有异常会直接暴露给用户

**❌ 避免:**

1. **直接抛出原始错误** - 不要返回数据库错误、堆栈跟踪等敏感信息
2. **模糊的错误消息** - 避免只返回"出错了"，要说明具体原因
3. **在过滤器中处理业务逻辑** - 过滤器只负责格式化，业务验证应在控制器/服务层
4. **忘记注册 AllExceptionsFilter** - 未捕获的异常会导致服务器崩溃

---

### 与前端集成

**前端错误处理示例 (TypeScript):**

```typescript
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

async function handleApiError(response: Response) {
  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    
    switch (error.statusCode) {
      case 400:
        // 显示表单验证错误
        showValidationErrors(error.details);
        break;
      case 401:
        // 跳转到登录页
        redirectToLogin();
        break;
      case 403:
        // 显示权限不足提示
        showPermissionDenied();
        break;
      case 404:
        // 显示资源不存在
        showNotFound(error.message);
        break;
      default:
        // 显示通用错误
        showError(error.message);
    }
  }
}
```

---

### 📁 Guards (路由守卫)

✅ 已实现:

- `JwtAuthGuard` - JWT 认证守卫 (支持 @Public() 装饰器跳过认证)
- `RolesGuard` - RBAC 角色权限守卫 (配合 @Roles() 装饰器使用)
- `index.ts` - 统一导出 (推荐使用 `import { JwtAuthGuard, RolesGuard } from '@/common/guards'`)

待实现:

- (无)

---

### 🛡️ Guards 详细用法

#### 1. JwtAuthGuard - JWT 认证守卫

**功能:** 保护需要登录的路由，自动验证 JWT Token 并注入用户信息到请求对象。

**特性:**
- ✅ 自动验证 JWT Token 有效性
- ✅ 支持 `@Public()` 装饰器跳过特定路由的认证
- ✅ 认证通过后自动将用户信息注入 `request.user`
- ✅ 配合 Passport JWT Strategy 使用

**基本用法:**

```typescript
// 全局注册 (推荐) - main.ts
import { JwtAuthGuard } from '@/common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局启用 JWT 认证 (所有路由默认需要认证)
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  await app.listen(3000);
}
```

```typescript
// 控制器中使用 - 默认需要认证
@Controller('users')
export class UsersController {
  // ✅ 需要认证 (因为全局注册了 JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return { userId: user.id, email: user.email };
  }
  
  // ✅ 公开路由 (跳过认证)
  @Public()
  @Get('public-info')
  getPublicInfo() {
    return { message: '无需认证即可访问' };
  }
}
```

```typescript
// 或者局部使用 (不全局注册时)
@Controller('posts')
export class PostsController {
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create({ ...dto, authorId: user.id });
  }
  
  // 公开路由
  @Public()
  @Get()
  findAll() {
    return this.postsService.findAll();
  }
}
```

**认证流程:**

```
请求 → JwtAuthGuard 检查
       ↓
   有 @Public()?
       ↓ 是
   ✅ 允许访问 (跳过认证)
       ↓ 否
   检查 Authorization Header
       ↓
   验证 JWT Token
       ↓ 有效
   注入 user 到 request.user → 允许访问
       ↓ 无效/缺失
   ❌ 返回 401 Unauthorized
```

**错误响应示例:**

```json
// Token 缺失
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-03-30T01:15:00.000Z",
  "path": "/api/users/profile"
}

// Token 无效/过期
{
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-03-30T01:15:00.000Z",
  "path": "/api/users/profile"
}
```

---

#### 2. RolesGuard - RBAC 角色权限守卫

**功能:** 基于角色的访问控制 (RBAC)，检查用户是否拥有访问路由所需的角色权限。

**特性:**
- ✅ 配合 `@Roles()` 装饰器使用
- ✅ 支持单角色或多角色权限检查
- ✅ 必须在 `JwtAuthGuard` 之后执行 (先认证，再授权)
- ✅ 支持 UserRole 枚举类型

**角色枚举 (UserRole):**

```typescript
enum UserRole {
  USER = 'user',           // 普通用户
  ADMIN = 'admin',         // 管理员
  SUPER_ADMIN = 'super_admin'  // 超级管理员
}
```

**基本用法:**

```typescript
// 全局注册 - main.ts
import { JwtAuthGuard, RolesGuard } from '@/common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  
  // 注册顺序很重要：先认证守卫，再授权守卫
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector)
  );
  
  await app.listen(3000);
}
```

```typescript
// 控制器中使用
@Controller('admin')
export class AdminController {
  // ✅ 仅管理员可访问
  @Roles(UserRole.ADMIN)
  @Get('users')
  getAllUsers() {
    return this.userService.findAll();
  }
  
  // ✅ 仅超级管理员可访问
  @Roles(UserRole.SUPER_ADMIN)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.remove(id);
  }
  
  // ✅ 管理员或超级管理员都可访问 (多角色)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
  
  // ✅ 所有登录用户都可访问 (无角色限制)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

**权限检查流程:**

```
请求 → JwtAuthGuard (认证)
       ↓ 通过
   RolesGuard 检查
       ↓
   路由有 @Roles()?
       ↓ 否
   ✅ 允许访问 (无角色限制)
       ↓ 是
   获取用户角色 (request.user.role)
       ↓
   用户角色在允许列表中?
       ↓ 是
   ✅ 允许访问
       ↓ 否
   ❌ 返回 403 Forbidden
```

**错误响应示例:**

```json
// 用户角色权限不足
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required roles: admin, super_admin",
  "timestamp": "2026-03-30T01:15:00.000Z",
  "path": "/api/admin/users"
}
```

---

### 🔐 认证与授权组合使用

**典型场景:**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Public, Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/auth/entities/user.entity';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  // ✅ 公开：所有人可读
  @Public()
  @Get()
  findAll() {
    return this.articlesService.findAll();
  }

  // ✅ 公开：单篇详情可读
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  // 🔒 认证：登录用户可创建
  @Post()
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: User,
  ) {
    return this.articlesService.create({ ...dto, authorId: user.id });
  }

  // 🔒 认证 + 角色：仅作者可编辑自己的文章
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: User,
  ) {
    // 在 Service 层检查作者权限
    return this.articlesService.update(id, dto, user.id);
  }

  // 🔒 管理员：仅管理员可删除任意文章
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  // 🔒 超级管理员：仅超级管理员可管理审核状态
  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.articlesService.updateStatus(id, dto);
  }
}
```

---

### 📋 守卫注册方式对比

| 注册方式 | 代码示例 | 适用场景 |
|---------|---------|---------|
| **全局注册** | `app.useGlobalGuards(new JwtAuthGuard())` | 大多数路由需要认证 (推荐) |
| **控制器级** | `@UseGuards(JwtAuthGuard)` on controller class | 整个控制器需要统一保护 |
| **路由级** | `@UseGuards(JwtAuthGuard)` on method | 仅特定路由需要保护 |
| **组合使用** | `@UseGuards(JwtAuthGuard, RolesGuard)` | 认证 + 授权同时需要 |

---

### ⚠️ 注意事项与最佳实践

**1. 守卫执行顺序:**

```typescript
// ✅ 正确：先认证，再授权
app.useGlobalGuards(
  new JwtAuthGuard(reflector),  // 第一层：验证身份
  new RolesGuard(reflector)     // 第二层：检查权限
);

// ❌ 错误：顺序颠倒会导致 RolesGuard 拿不到 user 信息
app.useGlobalGuards(
  new RolesGuard(reflector),    // ❌ 此时 request.user 还未注入
  new JwtAuthGuard(reflector)
);
```

**2. @Public() 使用注意:**

```typescript
// ✅ 正确：@Public() 必须在路由方法上
@Public()
@Get('public')
getPublic() { ... }

// ❌ 错误：@Public() 放在 UseGuards 装饰器上无效
@UseGuards(JwtAuthGuard)
@Public()  // ❌ 无效
@Get('wrong')
getWrong() { ... }
```

**3. 角色权限设计建议:**

```typescript
// ✅ 推荐：使用枚举定义角色
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// ✅ 推荐：角色层级清晰
// USER: 基础功能 (创建/编辑自己的内容)
// ADMIN: 管理功能 (管理用户/内容审核)
// SUPER_ADMIN: 系统功能 (系统配置/权限管理)

// ❌ 避免：硬编码字符串
@Roles('admin')  // ❌ 容易拼写错误，难以维护
```

**4. 自定义权限检查:**

```typescript
// 对于复杂权限逻辑，在 Service 层处理
@Injectable()
export class ArticlesService {
  async update(id: string, dto: UpdateDto, currentUserId: string) {
    const article = await this.findOne(id);
    
    // 检查是否为作者或管理员
    if (article.authorId !== currentUserId) {
      const user = await this.userService.findById(currentUserId);
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('只能编辑自己的文章');
      }
    }
    
    return this.repo.update(id, dto);
  }
}
```

---

### 🔍 调试技巧

**1. 查看守卫执行日志:**

```typescript
// 在守卫中添加日志
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    console.log('RolesGuard check:', {
      path: request.url,
      user: request.user?.email,
      userRole: request.user?.role,
      requiredRoles,
    });
    
    // ... 权限检查逻辑
  }
}
```

**2. 测试认证流程:**

```bash
# 测试公开路由 (无需 Token)
curl http://localhost:3000/api/articles/public

# 测试需要认证的路由 (无 Token)
curl http://localhost:3000/api/users/profile
# 预期：401 Unauthorized

# 测试需要认证的路由 (有效 Token)
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/api/users/profile
# 预期：200 OK + 用户信息

# 测试需要角色的路由 (权限不足)
curl -H "Authorization: Bearer <user-token>" \
     http://localhost:3000/api/admin/users
# 预期：403 Forbidden

# 测试需要角色的路由 (权限充足)
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3000/api/admin/users
# 预期：200 OK + 用户列表
```

---

### 📊 守卫快速参考

| 守卫 | 功能 | 配合装饰器 | 常见状态码 |
|-----|------|-----------|-----------|
| `JwtAuthGuard` | JWT 认证 | `@Public()` 跳过认证 | 401 Unauthorized |
| `RolesGuard` | RBAC 角色权限 | `@Roles(...)` 指定角色 | 403 Forbidden |

**典型响应:**

| 场景 | 状态码 | 说明 |
|-----|-------|------|
| Token 缺失 | 401 | 需要登录 |
| Token 无效/过期 | 401 | 重新登录 |
| 角色权限不足 | 403 | 权限不够 |
| 认证通过 | 200 | 正常访问 |

---

### 📁 Interceptors (拦截器)

✅ 已实现:

- `TransformInterceptor` - 统一响应格式封装
- `LoggingInterceptor` - 请求日志记录
- `CacheInterceptor` - 响应缓存 (支持自定义缓存键和 TTL)
- `TimeoutInterceptor` - 请求超时控制 (防止慢查询阻塞资源)
- `RateLimitInterceptor` - 请求速率限制 (防止 API 滥用和 DDoS)
- `ETagInterceptor` - HTTP 条件请求支持 (基于 ETag 的客户端缓存验证)

### 📁 Interceptors (拦截器) - 详细用法

**CacheInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@/common/interceptors';

// 基础用法 - 默认 5 分钟缓存
@UseInterceptors(CacheInterceptor)
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 自定义缓存时间 - 1 小时
@UseInterceptors(CacheInterceptor)
@CacheTTL(3600)
@Get('statistics')
getStatistics() {
  return this.statsService.getStatistics();
}

// 自定义缓存键
@UseInterceptors(CacheInterceptor)
@CacheKey('home-page-data')
@Get('home')
getHomeData() {
  return this.homeService.getData();
}
```

**缓存装饰器:**

| 装饰器 | 说明 | 参数 |
|--------|------|------|
| `@CacheKey(key)` | 自定义缓存键 | `key: string` - 缓存键名 |
| `@CacheTTL(ttl)` | 自定义缓存时间 | `ttl: number` - 缓存时间 (秒) |

**响应头:**

- `X-Cache: HIT` - 缓存命中
- `X-Cache: MISS` - 缓存未命中

**缓存管理:**

```typescript
// 在 Service 中注入 CacheInterceptor
constructor(private cacheInterceptor: CacheInterceptor) {}

// 清除指定缓存
this.cacheInterceptor.clearCache('home-page-data');

// 清除所有缓存
this.cacheInterceptor.clearAllCache();

// 获取缓存统计
const stats = this.cacheInterceptor.getCacheStats();
console.log(stats); // { size: 5, keys: ['cache:/api/v1/...', ...] }
```

### 🔄 缓存失效最佳实践

**何时清除缓存:**

| 操作类型 | 需要清除的缓存 |
|----------|----------------|
| 创建资源 | 列表页缓存 (如 `cache:/api/v1/whales`) |
| 更新资源 | 详情缓存 + 列表缓存 |
| 删除资源 | 详情缓存 + 列表缓存 |
| 批量操作 | 相关列表缓存 |

**Service 示例:**

```typescript
@Injectable()
export class WhalesService {
  constructor(
    private prisma: PrismaService,
    private cacheInterceptor: CacheInterceptor,
  ) {}

  // 创建鲸鱼个体 - 清除列表缓存
  async create(createWhaleDto: CreateWhaleDto) {
    const result = await this.prisma.whale.create({ data: createWhaleDto });
    
    // 清除列表缓存
    this.cacheInterceptor.clearCache('cache:/api/v1/whales');
    
    return result;
  }

  // 更新鲸鱼个体 - 清除详情 + 列表缓存
  async update(id: string, updateWhaleDto: UpdateWhaleDto) {
    const result = await this.prisma.whale.update({
      where: { id },
      data: updateWhaleDto,
    });
    
    // 清除详情缓存和列表缓存
    this.cacheInterceptor.clearCache(`cache:/api/v1/whales/${id}`);
    this.cacheInterceptor.clearCache('cache:/api/v1/whales');
    
    return result;
  }

  // 删除鲸鱼个体 - 清除详情 + 列表缓存
  async remove(id: string) {
    await this.prisma.whale.delete({ where: { id } });
    
    // 清除详情缓存和列表缓存
    this.cacheInterceptor.clearCache(`cache:/api/v1/whales/${id}`);
    this.cacheInterceptor.clearCache('cache:/api/v1/whales');
  }
}
```

**注意事项:**

1. ⚠️ **缓存键匹配** - 确保清除缓存时使用的键与实际缓存键完全一致
2. ⚠️ **顺序问题** - 先执行数据库操作，再清除缓存
3. ✅ **乐观策略** - 如果缓存清除失败，不影响主流程
4. ✅ **日志记录** - 建议在清除缓存时添加日志便于调试

### 📁 Interceptors (拦截器) - TimeoutInterceptor

**TimeoutInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { TimeoutInterceptor, Timeout } from '@/common/interceptors';

// 基础用法 - 默认 30 秒超时
@UseInterceptors(TimeoutInterceptor)
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 自定义超时时间 - 60 秒 (适用于复杂查询)
@UseInterceptors(TimeoutInterceptor)
@Timeout(60000)
@Get('analytics/yearly')
getYearlyAnalytics() {
  return this.analyticsService.getYearlyReport();
}

// 快速接口 - 5 秒超时 (健康检查等)
@UseInterceptors(TimeoutInterceptor)
@Timeout(5000)
@Get('health')
healthCheck() {
  return this.healthService.check();
}
```

**超时时间建议:**

| 接口类型 | 建议超时 | 说明 |
|----------|----------|------|
| 简单查询 | 5-10 秒 | 单表查询、缓存命中 |
| 常规 API | 30 秒 | 默认值，适用于大多数场景 |
| 复杂统计 | 60 秒 | 多表关联、聚合计算 |
| 数据导出 | 120 秒 | 大数据量导出 (建议改用异步任务) |
| 健康检查 | 5 秒 | 快速失败，便于监控 |

**注意事项:**

1. ⚠️ **超时异常** - 超时后抛出 `RequestTimeoutException` (HTTP 408)
2. ⚠️ **数据库查询** - 超时不会取消数据库查询，仅中断响应 (建议在数据库层也设置查询超时)
3. ✅ **异步任务** - 长时间运行的任务建议使用异步队列 (Bull/Agenda) + 轮询/回调
4. ✅ **监控告警** - 频繁超时可能意味着需要优化查询或增加资源

**与 CacheInterceptor 配合使用:**

```typescript
// 缓存 + 超时组合 - 最佳实践
@UseInterceptors(CacheInterceptor, TimeoutInterceptor)
@CacheTTL(300)  // 缓存 5 分钟
@Timeout(30000) // 超时 30 秒
@Get('statistics')
getStatistics() {
  return this.statsService.getStatistics();
}
```

### 📁 Interceptors (拦截器) - RateLimitInterceptor

**RateLimitInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { RateLimitInterceptor, RateLimit, RateLimitTTL } from '@/common/interceptors';

// 基础用法 - 默认 100 次/分钟
@UseInterceptors(RateLimitInterceptor)
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 严格限制 - 登录接口防暴力破解 (10 次/分钟)
@UseInterceptors(RateLimitInterceptor)
@RateLimit(10)
@RateLimitTTL(60)
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// 宽松限制 - 公开数据接口 (1000 次/分钟)
@UseInterceptors(RateLimitInterceptor)
@RateLimit(1000)
@RateLimitTTL(60)
@Get('public/data')
getPublicData() {
  return this.publicService.getData();
}

// 敏感操作 - 注册接口 (5 次/分钟)
@UseInterceptors(RateLimitInterceptor)
@RateLimit(5)
@RateLimitTTL(60)
@Post('register')
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}
```

**速率限制装饰器:**

| 装饰器 | 说明 | 参数 |
|--------|------|------|
| `@RateLimit(limit)` | 设置最大请求次数 | `limit: number` - 时间窗口内最大请求数 |
| `@RateLimitTTL(ttl)` | 设置时间窗口 | `ttl: number` - 时间窗口 (秒) |

**响应头:**

- `Retry-After: <seconds>` - 建议重试时间 (秒)

**错误响应:**

```json
{
  "statusCode": 429,
  "timestamp": "2026-03-28T14:30:00.000Z",
  "path": "/api/v1/auth/login",
  "message": "请求过于频繁，请 45 秒后重试",
  "error": "Too Many Requests",
  "description": "限制：10 次/60 秒"
}
```

**速率限制建议:**

| 接口类型 | 建议限制 | 说明 |
|----------|----------|------|
| 登录/注册 | 5-10 次/分钟 | 防止暴力破解和恶意注册 |
| 密码重置 | 3 次/分钟 | 防止滥用 |
| 敏感操作 | 10 次/分钟 | 删除、修改密码等 |
| 常规 API | 100 次/分钟 | 默认值，适用于大多数场景 |
| 公开数据 | 500-1000 次/分钟 | 物种列表、观测数据等 |
| 文件下载 | 20 次/分钟 | 防止带宽滥用 |

**注意事项:**

1. ⚠️ **内存存储** - 当前使用内存存储，重启后清空，多机部署需改用 Redis
2. ⚠️ **IP 识别** - 支持 `X-Forwarded-For` 和 `X-Real-IP`，确保反向代理正确配置
3. ✅ **按路由区分** - 不同路由独立计数，`METHOD:URL` 作为键
4. ✅ **自动清理** - 每分钟自动清理过期记录，防止内存泄漏

**与 CacheInterceptor 配合使用:**

```typescript
// 速率限制 + 缓存组合 - 高并发场景最佳实践
@UseInterceptors(RateLimitInterceptor, CacheInterceptor)
@RateLimit(500)     // 500 次/分钟
@RateLimitTTL(60)
@CacheTTL(300)      // 缓存 5 分钟
@Get('public/species')
getPublicSpecies() {
  return this.speciesService.findAll();
}
```

**监控和管理:**

```typescript
// 在 Service 中注入 RateLimitInterceptor
constructor(private rateLimitInterceptor: RateLimitInterceptor) {}

// 清除指定客户端的限制记录 (如 VIP 用户白名单)
this.rateLimitInterceptor.clearClient('192.168.1.100');

// 清除所有记录 (如系统维护后)
this.rateLimitInterceptor.clearAll();

// 获取统计信息 (用于监控)
const stats = this.rateLimitInterceptor.getStats();
console.log(`当前活跃客户端：${stats.totalKeys}`);
```

### 📁 Interceptors (拦截器) - ETagInterceptor

**ETagInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { ETagInterceptor, ETag } from '@/common/interceptors';

// 基础用法 - 强验证 ETag
@UseInterceptors(ETagInterceptor)
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 弱验证 ETag - 适用于语义相同但字节不同的响应
@UseInterceptors(ETagInterceptor)
@ETag(true)  // 启用弱验证
@Get('species/:id')
findOneSpecies(@Param('id') id: string) {
  return this.speciesService.findOne(id);
}
```

**工作原理:**

1. **首次请求** - 服务器生成 ETag 并返回，客户端缓存响应和 ETag
2. **后续请求** - 客户端发送 `If-None-Match: <etag>` 头
3. **内容未变** - 服务器返回 `304 Not Modified` (无响应体，节省带宽)
4. **内容已变** - 服务器返回 `200 OK` + 新响应体 + 新 ETag

**响应头:**

- `ETag: "<hash>"` - 强验证 ETag (字节级精确匹配)
- `ETag: W/"<hash>"` - 弱验证 ETag (语义级匹配)
- `Vary: If-None-Match` - 告知缓存服务器根据 If-None-Match 区分缓存

**HTTP 条件请求示例:**

```bash
# 首次请求
$ curl -i https://api.example.com/api/v1/species
HTTP/1.1 200 OK
ETag: "a1b2c3d4e5f6g7h8"
Content-Type: application/json

[...]

# 后续请求 (内容未变)
$ curl -i -H 'If-None-Match: "a1b2c3d4e5f6g7h8"' https://api.example.com/api/v1/species
HTTP/1.1 304 Not Modified
ETag: "a1b2c3d4e5f6g7h8"

# (无响应体)

# 后续请求 (内容已变)
$ curl -i -H 'If-None-Match: "old-etag-value"' https://api.example.com/api/v1/species
HTTP/1.1 200 OK
ETag: "new-etag-value"
Content-Type: application/json

[新响应体]
```

**强验证 vs 弱验证:**

| 类型 | 格式 | 适用场景 | 说明 |
|------|------|----------|------|
| 强验证 | `"abc123"` | API 响应、精确数据 | 字节级精确匹配，响应体必须完全相同 |
| 弱验证 | `W/"abc123"` | HTML 页面、动态内容 | 语义级匹配，允许细微差异 (如时间戳) |

**适用场景:**

- ✅ **物种列表查询** - 数据变化频率低，客户端可长期缓存
- ✅ **监测站点数据** - 读多写少，减少重复传输
- ✅ **统计分析接口** - 计算开销大，304 响应节省服务器资源
- ✅ **配置文件/元数据** - 几乎不变，适合条件请求
- ❌ **实时数据** - 每秒变化的数据 (如实时位置追踪)
- ❌ **用户个性化内容** - 每个用户不同的响应

**与 CacheInterceptor 配合使用:**

```typescript
// 服务器缓存 + 客户端条件请求 - 双重缓存优化
@UseInterceptors(CacheInterceptor, ETagInterceptor)
@CacheTTL(300)  // 服务器缓存 5 分钟
@Get('statistics')
getStatistics() {
  return this.statsService.getStatistics();
}
```

**优势:**

1. 📉 **减少带宽** - 304 响应无响应体，显著减少数据传输
2. ⚡ **降低延迟** - 客户端可直接使用本地缓存，无需等待完整响应
3. 💾 **减轻服务器负载** - 304 响应处理开销远小于完整响应
4. 🔄 **自动失效** - 内容变化时自动返回新数据，无需手动管理缓存

**注意事项:**

1. ⚠️ **仅支持 GET/HEAD** - ETag 只对安全方法生效
2. ⚠️ **客户端支持** - 需要客户端正确发送 If-None-Match 头
3. ✅ **CDN 友好** - 标准 HTTP 机制，CDN 和代理服务器天然支持
4. ✅ **无状态** - 服务器无需维护缓存状态，ETag 从响应体生成

---

### 📁 Interceptors (拦截器) - TransformInterceptor

**TransformInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from '@/common/interceptors';

// 基础用法 - 全局注册 (推荐)
// main.ts
app.useGlobalInterceptors(new TransformInterceptor());

// 或者针对特定路由使用
@UseInterceptors(TransformInterceptor)
@Get('whales')
findAllWhales() {
  return this.whalesService.findAll();
}
```

**统一响应格式:**

TransformInterceptor 将所有成功响应封装为标准格式：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-03-30T05:30:00.000Z",
  "path": "/api/v1/whales"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | `boolean` | 操作是否成功 |
| `data` | `any` | 实际响应数据 |
| `message` | `string` | 成功消息 (默认"操作成功") |
| `timestamp` | `string` | 响应时间戳 (ISO 8601) |
| `path` | `string` | 请求路径 |

**自定义响应消息:**

```typescript
// 在 Controller 中返回自定义消息
@Post('whales')
@UseInterceptors(TransformInterceptor)
createWhale(@Body() createWhaleDto: CreateWhaleDto) {
  const whale = await this.whalesService.create(createWhaleDto);
  
  // 返回对象包含 message 字段时会覆盖默认消息
  return {
    data: whale,
    message: '鲸鱼个体创建成功',
  };
}
```

**与分页数据配合使用:**

```typescript
@Get('whales')
@UseInterceptors(TransformInterceptor)
findAllWhales(
  @Query(new PaginationPipe()) pagination: PaginationResult,
) {
  const { data, total } = await this.whalesService.findAll(pagination);
  
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
    message: `查询成功，共 ${total} 条记录`,
  };
}
```

**响应示例:**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "identifier": "BCX001",
      "name": "大白",
      "species": "座头鲸"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "totalPages": 16
  },
  "message": "查询成功，共 156 条记录",
  "timestamp": "2026-03-30T05:30:00.000Z",
  "path": "/api/v1/whales"
}
```

**优势:**

1. 📋 **统一格式** - 所有 API 响应保持一致的结构，便于前端处理
2. 🔍 **调试友好** - 包含时间戳和路径，便于日志追踪和问题排查
3. ✅ **明确状态** - `success` 字段让前端快速判断操作结果
4. 📝 **用户提示** - `message` 字段可直接用于用户提示

**与其他拦截器配合使用:**

```typescript
// 推荐拦截器注册顺序 (main.ts)
app.useGlobalInterceptors(
  new LoggingInterceptor(),      // 1. 日志记录 (最先执行)
  new TransformInterceptor(),    // 2. 响应转换 (封装数据)
  new CacheInterceptor(),        // 3. 缓存 (可缓存转换后的响应)
);
```

**注意事项:**

1. ⚠️ **全局注册** - 建议在 `main.ts` 中全局注册，避免遗漏
2. ⚠️ **异常处理** - 异常响应由 `HttpExceptionFilter` 处理，不受 TransformInterceptor 影响
3. ✅ **灵活覆盖** - Controller 可返回包含 `message` 的对象来自定义成功消息
4. ✅ **嵌套数据** - `data` 字段可以是任意结构 (对象/数组/基本类型)

**与异常过滤器的配合:**

```typescript
// main.ts - 完整的拦截器和过滤器配置
import { TransformInterceptor, LoggingInterceptor, CacheInterceptor } from '@/common/interceptors';
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局拦截器 (成功响应)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new CacheInterceptor(),
  );
  
  // 全局过滤器 (异常响应)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
  );
  
  await app.listen(3000);
}
```

**成功响应 vs 异常响应:**

```json
// ✅ 成功响应 (TransformInterceptor)
{
  "success": true,
  "data": { "id": "123", "name": "大白" },
  "message": "操作成功",
  "timestamp": "2026-03-30T05:30:00.000Z",
  "path": "/api/v1/whales/123"
}

// ❌ 异常响应 (HttpExceptionFilter)
{
  "statusCode": 404,
  "timestamp": "2026-03-30T05:30:00.000Z",
  "path": "/api/v1/whales/999",
  "message": "鲸鱼个体不存在",
  "error": "Not Found"
}
```

---

### 📁 Interceptors (拦截器) - LoggingInterceptor

**LoggingInterceptor 使用示例:**

```typescript
import { UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@/common/interceptors';

// 基础用法 - 全局注册 (推荐)
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());

// 或者针对特定路由使用
@UseInterceptors(LoggingInterceptor)
@Get('whales')
findAllWhales() {
  return this.whalesService.findAll();
}
```

**功能说明:**

LoggingInterceptor 记录每个 HTTP 请求的处理时间和基本信息，便于性能监控和问题排查。

**日志输出格式:**

```
[HTTP] HTTP method URL status_code - processing_time_ms
```

**示例日志:**

```
[HTTP] GET /api/v1/species 200 - 45ms
[HTTP] POST /api/v1/whales 201 - 128ms
[HTTP] GET /api/v1/whales/999 404 - 12ms
[HTTP] DELETE /api/v1/whales/123 500 - 203ms
```

**日志字段说明:**

| 字段 | 说明 | 示例 |
|------|------|------|
| `method` | HTTP 方法 | `GET`, `POST`, `PUT`, `DELETE`, `PATCH` |
| `url` | 请求路径 | `/api/v1/whales`, `/api/v1/species/123` |
| `status_code` | HTTP 状态码 | `200`, `201`, `400`, `404`, `500` |
| `processing_time` | 请求处理时间 (毫秒) | `45ms`, `128ms`, `203ms` |

**推荐拦截器注册顺序:**

```typescript
// main.ts - 拦截器执行顺序很重要
app.useGlobalInterceptors(
  new LoggingInterceptor(),      // 1. 日志记录 (最先执行，记录完整处理时间)
  new TransformInterceptor(),    // 2. 响应转换 (封装数据)
  new CacheInterceptor(),        // 3. 缓存 (可缓存转换后的响应)
  new ETagInterceptor(),         // 4. ETag (添加条件请求支持)
);
```

**执行顺序说明:**

1. **LoggingInterceptor** 应该最先执行，这样它可以记录从请求进入到响应完成的完整处理时间
2. 其他拦截器在 LoggingInterceptor 之后执行，它们的处理时间也会被计入总时间
3. 日志在响应发送之前记录 (通过 RxJS `tap` 操作符)

**与 NestJS 内置日志集成:**

LoggingInterceptor 使用 NestJS 的 `Logger` 类，支持以下功能:

```typescript
// 自定义日志上下文
private readonly logger = new Logger('HTTP');

// 日志级别
this.logger.log('消息');     // [HTTP] 消息
this.logger.error('错误');   // [HTTP] 错误
this.logger.warn('警告');    // [HTTP] 警告
this.logger.debug('调试');   // [HTTP] 调试 (需要启用 debug 级别)
this.logger.verbose('详细'); // [HTTP] 详细 (需要启用 verbose 级别)
```

**配置日志级别:**

```bash
# 通过环境变量控制日志级别
export LOG_LEVEL=debug  # 显示 debug 及以上级别日志
export LOG_LEVEL=error  # 只显示 error 级别日志
```

**在 Docker 中使用:**

```yaml
# docker-compose.yml
services:
  api:
    environment:
      - LOG_LEVEL=debug  # 开发环境启用详细日志
    # 生产环境建议设置为 info 或 warn
```

**日志输出到文件:**

```typescript
// main.ts - 配置日志输出
import { Logger } from '@nestjs/common';
import { LoggingInterceptor } from '@/common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 使用 Winston 或其他日志库替换默认 Logger
  // const logger = new WinstonLogger();
  // Logger.overrideLogger(logger);
  
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  await app.listen(3000);
}
```

**适用场景:**

- ✅ **性能监控** - 识别慢查询和性能瓶颈
- ✅ **问题排查** - 追踪请求处理流程和时间
- ✅ **访问日志** - 记录所有 HTTP 请求的基本信息
- ✅ **审计日志** - 配合其他日志系统实现完整的审计追踪
- ✅ **开发调试** - 快速查看请求处理情况

**最佳实践:**

1. 📊 **配合 APM 工具** - 将日志输出到 ELK、Datadog、New Relic 等监控系统
2. 📝 **结构化日志** - 生产环境使用 JSON 格式日志便于解析
3. 🔍 **添加请求 ID** - 配合 correlation ID 实现跨服务追踪
4. ⚡ **异步日志** - 高并发场景使用异步日志避免阻塞
5. 📈 **指标收集** - 从日志中提取指标 (平均响应时间、错误率等)

**扩展建议:**

```typescript
// 扩展 LoggingInterceptor 添加更多上下文
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'];
    const ip = request.ip;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const processingTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        this.logger.log(
          `${method} ${url} ${statusCode} - ${processingTime}ms - IP: ${ip}`,
        );
        
        // 慢查询警告
        if (processingTime > 1000) {
          this.logger.warn(`Slow request: ${method} ${url} - ${processingTime}ms`);
        }
      }),
    );
  }
}
```

**注意事项:**

1. ⚠️ **性能开销** - 日志记录有轻微性能开销，生产环境建议使用异步日志
2. ⚠️ **日志量** - 高并发场景日志量可能很大，建议配置日志轮转
3. ✅ **敏感信息** - 避免在日志中记录敏感数据 (密码、token 等)
4. ✅ **日志级别** - 生产环境使用 `info` 或 `warn`，开发环境使用 `debug`

---

### 📁 Pipes (验证管道)

✅ 已实现:

- `ParseIntPipe` - 必填整数解析管道 (支持范围验证)
- `ParseFloatPipe` - 必填浮点数解析管道 (支持范围验证、精度控制)
- `ParseStringPipe` - 必填字符串解析管道 (支持修剪、长度验证、正则匹配、大小写转换)
- `ParseOptionalIntPipe` - 可选整数解析管道 (支持默认值、范围验证)
- `ParseOptionalFloatPipe` - 可选浮点数解析管道 (支持默认值、范围验证、精度控制)
- `ParseOptionalBooleanPipe` - 可选布尔值解析管道 (支持多种格式)
- `ParseOptionalDatePipe` - 可选日期解析管道 (支持默认值、日期范围验证)
- `ParseOptionalStringPipe` - 可选字符串解析管道 (支持修剪、长度验证、正则匹配、大小写转换)
- `ParseEnumPipe` - 枚举值解析管道 (支持枚举类型验证、默认值、必填校验)
- `PaginationPipe` - 分页参数解析管道 (统一处理 page/limit，自动计算 offset)
- `ParseISO8601Pipe` - 必填 ISO 8601 日期解析管道 (支持范围验证)
- `ParseUUIDPipe` - UUID 格式验证管道 (支持版本验证、必填/可选模式)
- `ParseBooleanPipe` - 必填布尔值解析管道 (支持多种格式：true/false/1/0/yes/no/on/off)
- `ParseEmailPipe` - 邮箱格式验证管道 (支持必填/可选模式、自动转小写)
- `ParsePhonePipe` - 手机号格式验证管道 (支持中国大陆手机号、国际格式选项)
- `ParseDatePipe` - 必填日期解析管道 (YYYY-MM-DD 格式，支持日期范围验证)
- `ParseUrlPipe` - URL 格式验证管道 (支持协议验证、必填/可选模式)
- `ParseCoordinatePipe` - GPS 坐标解析管道 (纬度/经度范围验证)
- `ParseCoordinatePairPipe` - 坐标对解析管道 (同时验证纬度和经度)
- `ParseArrayPipe` - 数组解析管道 (逗号分隔字符串转数组，支持类型转换和枚举验证)

**使用示例:**

```typescript
import { ParseOptionalIntPipe, ParseOptionalBooleanPipe } from '@/common/pipes';

// 分页参数 - 默认值为 1，最小值为 1
@Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 }))
page: number;

// 每页数量 - 默认值为 20，范围 1-100
@Query('pageSize', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 }))
pageSize: number;

// 布尔过滤参数 - 默认值为 false
@Query('active', new ParseOptionalBooleanPipe({ defaultValue: false }))
active: boolean;

// 验证状态 - 支持 true/false, 1/0, yes/no, on/off
@Query('verified', new ParseOptionalBooleanPipe())
verified: boolean | undefined;

// 日期范围查询 - 观测日期筛选
@Query('startDate', new ParseOptionalDatePipe())
startDate?: Date;

@Query('endDate', new ParseOptionalDatePipe())
endDate?: Date;

// 带默认值 - 默认查询最近 30 天
@Query('fromDate', new ParseOptionalDatePipe({ 
  defaultValue: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
}))
fromDate: Date;

// 带范围验证 - 日期不能早于项目启动时间，不能晚于今天
@Query('observationDate', new ParseOptionalDatePipe({
  min: new Date('2024-01-01'),
  max: new Date()
}))
observationDate?: Date;
```

**ParseOptionalStringPipe 使用示例:**

```typescript
import { ParseOptionalStringPipe } from '@/common/pipes';

// 搜索关键词 - 自动修剪，最大长度 50
@Query('keyword', new ParseOptionalStringPipe({ maxLength: 50, trim: true }))
keyword?: string;

// 鲸鱼名称 - 最小 2 字符，最大 100 字符
@Query('name', new ParseOptionalStringPipe({ minLength: 2, maxLength: 100 }))
name?: string;

// 邮箱格式验证
@Query('email', new ParseOptionalStringPipe({ 
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  patternMessage: '请输入有效的邮箱地址'
}))
email?: string;

// 状态码 - 转为小写，支持默认值
@Query('status', new ParseOptionalStringPipe({ 
  defaultValue: 'active',
  toLowerCase: true 
}))
status: string;

// 国家代码 - 转大写，固定 2 字符
@Query('countryCode', new ParseOptionalStringPipe({ 
  minLength: 2,
  maxLength: 2,
  toUpperCase: true 
}))
countryCode?: string;
```

**ParseEnumPipe 使用示例:**

```typescript
import { ParseEnumPipe } from '@/common/pipes';
import { Sex, LifeStatus } from '@/whales/entities/whale.entity';
import { IUCNStatus } from '@/species/entities/species.entity';

// 性别筛选 - 支持 M/F/U
@Query('sex', new ParseEnumPipe({ enumType: Sex }))
sex?: Sex;

// 生命状态筛选 - 支持默认值
@Query('status', new ParseEnumPipe({ 
  enumType: LifeStatus,
  defaultValue: LifeStatus.ALIVE 
}))
status: LifeStatus;

// IUCN 保护等级筛选 - 必填参数
@Query('iucnStatus', new ParseEnumPipe({ 
  enumType: IUCNStatus,
  required: true 
}))
iucnStatus: IUCNStatus;

// 组合使用 - 分页 + 枚举筛选
@Get('whales')
findAll(
  @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
  @Query('pageSize', new ParseOptionalIntPipe({ defaultValue: 20, min: 1, max: 100 })) pageSize: number,
  @Query('sex', new ParseEnumPipe({ enumType: Sex })) sex?: Sex,
  @Query('status', new ParseEnumPipe({ enumType: LifeStatus })) status?: LifeStatus,
) {
  return this.whalesService.findAll({ page, pageSize, sex, status });
}
```

**选项说明:**

| 选项 | 类型 | 说明 |
|------|------|------|
| `defaultValue` | `number \| boolean \| Date \| string` | 当参数为空时的默认值 |
| `min` | `number \| Date` | 最小值限制 (整数/浮点数/日期管道) |
| `max` | `number \| Date` | 最大值限制 (整数/浮点数/日期管道) |
| `precision` | `number` | 小数位数精度 (仅浮点数管道) |
| `minLength` | `number` | 最小长度 (仅字符串管道) |
| `maxLength` | `number` | 最大长度 (仅字符串管道) |
| `pattern` | `RegExp` | 正则表达式匹配 (仅字符串管道) |
| `patternMessage` | `string` | 正则匹配失败的错误消息 |
| `trim` | `boolean` | 自动修剪首尾空格 (默认 true) |
| `toLowerCase` | `boolean` | 转为小写 |
| `toUpperCase` | `boolean` | 转为大写 |

**ParseOptionalBooleanPipe 支持的输入格式:**

| 输入值 | 解析结果 |
|--------|----------|
| `'true'`, `'1'`, `'yes'`, `'on'`, `'y'` | `true` |
| `'false'`, `'0'`, `'no'`, `'off'`, `'n'` | `false` |
| `undefined`, `null`, `''` | 默认值 |
| 其他 | 抛出 BadRequestException |

**PaginationPipe 使用示例:**

```typescript
import { PaginationPipe, type PaginationResult } from '@/common/pipes';

// 基础用法 - 默认 page=1, limit=10
@Get('whales')
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

**ParseISO8601Pipe 使用示例:**

```typescript
import { ParseISO8601Pipe } from '@/common/pipes';

// 必填日期参数 - 基础用法
@Query('startDate', new ParseISO8601Pipe())
startDate: Date;

@Query('endDate', new ParseISO8601Pipe())
endDate: Date;

// 带范围验证 - 日期不能早于项目启动时间
@Query('fromDate', new ParseISO8601Pipe({
  min: new Date('2024-01-01')
}))
fromDate: Date;

// 带范围验证 - 日期不能晚于当前时间
@Query('toDate', new ParseISO8601Pipe({
  max: new Date()
}))
toDate: Date;

// 组合使用 - 时间范围查询
@Get('environment/station/:stationId/range')
findEnvironmentByRange(
  @Param('stationId') stationId: string,
  @Query('startDate', new ParseISO8601Pipe()) startDate: Date,
  @Query('endDate', new ParseISO8601Pipe()) endDate: Date,
  @Query('limit', new ParseOptionalIntPipe({ defaultValue: 100, max: 1000 })) limit: number,
) {
  return this.environmentService.findByDateRange(stationId, startDate, endDate, limit);
}
```

**ParseISO8601Pipe 选项:**

| 选项 | 类型 | 说明 |
|------|------|------|
| `min` | `Date` | 最小日期限制 (早于此日期会抛出异常) |
| `max` | `Date` | 最大日期限制 (晚于此日期会抛出异常) |

**错误响应示例:**

```json
// 缺少必填日期参数
{
  "statusCode": 400,
  "message": "startDate 是必填项，请提供有效的日期 (ISO 8601 格式)",
  "error": "Bad Request"
}

// 日期格式无效
{
  "statusCode": 400,
  "message": "startDate 必须是有效的日期格式 (ISO 8601)",
  "error": "Bad Request"
}

// 日期超出范围
{
  "statusCode": 400,
  "message": "startDate 不能早于 2024-01-01T00:00:00.000Z",
  "error": "Bad Request"
}
```

**与 ParseOptionalDatePipe 的区别:**

| 管道 | 必填/可选 | 默认值 | 使用场景 |
|------|----------|--------|----------|
| `ParseISO8601Pipe` | 必填 | ❌ 不支持 | 时间范围查询的起止日期等必填参数 |
| `ParseOptionalDatePipe` | 可选 | ✅ 支持 | 筛选条件中的可选日期参数 |

**ParseUUIDPipe 使用示例:**

```typescript
import { ParseUUIDPipe } from '@/common/pipes';

// 必填 UUID 参数 - 基础用法 (默认 required: true)
@Param('id', new ParseUUIDPipe())
id: string;

@Param('stationId', new ParseUUIDPipe())
stationId: string;

// 可选 UUID 参数 - 允许 undefined
@Query('whaleId', new ParseUUIDPipe({ required: false }))
whaleId?: string;

// 指定 UUID 版本 - 仅接受 v4 UUID
@Param('userId', new ParseUUIDPipe({ version: 4 }))
userId: string;

// 组合使用 - 带 UUID 验证的端点
@Get('whales/:id/sightings')
findWhaleSightings(
  @Param('id', new ParseUUIDPipe()) whaleId: string,
  @Query('stationId', new ParseUUIDPipe({ required: false })) stationId?: string,
  @Query('page', new PaginationPipe()) pagination: PaginationResult,
) {
  return this.whalesService.findSightings(whaleId, { ...pagination, stationId });
}
```

**ParseUUIDOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `version` | `1 \| 2 \| 3 \| 4 \| 5` | `undefined` | 指定 UUID 版本，不指定则接受任意版本 |
| `required` | `boolean` | `true` | 是否必填，`false` 时允许 `undefined` |

**错误响应示例:**

```json
// 缺少必填 UUID 参数
{
  "statusCode": 400,
  "message": "id 是必填项，请提供有效的 UUID",
  "error": "Bad Request"
}

// UUID 格式无效
{
  "statusCode": 400,
  "message": "id 必须是有效的 UUID 格式",
  "error": "Bad Request"
}

// UUID 版本不匹配
{
  "statusCode": 400,
  "message": "userId 必须是有效的 UUID(v4) 格式",
  "error": "Bad Request"
}
```

**UUID 格式说明:**

- 支持 UUID v1-v5 格式验证
- 标准格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (36 字符，含 4 个连字符)
- 不区分大小写：`550e8400-e29b-41d4-a716-446655440000` 和 `550E8400-E29B-41D4-A716-446655440000` 均有效

---

### 📁 Pipes (管道) - ParseBooleanPipe

**ParseBooleanPipe 使用示例:**

```typescript
import { ParseBooleanPipe } from '@/common/pipes';

// 必填布尔参数 - 基础用法
@Query('isActive', new ParseBooleanPipe())
isActive: boolean;

// 可选布尔参数 - 允许 undefined
@Query('verified', new ParseBooleanPipe({ required: false }))
verified?: boolean;

// 带默认值 - 默认不显示未激活项
@Query('includeInactive', new ParseBooleanPipe({ required: false, defaultValue: false }))
includeInactive: boolean;

// 在 Controller 中组合使用
@Get('whales')
findAll(
  @Query('isActive', new ParseBooleanPipe()) isActive: boolean,
  @Query('verified', new ParseBooleanPipe({ required: false })) verified?: boolean,
  @Query('includeInactive', new ParseBooleanPipe({ required: false, defaultValue: false }))
  includeInactive: boolean,
) {
  return this.whalesService.findAll({ isActive, verified, includeInactive });
}
```

**ParseBooleanOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `required` | `boolean` | `true` | 是否必填，`false` 时允许空值并返回 `defaultValue` |
| `defaultValue` | `boolean` | `false` | 默认值，仅在 `required=false` 且值为空时使用 |

**支持的输入格式:**

| 类型 | 真值 (→ `true`) | 假值 (→ `false`) |
|------|----------------|-----------------|
| 字符串 | `'true'`, `'1'`, `'yes'`, `'on'` | `'false'`, `'0'`, `'no'`, `'off'` |
| 数字 | `1` | `0` |
| 布尔值 | `true` | `false` |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "isActive 是必填项，请提供有效的布尔值 (true/false)",
  "error": "Bad Request"
}

// 无效的布尔值
{
  "statusCode": 400,
  "message": "verified 必须是有效的布尔值 (true/false/1/0/yes/no/on/off)",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 状态筛选 | `?isActive=true` | 筛选激活/未激活的记录 |
| 验证状态 | `?verified=yes` | 筛选已验证/未验证的数据 |
| 包含选项 | `?includeInactive=1` | 是否包含已删除/归档的数据 |
| 导出选项 | `?exportAll=on` | 导出全部/仅当前页数据 |

**ParseBooleanPipe vs ParseOptionalBooleanPipe:**

| 管道 | 必填/可选 | 空值处理 | 使用场景 |
|------|----------|----------|----------|
| `ParseBooleanPipe` | 必填 | 抛出异常 | 必须明确指定的布尔开关 |
| `ParseOptionalBooleanPipe` | 可选 | 返回 `undefined` 或默认值 | 可选的筛选条件 |

### 📁 Pipes (管道) - ParseStringPipe

**ParseStringPipe 使用示例:**

```typescript
import { ParseStringPipe } from '@/common/pipes';

// 必填字符串 - 基础用法
@Body('name', new ParseStringPipe())
name: string;

@Query('keyword', new ParseStringPipe())
keyword: string;

// 带长度验证 - 鲸鱼名称 2-50 字符
@Body('name', new ParseStringPipe({ minLength: 2, maxLength: 50 }))
name: string;

// 带正则验证 - 国家代码 (2 位大写字母)
@Body('countryCode', new ParseStringPipe({ 
  pattern: /^[A-Z]{2}$/,
  patternMessage: '国家代码必须是 2 位大写字母',
  toUpperCase: true
}))
countryCode: string;

// 自动修剪和转小写 - 邮箱/用户名
@Body('username', new ParseStringPipe({ 
  trim: true,
  toLowerCase: true,
  maxLength: 30
}))
username: string;

// 在 Controller 中组合使用
@Post('whales')
createWhale(
  @Body('identifier', new ParseStringPipe({ minLength: 3, maxLength: 20 })) identifier: string,
  @Body('name', new ParseStringPipe({ minLength: 2, maxLength: 50, trim: true })) name: string,
  @Body('notes', new ParseStringPipe({ maxLength: 500, trim: true })) notes: string,
) {
  return this.whalesService.create({ identifier, name, notes });
}
```

**ParseStringOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `minLength` | `number` | `undefined` | 最小长度限制 |
| `maxLength` | `number` | `undefined` | 最大长度限制 |
| `pattern` | `RegExp` | `undefined` | 正则表达式匹配 |
| `patternMessage` | `string` | `undefined` | 正则匹配失败的错误消息 |
| `trim` | `boolean` | `true` | 自动修剪首尾空格 |
| `toLowerCase` | `boolean` | `false` | 转为小写 |
| `toUpperCase` | `boolean` | `false` | 转为大写 |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "name 不能为空",
  "error": "Bad Request"
}

// 长度不足
{
  "statusCode": 400,
  "message": "name 长度不能少于 2 个字符 (当前：1)",
  "error": "Bad Request"
}

// 超出最大长度
{
  "statusCode": 400,
  "message": "notes 长度不能超过 500 个字符 (当前：623)",
  "error": "Bad Request"
}

// 正则匹配失败
{
  "statusCode": 400,
  "message": "国家代码必须是 2 位大写字母",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 鲸鱼标识符 | `identifier: BCX001` | 短代码，固定格式 |
| 鲸鱼名称 | `name: 大白` | 2-50 字符，自动修剪 |
| 备注/描述 | `notes: ...` | 限制最大长度 |
| 用户名 | `username: researcher1` | 转小写，去空格 |
| 国家/地区代码 | `countryCode: CN` | 正则验证格式 |

**ParseStringPipe vs ParseOptionalStringPipe:**

| 管道 | 必填/可选 | 空值处理 | 使用场景 |
|------|----------|----------|----------|
| `ParseStringPipe` | 必填 | 抛出异常 | 请求体中的必需字段 (name, identifier) |
| `ParseOptionalStringPipe` | 可选 | 返回 `undefined` 或默认值 | 查询参数中的可选筛选条件 |

---

### 📁 Pipes (管道) - ParseEmailPipe

**ParseEmailPipe 使用示例:**

```typescript
import { ParseEmailPipe } from '@/common/pipes';

// 必填邮箱 - 基础用法
@Body('email', new ParseEmailPipe())
email: string;

@Query('contactEmail', new ParseEmailPipe())
contactEmail: string;

// 可选邮箱 - 允许 undefined
@Query('backupEmail', new ParseEmailPipe({ required: false }))
backupEmail?: string;

// 在 Controller 中组合使用
@Post('users')
createUser(
  @Body('email', new ParseEmailPipe()) email: string,
  @Body('name', new ParseOptionalStringPipe({ minLength: 2, maxLength: 50 })) name: string,
  @Query('backupEmail', new ParseEmailPipe({ required: false })) backupEmail?: string,
) {
  return this.usersService.create({ email, name, backupEmail });
}
```

**ParseEmailOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `required` | `boolean` | `true` | 是否必填，`false` 时允许空值并返回 `undefined` |

**验证规则:**

| 规则 | 说明 |
|------|------|
| 格式验证 | 符合 RFC 5322 标准的邮箱格式 |
| 自动转换 | 自动转为小写并去除首尾空格 |
| 支持格式 | `user@domain.com`, `user.name+tag@domain.co.uk` 等 |
| 不支持 | 纯 IP 地址邮箱、带中文的邮箱 |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "邮箱地址是必填项，请提供有效的邮箱地址",
  "error": "Bad Request"
}

// 无效的邮箱格式
{
  "statusCode": 400,
  "message": "invalid-email 不是有效的邮箱地址格式",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 用户注册 | `POST /users` | 验证注册邮箱格式 |
| 联系方式 | `POST /contact` | 验证联系邮箱 |
| 通知设置 | `PUT /notifications` | 验证通知邮箱 |
| 备用邮箱 | `PUT /profile` | 可选的备用邮箱字段 |

**邮箱格式示例:**

| 有效邮箱 | 无效邮箱 | 说明 |
|---------|---------|------|
| `user@example.com` | `user@example` | 缺少顶级域名 |
| `user.name@example.com` | `user@.com` | 缺少域名 |
| `user+tag@example.co.uk` | `user name@example.com` | 包含空格 |
| `user123@test.org` | `user@example.c` | 顶级域名过短 |

### 📁 Pipes (管道) - ParsePhonePipe

**ParsePhonePipe 使用示例:**

```typescript
import { ParsePhonePipe } from '@/common/pipes';

// 必填手机号 - 基础用法
@Body('phone', new ParsePhonePipe())
phone: string;

@Query('contactPhone', new ParsePhonePipe())
contactPhone: string;

// 可选手机号 - 允许 undefined
@Query('backupPhone', new ParsePhonePipe({ required: false }))
backupPhone?: string;

// 允许国际格式 (+86 前缀)
@Body('phone', new ParsePhonePipe({ allowInternational: true }))
phone: string;

// 在 Controller 中组合使用
@Post('researchers')
createResearcher(
  @Body('name', new ParseOptionalStringPipe({ minLength: 2, maxLength: 50 })) name: string,
  @Body('email', new ParseEmailPipe()) email: string,
  @Body('phone', new ParsePhonePipe()) phone: string,
  @Body('emergencyPhone', new ParsePhonePipe({ required: false })) emergencyPhone?: string,
) {
  return this.researchersService.create({ name, email, phone, emergencyPhone });
}
```

**ParsePhoneOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `required` | `boolean` | `true` | 是否必填，`false` 时允许空值并返回 `undefined` |
| `allowInternational` | `boolean` | `false` | 是否允许国际格式 (+86 前缀) |

**验证规则:**

| 规则 | 说明 |
|------|------|
| 格式验证 | 中国大陆手机号：11 位数字，以 1 开头，第二位为 3-9 |
| 自动清理 | 自动去除空格和连字符 (`-`) |
| 国际格式 | 可选支持 `+86` 前缀 (需设置 `allowInternational: true`) |
| 支持格式 | `13800138000`, `198-1234-5678`, `+8613800138000` |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "手机号是必填项，请提供有效的中国大陆手机号",
  "error": "Bad Request"
}

// 无效的手机号格式
{
  "statusCode": 400,
  "message": "12345678901 不是有效的中国大陆手机号格式 (11 位数字，以 1 开头，第二位为 3-9)",
  "error": "Bad Request"
}

// 国际格式未启用
{
  "statusCode": 400,
  "message": "+8613800138000 不是有效的手机号格式 (支持 11 位数字或 +86 开头的国际格式)",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 用户注册 | `POST /users` | 验证注册手机号 |
| 研究员信息 | `POST /researchers` | 验证研究员联系方式 |
| 紧急联系人 | `POST /emergency-contact` | 验证紧急联系人电话 |
| 志愿者登记 | `POST /volunteers` | 验证志愿者手机号 |
| 备用联系方式 | `PUT /profile` | 可选的备用手机号 |

**手机号格式示例:**

| 有效格式 | 无效格式 | 说明 |
|---------|---------|------|
| `13800138000` | `12345678901` | 第二位必须是 3-9 |
| `198-1234-5678` | `1380013800` | 必须 11 位数字 |
| `+8613800138000` | `8613800138000` | 国际格式需带 + 号 |
| `150 1234 5678` | `138001380001` | 不能超过 11 位 |

**常见号段:**

| 运营商 | 号段 |
|--------|------|
| 中国移动 | 134, 135, 136, 137, 138, 139, 150, 151, 152, 157, 158, 159, 182, 183, 184, 187, 188, 198 |
| 中国联通 | 130, 131, 132, 155, 156, 185, 186, 166, 196 |
| 中国电信 | 133, 153, 180, 181, 189, 199 |
| 中国广电 | 192 |

### 📁 Pipes (管道) - ParseDatePipe

**ParseDatePipe 使用示例:**

```typescript
import { ParseDatePipe } from '@/common/pipes';

// 必填日期参数 - 基础用法
@Query('birthDate', new ParseDatePipe())
birthDate: Date;

@Body('observationDate', new ParseDatePipe())
observationDate: Date;

// 带日期范围验证
@Query('startDate', new ParseDatePipe({ minDate: '2020-01-01' }))
startDate: Date;

@Query('endDate', new ParseDatePipe({ maxDate: '2026-12-31' }))
endDate: Date;

// 在 Controller 中组合使用
@Post('sightings')
createSighting(
  @Body('speciesId', new ParseIntPipe()) speciesId: number,
  @Body('observationDate', new ParseDatePipe()) observationDate: Date,
  @Body('latitude', new ParseFloatPipe({ min: -90, max: 90 })) latitude: number,
  @Body('longitude', new ParseFloatPipe({ min: -180, max: 180 })) longitude: number,
) {
  return this.sightingsService.create({ speciesId, observationDate, latitude, longitude });
}
```

**ParseDateOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `minDate` | `string` | `undefined` | 最小允许日期 (YYYY-MM-DD 格式) |
| `maxDate` | `string` | `undefined` | 最大允许日期 (YYYY-MM-DD 格式) |

**验证规则:**

| 规则 | 说明 |
|------|------|
| 格式验证 | 必须是 YYYY-MM-DD 格式 (如 `2026-03-30`) |
| 日期有效性 | 验证日期是否真实存在 (防止 `2024-02-30` 等无效日期) |
| 范围验证 | 可选设置最小/最大日期限制 |
| 必填校验 | 默认必填，不允许 `undefined`/`null`/空字符串 |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "参数是必填项，请提供有效的日期 (YYYY-MM-DD 格式)",
  "error": "Bad Request"
}

// 格式错误
{
  "statusCode": 400,
  "message": "参数必须是 YYYY-MM-DD 格式的日期",
  "error": "Bad Request"
}

// 无效日期
{
  "statusCode": 400,
  "message": "参数不是有效的日期",
  "error": "Bad Request"
}

// 超出范围
{
  "statusCode": 400,
  "message": "参数不能早于 2020-01-01",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 鲸鱼出生日期 | `POST /whales` | 验证鲸鱼个体的出生日期 |
| 观测记录日期 | `POST /sightings` | 验证观测记录的日期 |
| 数据查询范围 | `GET /sightings` | 验证查询的起止日期 |
| 项目时间线 | `POST /projects` | 验证项目的开始/结束日期 |
| 证书有效期 | `POST /certifications` | 验证证书的有效期 |

**日期格式示例:**

| 有效格式 | 无效格式 | 说明 |
|---------|---------|------|
| `2026-03-30` | `2026/03/30` | 必须使用连字符 |
| `2024-02-29` | `2024-02-30` | 2 月 30 日不存在 |
| `2000-01-01` | `01-01-2000` | 必须是 YYYY-MM-DD 顺序 |
| `1999-12-31` | `1999-13-01` | 月份不能超过 12 |

### 📁 Pipes (管道) - ParseIntPipe

**ParseIntPipe 使用示例:**

```typescript
import { ParseIntPipe } from '@/common/pipes';

// 必填整数参数 - 基础用法
@Param('id', new ParseIntPipe())
id: number;

@Query('speciesId', new ParseIntPipe())
speciesId: number;

// 带范围验证 - 年龄必须在 0-100 之间
@Query('age', new ParseIntPipe({ min: 0, max: 100 }))
age: number;

// 带范围验证 - 页码必须 >= 1
@Query('page', new ParseIntPipe({ min: 1 }))
page: number;

// 在 Controller 中组合使用
@Get('species/:id/sightings')
findSpeciesSightings(
  @Param('id', new ParseIntPipe()) speciesId: number,
  @Query('limit', new ParseIntPipe({ min: 1, max: 100 })) limit: number,
) {
  return this.sightingsService.findBySpecies(speciesId, limit);
}
```

**ParseIntOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min` | `number` | `undefined` | 最小值限制 (小于此值会抛出异常) |
| `max` | `number` | `undefined` | 最大值限制 (大于此值会抛出异常) |

**错误响应示例:**

```json
// 缺少必填整数参数
{
  "statusCode": 400,
  "message": "id 是必填项，请提供有效的整数",
  "error": "Bad Request"
}

// 整数值无效
{
  "statusCode": 400,
  "message": "page 必须是有效的整数",
  "error": "Bad Request"
}

// 整数超出范围
{
  "statusCode": 400,
  "message": "age 不能大于 100",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 路径参数 ID | `/species/:id` | 资源 ID 必须为整数 |
| 数量限制 | `?limit=50` | 返回数量限制 |
| 年龄/计数 | `?age=5` | 必须是整数的业务字段 |
| 页码 | `?page=1` | 分页页码 (通常 min=1) |

**ParseIntPipe vs ParseOptionalIntPipe:**

| 管道 | 必填/可选 | 空值处理 | 使用场景 |
|------|----------|----------|----------|
| `ParseIntPipe` | 必填 | 抛出异常 | 必须提供的整数参数 (如资源 ID) |
| `ParseOptionalIntPipe` | 可选 | 返回 `undefined` 或默认值 | 可选的筛选条件 (如页码、过滤值) |

### 📁 Pipes (管道) - ParseFloatPipe

**ParseFloatPipe 使用示例:**

```typescript
import { ParseFloatPipe } from '@/common/pipes';

// 必填浮点数参数 - 基础用法
@Query('latitude', new ParseFloatPipe())
latitude: number;

@Query('longitude', new ParseFloatPipe())
longitude: number;

// 带范围验证 - 纬度必须在 -90 到 90 之间
@Query('lat', new ParseFloatPipe({ min: -90, max: 90 }))
latitude: number;

// 带精度控制 - 最多保留 6 位小数
@Query('accuracy', new ParseFloatPipe({ precision: 6 }))
accuracy: number;

// 组合验证 - 范围 + 精度
@Query('waterTemperature', new ParseFloatPipe({ min: -2, max: 30, precision: 2 }))
waterTemperature: number;

// 在 Controller 中组合使用
@Get('sightings/nearby')
findNearbySightings(
  @Query('lat', new ParseFloatPipe({ min: -90, max: 90 })) latitude: number,
  @Query('lng', new ParseFloatPipe({ min: -180, max: 180 })) longitude: number,
  @Query('radius', new ParseFloatPipe({ min: 0.1, max: 100, precision: 2 })) radius: number,
) {
  return this.sightingsService.findNearby(latitude, longitude, radius);
}
```

**ParseFloatOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min` | `number` | `undefined` | 最小值限制 (小于此值会抛出异常) |
| `max` | `number` | `undefined` | 最大值限制 (大于此值会抛出异常) |
| `precision` | `number` | `undefined` | 小数位数限制 (超过会抛出异常) |

**错误响应示例:**

```json
// 缺少必填浮点数参数
{
  "statusCode": 400,
  "message": "latitude 是必填项，请提供有效的数字",
  "error": "Bad Request"
}

// 浮点数值无效
{
  "statusCode": 400,
  "message": "longitude 必须是有效的数字",
  "error": "Bad Request"
}

// 浮点数超出范围
{
  "statusCode": 400,
  "message": "latitude 不能大于 90",
  "error": "Bad Request"
}

// 精度超出限制
{
  "statusCode": 400,
  "message": "accuracy 最多保留 6 位小数",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| GPS 坐标 | `?lat=31.2304&lng=121.4737` | 经纬度坐标 (需范围验证) |
| 测量数据 | `?temperature=23.5` | 水温、盐度等科学测量值 |
| 距离/半径 | `?radius=5.5` | 搜索半径、距离计算 |
| 百分比 | `?confidence=0.95` | 置信度、概率值 (0-1 范围) |

**ParseFloatPipe vs ParseOptionalFloatPipe:**

| 管道 | 必填/可选 | 空值处理 | 使用场景 |
|------|----------|----------|----------|
| `ParseFloatPipe` | 必填 | 抛出异常 | 必须提供的浮点数参数 (如坐标) |
| `ParseOptionalFloatPipe` | 可选 | 返回 `undefined` 或默认值 | 可选的筛选条件 (如最小/最大过滤值) |

### 📁 Pipes (管道) - ParseCoordinatePipe

**ParseCoordinatePipe 使用示例:**

```typescript
import { ParseCoordinatePipe, ParseCoordinatePairPipe } from '@/common/pipes';

// 单独验证纬度 - 基础用法
@Query('lat', new ParseCoordinatePipe({ type: 'latitude' }))
latitude: number;

// 单独验证经度 - 基础用法
@Query('lng', new ParseCoordinatePipe({ type: 'longitude' }))
longitude: number;

// 可选坐标参数 - 允许 undefined
@Query('centerLat', new ParseCoordinatePipe({ type: 'latitude', allowOptional: true }))
centerLatitude?: number;

@Query('centerLng', new ParseCoordinatePipe({ type: 'longitude', allowOptional: true }))
centerLongitude?: number;

// 使用坐标对管道 - 同时验证纬度和经度
@Query(new ParseCoordinatePairPipe())
center: { latitude: number; longitude: number };

// 在 Controller 中组合使用
@Get('sightings/nearby')
findNearbySightings(
  @Query('lat', new ParseCoordinatePipe({ type: 'latitude' })) latitude: number,
  @Query('lng', new ParseCoordinatePipe({ type: 'longitude' })) longitude: number,
  @Query('radius', new ParseOptionalFloatPipe({ defaultValue: 10, min: 0.1, max: 100 })) radius: number,
) {
  return this.sightingsService.findNearby(latitude, longitude, radius);
}

// 使用坐标对 - 更简洁的写法
@Get('stations/nearby')
findNearbyStations(
  @Query(new ParseCoordinatePairPipe()) center: { latitude: number; longitude: number },
  @Query('radius', new ParseOptionalFloatPipe({ defaultValue: 50 })) radius: number,
) {
  return this.stationsService.findNearby(center.latitude, center.longitude, radius);
}
```

**ParseCoordinateOptions 选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'latitude' \| 'longitude'` | 必填 | 坐标类型，决定验证范围 |
| `allowOptional` | `boolean` | `false` | 是否允许为空，`true` 时允许 `undefined` |

**验证规则:**

| 坐标类型 | 范围 | 说明 |
|---------|------|------|
| 纬度 (latitude) | -90 到 90 | 地球纬度范围 |
| 经度 (longitude) | -180 到 180 | 地球经度范围 |

**错误响应示例:**

```json
// 缺少必填坐标参数
{
  "statusCode": 400,
  "message": "lat 是必填项，请提供有效的坐标值",
  "error": "Bad Request"
}

// 纬度超出范围
{
  "statusCode": 400,
  "message": "lat 必须在 -90 到 90 之间",
  "error": "Bad Request"
}

// 经度超出范围
{
  "statusCode": 400,
  "message": "lng 必须在 -180 到 180 之间",
  "error": "Bad Request"
}

// 坐标对验证失败
{
  "statusCode": 400,
  "message": "latitude 必须在 -90 到 90 之间",
  "error": "Bad Request"
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 观测位置 | `?lat=31.2304&lng=121.4737` | 鲸鱼观测记录的 GPS 坐标 |
| 搜索中心点 | `?centerLat=35.6762&centerLng=139.6503` | 附近搜索的中心坐标 |
| 迁徙轨迹点 | `POST /whales/:id/migrations` | 鲸鱼迁徙轨迹的坐标点 |
| 监测站点位置 | `POST /stations` | 监测站点的地理位置 |
| 栖息地边界 | `POST /habitats` | 栖息地保护区的边界坐标 |

**坐标对示例 (日本东京):**

| 格式 | 值 | 说明 |
|------|-----|------|
| 纬度 | `35.6762` | 北纬 35.6762 度 |
| 经度 | `139.6503` | 东经 139.6503 度 |
| 坐标对 | `{ latitude: 35.6762, longitude: 139.6503 }` | 完整坐标对象 |

**常见坐标范围参考:**

| 地区 | 纬度范围 | 经度范围 |
|------|---------|---------|
| 中国 | 18°N - 54°N | 73°E - 135°E |
| 日本 | 24°N - 46°N | 123°E - 146°E |
| 美国西海岸 | 32°N - 49°N | 117°W - 125°W |
| 南极洲 | 60°S - 90°S | 全经度 |
| 北极地区 | 66.5°N - 90°N | 全经度 |

**ParseCoordinatePipe vs ParseFloatPipe:**

| 管道 | 验证范围 | 语义 | 使用场景 |
|------|---------|------|---------|
| `ParseCoordinatePipe` | 纬度：-90~90, 经度：-180~180 | GPS 坐标专用 | 地理位置、迁徙轨迹、监测站点 |
| `ParseFloatPipe` | 自定义范围 | 通用浮点数 | 温度、盐度、距离、百分比 |

**最佳实践:**

1. ✅ **优先使用 ParseCoordinatePipe** - 代码语义更清晰，自动范围验证
2. ✅ **使用坐标对管道** - 当需要同时验证纬度和经度时更简洁
3. ✅ **设置 allowOptional** - 对于可选的坐标筛选参数
4. ⚠️ **注意坐标顺序** - 始终使用 (latitude, longitude) 顺序，不要混淆

### 📁 Pipes (管道) - ParseArrayPipe

`ParseArrayPipe` 用于解析逗号分隔的字符串为数组，支持类型转换、长度验证和枚举验证。

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 多选筛选 | `?species=blue,fin,humpback` | 多个物种 ID |
| 批量操作 | `?ids=uuid1,uuid2,uuid3` | 批量删除/更新 |
| 标签过滤 | `?tags=migration,feeding,breeding` | 多个标签 |
| 状态筛选 | `?status=active,pending` | 多个状态值 |
| 数值列表 | `?depths=100,200,300` | 多个数值 (需 transform) |

**基础用法:**

```typescript
import { ParseArrayPipe } from '@/common/pipes';

// 简单的逗号分隔解析
@Query('species', new ParseArrayPipe())
species: string[];

// 自定义分隔符 (分号分隔)
@Query('tags', new ParseArrayPipe({ separator: ';' }))
tags: string[];

// 不允许空数组
@Query('ids', new ParseArrayPipe({ allowEmpty: false }))
ids: string[];

// 限制数组长度 (1-10 项)
@Query('whaleIds', new ParseArrayPipe({ minItems: 1, maxItems: 10 }))
whaleIds: string[];
```

**类型转换:**

```typescript
// 转换为数字数组
@Query('depths', new ParseArrayPipe({ 
  transform: (item) => parseFloat(item) 
}))
depths: number[];

// 转换为整数数组
@Query('years', new ParseArrayPipe({ 
  transform: (item) => parseInt(item, 10) 
}))
years: number[];

// 转换为布尔值数组
@Query('flags', new ParseArrayPipe({ 
  transform: (item) => item === 'true' 
}))
flags: boolean[];

// 转换为大写
@Query('codes', new ParseArrayPipe({ 
  transform: (item) => item.toUpperCase() 
}))
codes: string[];
```

**枚举验证:**

```typescript
import { StationStatus } from '@/stations/entities/station.entity';

// 验证状态枚举值
@Query('status', new ParseArrayPipe({ enum: StationStatus }))
statuses: StationStatus[];

// 自定义错误消息
@Query('types', new ParseArrayPipe({ 
  enum: WhaleType,
  errorMessage: '无效的鲸鱼类型，可选值：blue, fin, humpback, sperm'
}))
types: WhaleType[];
```

**完整示例 - 批量操作:**

```typescript
@Delete('whales')
async batchDelete(
  @Query('ids', new ParseArrayPipe({ 
    allowEmpty: false,
    errorMessage: '请提供至少一个鲸鱼 ID'
  }))
  ids: string[],
) {
  return this.whalesService.batchDelete(ids);
}

@Get('sightings/filter')
async filterSightings(
  @Query('species', new ParseArrayPipe())
  species: string[],
  
  @Query('minDepth', new ParseArrayPipe({ 
    transform: (item) => parseFloat(item),
    allowEmpty: true 
  }))
  minDepths: number[],
  
  @Query('status', new ParseArrayPipe({ enum: SightingStatus }))
  statuses: SightingStatus[],
) {
  return this.sightingsService.filter({ species, minDepths, statuses });
}
```

**配置选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `separator` | `string` | `','` | 分隔符 |
| `allowEmpty` | `boolean` | `true` | 是否允许空数组 |
| `minItems` | `number` | `0` | 最小数组长度 |
| `maxItems` | `number` | `Infinity` | 最大数组长度 |
| `transform` | `function` | `undefined` | 数组项转换函数 |
| `enum` | `Type/Record` | `undefined` | 枚举类型验证 |
| `errorMessage` | `string` | `undefined` | 自定义错误消息 |

**验证规则:**

| 规则 | 说明 |
|------|------|
| 分隔符解析 | 使用配置的 `separator` 分割字符串 (默认逗号) |
| 空值处理 | `allowEmpty: true` 时空值返回 `[]`，否则抛出异常 |
| 长度验证 | 数组长度必须在 `minItems` 和 `maxItems` 之间 |
| 类型转换 | 通过 `transform` 函数转换每个数组项 |
| 枚举验证 | 如果配置 `enum`，验证每个项是否为有效枚举值 |

**错误响应示例:**

```json
// 必填数组为空
{
  "statusCode": 400,
  "message": "ids 不能为空数组",
  "error": "Bad Request"
}

// 数组长度不足
{
  "statusCode": 400,
  "message": "数组长度不能少于 1 项",
  "error": "Bad Request"
}

// 数组长度超限
{
  "statusCode": 400,
  "message": "数组长度不能超过 10 项",
  "error": "Bad Request"
}

// 枚举值无效
{
  "statusCode": 400,
  "message": "值 \"invalid\" 不是有效的枚举值",
  "error": "Bad Request"
}

// 自定义错误消息
{
  "statusCode": 400,
  "message": "请提供至少一个鲸鱼 ID",
  "error": "Bad Request"
}
```

**使用场景对比:**

| 场景 | 推荐管道 | 说明 |
|------|----------|------|
| 单选枚举 | `ParseEnumPipe` | 单个枚举值 |
| 多选枚举 | `ParseArrayPipe` + `enum` | 多个枚举值 (逗号分隔) |
| 字符串列表 | `ParseArrayPipe` | 简单字符串数组 |
| 数字列表 | `ParseArrayPipe` + `transform` | 数字数组 (需转换) |
| 布尔列表 | `ParseArrayPipe` + `transform` | 布尔数组 (需转换) |

**最佳实践:**

1. ✅ **设置合理的长度限制** - 使用 `minItems`/`maxItems` 防止滥用
2. ✅ **使用枚举验证** - 对于固定选项使用 `enum` 选项确保数据有效性
3. ✅ **提供清晰的错误消息** - 使用 `errorMessage` 自定义用户友好的提示
4. ✅ **注意 transform 性能** - 避免在转换函数中执行复杂操作
5. ⚠️ **分隔符选择** - 如果数据可能包含逗号，使用其他分隔符 (如分号 `;`)

**常见用法示例:**

```typescript
// 批量 ID 查询 - 至少 1 个，最多 50 个
@Query('ids', new ParseArrayPipe({ 
  allowEmpty: false,
  minItems: 1,
  maxItems: 50,
  errorMessage: '请提供 1-50 个 ID，使用逗号分隔'
}))
ids: string[];

// 多选状态筛选 - 枚举验证
@Query('status', new ParseArrayPipe({ 
  enum: SightingStatus,
  allowEmpty: true 
}))
statuses: SightingStatus[];

// 数值范围筛选 - 类型转换
@Query('depths', new ParseArrayPipe({ 
  transform: (item) => parseFloat(item),
  allowEmpty: true
}))
depths: number[];

// 标签搜索 - 自定义分隔符
@Query('tags', new ParseArrayPipe({ 
  separator: ';',
  transform: (item) => item.toLowerCase().trim()
}))
tags: string[];
```

---

### 📁 Pipes (管道) - ParseEnumPipe

`ParseEnumPipe` 用于验证参数是否为有效的枚举值，支持必填/可选模式、默认值设置和自动错误提示。

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 性别筛选 | `?sex=M` | 验证性别枚举 (M/F/U) |
| 生命状态 | `?status=ALIVE` | 验证生命状态 (ALIVE/DECEASED/MISSING) |
| 保护等级 | `?iucnStatus=EN` | 验证 IUCN 保护等级 (LC/NT/VU/EN/CR) |
| 观测状态 | `?sightingStatus=CONFIRMED` | 验证观测状态 (PENDING/CONFIRMED/VERIFIED) |
| 站点状态 | `?stationStatus=ACTIVE` | 验证监测站点状态 (ACTIVE/INACTIVE/MAINTENANCE) |

**基础用法:**

```typescript
import { ParseEnumPipe } from '@/common/pipes';
import { Sex, LifeStatus } from '@/whales/entities/whale.entity';
import { IUCNStatus } from '@/species/entities/species.entity';

// 可选枚举参数 - 支持默认值
@Query('sex', new ParseEnumPipe({ enumType: Sex }))
sex?: Sex;

// 必填枚举参数
@Query('iucnStatus', new ParseEnumPipe({ 
  enumType: IUCNStatus,
  required: true 
}))
iucnStatus: IUCNStatus;

// 带默认值的枚举参数
@Query('status', new ParseEnumPipe({ 
  enumType: LifeStatus,
  defaultValue: LifeStatus.ALIVE 
}))
status: LifeStatus;
```

**完整示例 - 多枚举筛选:**

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseEnumPipe, ParseOptionalIntPipe } from '@/common/pipes';
import { Sex, LifeStatus } from '@/whales/entities/whale.entity';
import { IUCNStatus } from '@/species/entities/species.entity';

@Controller('whales')
export class WhalesController {
  @Get()
  findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1 })) page: number,
    @Query('pageSize', new ParseOptionalIntPipe({ defaultValue: 20 })) pageSize: number,
    @Query('sex', new ParseEnumPipe({ enumType: Sex })) sex?: Sex,
    @Query('status', new ParseEnumPipe({ enumType: LifeStatus })) status?: LifeStatus,
    @Query('protectionLevel', new ParseEnumPipe({ enumType: IUCNStatus })) protectionLevel?: IUCNStatus,
  ) {
    return this.whalesService.findAll({ page, pageSize, sex, status, protectionLevel });
  }
}
```

**配置选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enumType` | `Type/Record` | **必填** | 枚举类型对象 |
| `defaultValue` | `any` | `undefined` | 当参数为空时的默认值 |
| `required` | `boolean` | `false` | 是否必填，`true` 时空值抛出异常 |

**验证规则:**

| 规则 | 说明 |
|------|------|
| 枚举匹配 | 输入值必须是枚举的有效字符串值之一 |
| 自动转换 | 返回对应的枚举值 (而非字符串) |
| 空值处理 | 非必填时返回 `undefined` 或 `defaultValue` |
| 错误提示 | 自动列出所有有效值供参考 |

**错误响应示例:**

```json
// 必填项为空
{
  "statusCode": 400,
  "message": "iucnStatus 是必填项",
  "error": "Bad Request"
}

// 无效的枚举值
{
  "statusCode": 400,
  "message": "sex 必须是以下值之一：M, F, U",
  "error": "Bad Request"
}
```

**常见枚举类型示例:**

```typescript
// 性别枚举
export enum Sex {
  MALE = 'M',
  FEMALE = 'F',
  UNKNOWN = 'U'
}

// 生命状态枚举
export enum LifeStatus {
  ALIVE = 'ALIVE',
  DECEASED = 'DECEASED',
  MISSING = 'MISSING'
}

// IUCN 保护等级枚举
export enum IUCNStatus {
  LEAST_CONCERN = 'LC',
  NEAR_THREATENED = 'NT',
  VULNERABLE = 'VU',
  ENDANGERED = 'EN',
  CRITICALLY_ENDANGERED = 'CR'
}

// 观测状态枚举
export enum SightingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  VERIFIED = 'VERIFIED'
}
```

**使用场景对比:**

| 场景 | 推荐管道 | 说明 |
|------|----------|------|
| 固定选项筛选 | `ParseEnumPipe` | 选项固定且预定义为枚举 |
| 字符串选项 | `ParseStringPipe` + `enum` | 简单字符串列表验证 |
| 多选枚举 | `ParseArrayPipe` + `enum` | 多个枚举值 (逗号分隔) |
| 数字状态码 | `ParseIntPipe` + 自定义验证 | 数字型状态码 |

**最佳实践:**

1. ✅ **优先使用枚举** - 比字符串常量更安全，支持 IDE 自动补全
2. ✅ **明确必填/可选** - 根据业务逻辑设置 `required` 选项
3. ✅ **提供默认值** - 对于有合理默认值的场景使用 `defaultValue`
4. ✅ **错误消息清晰** - 自动列出有效值，帮助用户快速修正
5. ⚠️ **枚举值变更** - 修改枚举定义时注意向后兼容性

---

### 📁 Pipes (管道) - ParseUrlPipe

`ParseUrlPipe` 用于验证 URL 地址格式，支持协议白名单、域名/IP 验证和必填/可选模式。

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 网站链接 | `https://example.com` | 组织官网、项目页面 |
| 资源 URL | `https://cdn.example.com/image.jpg` | 图片、视频等资源地址 |
| API 回调 | `https://api.example.com/webhook` | 第三方回调地址 |
| 数据源 | `https://data.example.com/feed.xml` | 外部数据源 URL |

**基础用法:**

```typescript
import { ParseUrlPipe } from '@/common/pipes';

// 必填 URL - 基础用法 (仅允许 http/https)
@Body('website', new ParseUrlPipe())
website: string;

// 可选 URL - 允许 undefined
@Query('imageUrl', new ParseUrlPipe({ required: false }))
imageUrl?: string;

// 必填 URL - 严格模式
@Body('officialSite', new ParseUrlPipe({ required: true }))
officialSite: string;
```

**协议配置:**

```typescript
// 允许 ftp 协议
@Body('ftpUrl', new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] }))
ftpUrl: string;

// 仅允许 https (安全要求)
@Body('secureUrl', new ParseUrlPipe({ protocols: ['https'] }))
secureUrl: string;

// 允许自定义协议
@Body('customUrl', new ParseUrlPipe({ protocols: ['http', 'https', 'rtsp'] }))
customUrl: string;
```

**IP 地址支持:**

```typescript
// 允许 IP 地址作为主机 (默认仅允许域名)
@Body('apiEndpoint', new ParseUrlPipe({ allowIp: true }))
apiEndpoint: string;

// 本地开发 - 允许 localhost 和 IP
@Body('devUrl', new ParseUrlPipe({ 
  protocols: ['http', 'https'],
  allowIp: true 
}))
devUrl: string;
```

**完整示例 - 组织信息:**

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { ParseUrlPipe, ParseStringPipe } from '@/common/pipes';

class CreateOrganizationDto {
  @Body('name', new ParseStringPipe({ maxLength: 100 }))
  name: string;
  
  @Body('website', new ParseUrlPipe())
  website: string;
  
  @Body('logoUrl', new ParseUrlPipe({ required: false }))
  logoUrl?: string;
  
  @Body('apiCallback', new ParseUrlPipe({ 
    protocols: ['https'],
    allowIp: false 
  }))
  apiCallback: string;
}

@Post('organizations')
async createOrganization(@Body() dto: CreateOrganizationDto) {
  return this.organizationsService.create(dto);
}
```

**配置选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `required` | `boolean` | `true` | 是否必填 |
| `protocols` | `string[]` | `['http', 'https']` | 允许的协议列表 |
| `allowIp` | `boolean` | `false` | 是否允许 IP 地址作为主机 |

**验证规则:**

- 必须包含有效协议 (如 `http://`, `https://`)
- 必须包含有效域名或 IP 地址
- 可选端口号 (10-65535)
- 可选路径、查询参数、片段
- 协议必须在白名单内

**错误消息示例:**

```
- "URL 地址是必填项，请提供有效的 URL"
- "xxx 不是有效的 URL 地址格式"
- "不支持的协议：ftp，仅允许 http, https"
```

待实现:

- 自定义业务验证管道 (根据业务需求扩展)

---

### 📁 Pipes (管道) - ParseUUIDPipe

`ParseUUIDPipe` 用于验证参数是否为有效的 UUID 格式，支持 UUID v1-v5 版本验证。

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 资源 ID | `/api/whales/:id` | 验证鲸鱼个体 ID |
| 用户 ID | `/api/users/:id` | 验证用户 ID |
| 观测记录 ID | `/api/sightings/:id` | 验证观测记录 ID |
| 物种 ID | `/api/species/:id` | 验证物种 ID |
| 组织 ID | `/api/organizations/:id` | 验证组织 ID |

**基础用法:**

```typescript
import { ParseUUIDPipe } from '@/common/pipes';

// 必填 UUID 参数 - 支持任意版本 (v1-v5)
@Param('id', new ParseUUIDPipe()) id: string;

// 可选 UUID 参数
@Param('id', new ParseUUIDPipe({ required: false })) id?: string;

// 指定 UUID 版本 (v4 - 随机 UUID)
@Param('id', new ParseUUIDPipe({ version: 4 })) id: string;

// 指定 UUID 版本 (v1 - 时间戳 UUID)
@Param('id', new ParseUUIDPipe({ version: 1 })) id: string;
```

**完整示例 - 资源 CRUD:**

```typescript
import { Controller, Get, Param, Patch, Delete, Body } from '@nestjs/common';
import { ParseUUIDPipe } from '@/common/pipes';

@Controller('whales')
export class WhalesController {
  // 查看详情 - UUID 验证
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.whalesService.findOne(id);
  }

  // 更新 - UUID 验证
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWhaleDto,
  ) {
    return this.whalesService.update(id, dto);
  }

  // 删除 - UUID 验证
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.whalesService.remove(id);
  }

  // 批量操作 - 多个 UUID 参数
  @Post('batch-transfer')
  batchTransfer(
    @Body('sourceId', new ParseUUIDPipe({ version: 4 })) sourceId: string,
    @Body('targetId', new ParseUUIDPipe({ version: 4 })) targetId: string,
  ) {
    return this.whalesService.batchTransfer(sourceId, targetId);
  }
}
```

**配置选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `version` | `1 \| 2 \| 3 \| 4 \| 5` | `undefined` | 指定 UUID 版本，不指定则接受任意版本 |
| `required` | `boolean` | `true` | 是否必填，`true` 时空值抛出异常 |

**UUID 版本说明:**

| 版本 | 生成方式 | 典型场景 |
|------|----------|----------|
| `v1` | 基于时间戳 + MAC 地址 | 需要时间顺序的场景 |
| `v2` | 基于时间戳 + 本地标识符 | DCE 安全版本 (较少使用) |
| `v3` | 基于命名空间 + MD5 哈希 | 确定性 UUID (相同输入=相同输出) |
| `v4` | 随机生成 | **最常用**，通用场景 |
| `v5` | 基于命名空间 + SHA-1 哈希 | 确定性 UUID (比 v3 更安全) |

**验证规则:**

- 必须符合 UUID 标准格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (36 字符，含 4 个连字符)
- 如果指定 `version`，版本号必须匹配 (第 13 位字符)
- 如果指定 `version`，变体位必须匹配 (第 17 位字符必须是 8/9/a/b)
- 不区分大小写 (接受大写或小写十六进制字符)

**错误消息示例:**

```
- "id 是必填项，请提供有效的 UUID"
- "id 必须是有效的 UUID 格式"
- "id 必须是有效的 UUID(v4) 格式"
```

**错误响应示例:**

```json
// 无效 UUID 格式
{
  "statusCode": 400,
  "message": "id 必须是有效的 UUID 格式",
  "timestamp": "2026-03-30T12:45:00.000Z",
  "path": "/api/v1/whales/invalid-id"
}

// 版本不匹配
{
  "statusCode": 400,
  "message": "id 必须是有效的 UUID(v4) 格式",
  "timestamp": "2026-03-30T12:45:00.000Z",
  "path": "/api/v1/whales/123e4567-e89b-12d3-a456-426614174000"
}
```

**注意事项:**

1. ✅ **推荐使用 v4** - 大多数场景使用 UUID v4 (随机生成) 即可
2. ✅ **路径参数验证** - 主要用于 `@Param('id')` 验证资源 ID
3. ⚠️ **性能考虑** - UUID 验证是轻量级正则匹配，性能开销极小
4. ⚠️ **数据库兼容** - PostgreSQL 有原生 UUID 类型，推荐在数据库中也使用 UUID

---

### 📁 Pipes (管道) - ParseISO8601Pipe

`ParseISO8601Pipe` 用于验证和解析 ISO 8601 格式的日期时间参数，支持日期范围验证。

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 时间范围查询 | `?startTime=2026-01-01&endTime=2026-12-31` | 查询指定时间范围内的数据 |
| 日期筛选 | `?date=2026-03-30` | 查询特定日期的数据 |
| 时间戳筛选 | `?timestamp=2026-03-30T12:00:00Z` | 精确到秒的时间筛选 |
| 生日验证 | `?birthDate=2020-05-15` | 验证出生日期格式 |
| 观测时间 | `?observedAt=2026-03-30T08:30:00.000Z` | 验证观测时间戳 |

**基础用法:**

```typescript
import { ParseISO8601Pipe } from '@/common/pipes';

// 必填日期参数
@Query('startTime', new ParseISO8601Pipe()) startTime: Date;

// 可选日期参数 (需要手动处理 undefined)
@Query('endTime', new ParseISO8601Pipe({ required: false })) endTime?: Date;

// 日期范围验证 - 不能早于指定日期
@Query('birthDate', new ParseISO8601Pipe({ 
  min: new Date('2000-01-01') 
})) birthDate: Date;

// 日期范围验证 - 不能晚于指定日期
@Query('deadline', new ParseISO8601Pipe({ 
  max: new Date() 
})) deadline: Date;

// 日期范围验证 - 在指定范围内
@Query('eventDate', new ParseISO8601Pipe({ 
  min: new Date('2026-01-01'),
  max: new Date('2026-12-31')
})) eventDate: Date;
```

**完整示例 - 时间范围查询:**

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ParseISO8601Pipe, ParseOptionalIntPipe } from '@/common/pipes';

@Controller('sightings')
export class SightingsController {
  @Get()
  findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20 })) limit: number,
    
    // 开始时间 - 必填，不能早于 2020 年
    @Query('startTime', new ParseISO8601Pipe({ 
      min: new Date('2020-01-01') 
    })) startTime: Date,
    
    // 结束时间 - 必填，不能晚于当前时间
    @Query('endTime', new ParseISO8601Pipe({ 
      max: new Date() 
    })) endTime: Date,
    
    // 可选：特定日期筛选
    @Query('date', new ParseISO8601Pipe({ required: false })) date?: Date,
  ) {
    return this.sightingsService.findAll({
      page,
      limit,
      startTime,
      endTime,
      date,
    });
  }
}
```

**配置选项:**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `min` | `Date` | `undefined` | 最小日期限制 (包含) |
| `max` | `Date` | `undefined` | 最大日期限制 (包含) |

**支持的 ISO 8601 格式:**

| 格式 | 示例 | 说明 |
|------|------|------|
| 日期 | `2026-03-30` | 仅日期 (午夜 00:00:00 UTC) |
| 日期时间 | `2026-03-30T12:45:00` | 日期 + 时间 (本地时区) |
| UTC 时间 | `2026-03-30T12:45:00Z` | 日期 + 时间 (UTC) |
| 带时区 | `2026-03-30T12:45:00+08:00` | 日期 + 时间 (指定时区) |
| 带毫秒 | `2026-03-30T12:45:00.123Z` | 日期 + 时间 + 毫秒 (UTC) |

**验证规则:**

- 必须是有效的 ISO 8601 格式
- 如果指定 `min`，日期不能早于 `min`
- 如果指定 `max`，日期不能晚于 `max`
- 返回值为 `Date` 对象 (可直接用于数据库查询)

**错误消息示例:**

```
- "startTime 是必填项，请提供有效的日期 (ISO 8601 格式)"
- "endTime 必须是有效的日期格式 (ISO 8601)"
- "startTime 不能早于 2020-01-01T00:00:00.000Z"
- "endTime 不能晚于 2026-03-30T12:45:00.000Z"
```

**错误响应示例:**

```json
// 无效日期格式
{
  "statusCode": 400,
  "message": "startTime 必须是有效的日期格式 (ISO 8601)",
  "timestamp": "2026-03-30T12:45:00.000Z",
  "path": "/api/v1/sightings"
}

// 超出日期范围
{
  "statusCode": 400,
  "message": "startTime 不能早于 2020-01-01T00:00:00.000Z",
  "timestamp": "2026-03-30T12:45:00.000Z",
  "path": "/api/v1/sightings"
}
```

**注意事项:**

1. ✅ **时区处理** - JavaScript `Date` 对象内部存储为 UTC，前端传入的本地时间会自动转换
2. ✅ **数据库兼容** - PostgreSQL TIMESTAMP/TIMESTAMPTZ 类型与 ISO 8601 完美兼容
3. ⚠️ **必填 vs 可选** - 默认必填，可选参数需设置 `required: false` 并处理 `undefined`
4. ⚠️ **精度问题** - ISO 8601 支持毫秒精度，数据库字段需使用 `timestamp(3)` 或更高

---

✅ 已实现:

- `@Public()` - 标记公开路由 (跳过 JWT 认证)
- `@Roles(...)` - 角色权限装饰器 (配合 RolesGuard 使用)
- `@CurrentUser()` - 获取当前用户装饰器

待实现:

- (无)

---

### 📁 Decorators (装饰器) - 详细用法

#### @Public() - 公开路由装饰器

标记路由为公开访问，跳过 JWT 认证。通常用于登录、注册、公开数据查询等接口。

```typescript
import { Public } from '@/common/decorators';

// 登录接口 - 无需认证
@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// 注册接口 - 无需认证
@Public()
@Post('register')
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

// 公开数据查询 - 无需认证
@Public()
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 健康检查 - 无需认证
@Public()
@Get('health')
healthCheck() {
  return this.healthService.check();
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 认证接口 | `POST /login`, `POST /register` | 用户登录注册，无需先认证 |
| 公开数据 | `GET /species`, `GET /stations` | 公开数据查询，允许匿名访问 |
| 健康检查 | `GET /health`, `GET /ping` | 监控和负载均衡器健康检查 |
| 静态资源 | `GET /public/*` | 公开的文件或资源 |

**注意事项:**

1. ⚠️ **配合 JwtAuthGuard 使用** - `@Public()` 需要与 `JwtAuthGuard` 配合才能生效
2. ⚠️ **全局守卫** - 确保 `JwtAuthGuard` 已注册为全局守卫 (`app.useGlobalGuards()`)
3. ✅ **元数据标记** - 使用 `SetMetadata` 标记路由，守卫中通过 `Reflector` 读取
4. ✅ **最小权限** - 仅对确实需要公开的接口使用，避免意外暴露敏感数据

---

#### @Roles() - 角色权限装饰器

标记路由需要的角色权限，配合 `RolesGuard` 使用，实现 RBAC 权限控制。

```typescript
import { Roles } from '@/common/decorators';
import { UserRole } from '@/auth/entities/user.entity';

// 仅管理员可访问
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Delete('users/:id')
removeUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}

// 管理员或研究员可访问
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESEARCHER)
@Post('sightings')
createSighting(@Body() dto: CreateSightingDto) {
  return this.sightingsService.create(dto);
}

// 所有已认证用户可访问 (包括志愿者)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESEARCHER, UserRole.VOLUNTEER)
@Get('my-sightings')
findMySightings(@CurrentUser() user: User) {
  return this.sightingsService.findByUser(user.id);
}
```

**角色定义 (UserRole):**

```typescript
enum UserRole {
  ADMIN = 'admin',           // 系统管理员
  RESEARCHER = 'researcher', // 研究员
  VOLUNTEER = 'volunteer',   // 志愿者
  PUBLIC = 'public',         // 公众用户 (仅公开数据)
}
```

**角色权限矩阵:**

| 角色 | 数据查看 | 数据录入 | 数据编辑 | 数据删除 | 用户管理 | 系统配置 |
|------|---------|---------|---------|---------|---------|---------|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `RESEARCHER` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `VOLUNTEER` | ✅ | ✅ (有限) | ❌ | ❌ | ❌ | ❌ |
| `PUBLIC` | ✅ (公开) | ❌ | ❌ | ❌ | ❌ | ❌ |

**使用场景:**

| 场景 | 推荐角色 | 示例 |
|------|---------|------|
| 用户管理 | `ADMIN` | 创建/删除用户、重置密码 |
| 数据录入 | `RESEARCHER`, `VOLUNTEER` | 提交观测记录、照片 |
| 数据审核 | `RESEARCHER`, `ADMIN` | 审核志愿者提交的数据 |
| 系统配置 | `ADMIN` | 修改监测站点、物种分类 |
| 数据导出 | `RESEARCHER`, `ADMIN` | 导出研究数据 |
| 公开查询 | `PUBLIC` (或 `@Public()`) | 物种列表、观测地图 |

**注意事项:**

1. ⚠️ **守卫顺序** - `RolesGuard` 必须在 `JwtAuthGuard` 之后执行 (先认证，再授权)
2. ⚠️ **多角色支持** - `@Roles()` 可接受多个角色，用户拥有任一角色即可访问
3. ✅ **配合 CurrentUser** - 通常在控制器中同时使用 `@CurrentUser()` 获取用户信息
4. ✅ **细粒度控制** - 对于更细粒度的权限控制，可考虑基于资源/所有权的权限检查

---

#### @CurrentUser() - 当前用户装饰器

从请求中提取已认证的用户信息，需要在控制器中配合 `JwtAuthGuard` 使用。

```typescript
import { CurrentUser } from '@/common/decorators';
import { User } from '@/auth/entities/user.entity';

// 获取当前用户资料
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// 更新当前用户资料
@UseGuards(JwtAuthGuard)
@Patch('profile')
updateProfile(
  @CurrentUser() user: User,
  @Body() updateDto: UpdateProfileDto,
) {
  return this.usersService.update(user.id, updateDto);
}

// 获取当前用户的观测记录
@UseGuards(JwtAuthGuard)
@Get('my-sightings')
findMySightings(
  @CurrentUser() user: User,
  @Query(new PaginationPipe()) pagination: PaginationResult,
) {
  return this.sightingsService.findByUser(user.id, pagination);
}

// 创建资源时自动关联当前用户
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESEARCHER, UserRole.ADMIN)
@Post('sightings')
createSighting(
  @CurrentUser() user: User,
  @Body() dto: CreateSightingDto,
) {
  // 自动设置创建者
  return this.sightingsService.create({
    ...dto,
    createdBy: user.id,
  });
}
```

**User 实体结构:**

```typescript
interface User {
  id: string;              // UUID
  username: string;        // 用户名 (唯一)
  email: string;           // 邮箱 (唯一)
  nickname?: string;       // 昵称 (可选)
  role: UserRole;          // 角色
  isActive: boolean;       // 是否激活
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

**使用场景:**

| 场景 | 示例 | 说明 |
|------|------|------|
| 个人资料 | `GET /profile` | 获取当前用户信息 |
| 更新资料 | `PATCH /profile` | 更新当前用户信息 |
| 个人数据 | `GET /my-sightings` | 获取当前用户创建的数据 |
| 审计日志 | 创建/更新资源 | 自动记录操作者 |
| 权限检查 | 资源访问 | 检查是否为资源所有者 |

**注意事项:**

1. ⚠️ **需要认证** - 必须在已认证的路由中使用 (配合 `JwtAuthGuard`)
2. ⚠️ **类型安全** - 返回的 `User` 类型应包含必要的用户信息字段
3. ✅ **自动注入** - 无需手动从 request 中提取，装饰器自动处理
4. ✅ **可选字段提取** - 可传递参数提取特定字段：`@CurrentUser('username')`

---

#### 装饰器组合使用示例

**完整的 CRUD 控制器示例:**

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Public, Roles, CurrentUser } from '@/common/decorators';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { ParseUUIDPipe, PaginationPipe } from '@/common/pipes';
import { UserRole } from '@/auth/entities/user.entity';
import { User } from '@/auth/entities/user.entity';

@Controller('whales')
export class WhalesController {
  constructor(private readonly whalesService: WhalesService) {}

  // 公开查询 - 无需认证
  @Public()
  @Get()
  findAll(
    @Query(new PaginationPipe()) pagination: PaginationResult,
    @Query('speciesId', new ParseOptionalIntPipe()) speciesId?: number,
  ) {
    return this.whalesService.findAll(pagination, { speciesId });
  }

  // 查看详情 - 无需认证
  @Public()
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.whalesService.findOne(id);
  }

  // 创建鲸鱼个体 - 需要研究员或管理员权限
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateWhaleDto,
  ) {
    return this.whalesService.create(dto, user);
  }

  // 更新鲸鱼个体 - 需要研究员或管理员权限
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESEARCHER, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateWhaleDto,
  ) {
    return this.whalesService.update(id, dto);
  }

  // 删除鲸鱼个体 - 仅管理员
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.whalesService.remove(id);
  }
}
```

**守卫和装饰器注册 (main.ts):**

```typescript
import { JwtAuthGuard, RolesGuard } from '@/common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局守卫 - 所有路由默认需要 JWT 认证
  app.useGlobalGuards(new JwtAuthGuard(), new RolesGuard());
  
  // 其他全局配置...
  
  await app.listen(3000);
}
```

---

**装饰器速查表:**

| 装饰器 | 用途 | 配合 | 典型场景 |
|--------|------|------|---------|
| `@Public()` | 跳过认证 | `JwtAuthGuard` | 登录/注册/公开数据 |
| `@Roles(...)` | 角色限制 | `RolesGuard` | 权限控制 |
| `@CurrentUser()` | 获取用户 | `JwtAuthGuard` | 个人资料/审计日志 |

---

## 📋 快速参考

### Pipes (验证管道)

| 管道 | 用途 | 典型场景 |
|------|------|----------|
| `ParseIntPipe` | 必填整数 | 资源 ID、页码、数量限制 |
| `ParseFloatPipe` | 必填浮点数 | GPS 坐标、测量数据、距离半径 |
| `ParseStringPipe` | 必填字符串 | 名称、标识符、备注 (带长度/正则验证) |
| `ParseOptionalIntPipe` | 可选整数 | 分页参数、数量限制 |
| `ParseOptionalFloatPipe` | 可选浮点数 | 坐标、测量数据 |
| `ParseOptionalBooleanPipe` | 可选布尔值 | 状态筛选 (true/false/1/0/yes/no) |
| `ParseOptionalDatePipe` | 可选日期 | 日期范围筛选 |
| `ParseOptionalStringPipe` | 可选字符串 | 搜索关键词、名称 |
| `ParseEnumPipe` | 枚举值 | 性别/状态/等级筛选 |
| `PaginationPipe` | 分页参数 | 统一处理 page/limit/offset |
| `ParseISO8601Pipe` | 必填日期 | 时间范围查询的起止日期 |
| `ParseUUIDPipe` | UUID 验证 | 资源 ID 参数验证 |
| `ParseBooleanPipe` | 必填布尔值 | 状态开关/是否筛选 (true/false/1/0/yes/no) |
| `ParseEmailPipe` | 邮箱验证 | 用户注册/联系方式/通知邮箱 |
| `ParsePhonePipe` | 手机号验证 | 用户注册/研究员信息/紧急联系人 |
| `ParseUrlPipe` | URL 验证 | 网站链接/资源 URL/回调地址 |
| `ParseCoordinatePipe` | GPS 坐标验证 | 观测位置/迁徙轨迹/监测站点 |
| `ParseCoordinatePairPipe` | 坐标对验证 | 中心点定位/范围搜索 |
| `ParseArrayPipe` | 数组解析 | 多选筛选、批量操作、标签过滤 |

### Interceptors (拦截器)

| 拦截器 | 用途 | 装饰器 |
|--------|------|--------|
| `TransformInterceptor` | 统一响应格式 | - (响应格式：`{ success, data, message, timestamp, path }`) |
| `LoggingInterceptor` | 请求日志 | - |
| `CacheInterceptor` | 响应缓存 | `@CacheKey()`, `@CacheTTL()` |
| `TimeoutInterceptor` | 超时控制 | `@Timeout()` |
| `RateLimitInterceptor` | 速率限制 | `@RateLimit()`, `@RateLimitTTL()` |
| `ETagInterceptor` | 条件请求 | `@ETag()` |

### Guards (守卫)

| 守卫 | 用途 | 配合装饰器 |
|------|------|------------|
| `JwtAuthGuard` | JWT 认证 | `@Public()` 跳过认证 |
| `RolesGuard` | 角色权限 | `@Roles()` |

### Decorators (装饰器)

| 装饰器 | 用途 | 示例 |
|--------|------|------|
| `@Public()` | 跳过认证 | 登录/注册/公开数据 |
| `@Roles(...)` | 角色限制 | `@Roles(UserRole.ADMIN)` |
| `@CurrentUser()` | 获取用户 | `@CurrentUser() user: User` |

### Filters (过滤器)

| 过滤器 | 用途 |
|--------|------|
| `HttpExceptionFilter` | 格式化 HTTP 异常 |
| `AllExceptionsFilter` | 捕获所有未处理异常 |

### 全局注册 (main.ts)

```typescript
// Guards
app.useGlobalGuards(new JwtAuthGuard(), new RolesGuard());

// Interceptors
app.useGlobalInterceptors(
  new TransformInterceptor(),
  new LoggingInterceptor(),
  new CacheInterceptor(),
  new TimeoutInterceptor(),
  new RateLimitInterceptor(),
  new ETagInterceptor()
);

// Filters
app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
```

---

## 最佳实践

1. **全局工具放在 common/** - 避免跨模块循环依赖
2. **优先使用装饰器** - 保持控制器代码简洁
3. **统一错误处理** - 所有异常通过过滤器统一格式化
4. **响应格式一致** - 通过拦截器封装标准响应结构
5. **缓存 + 速率限制组合** - 高并发接口同时使用 `CacheInterceptor` 和 `RateLimitInterceptor`
6. **超时控制** - 复杂查询使用 `@Timeout()` 防止资源阻塞

---

*最后更新：2026-03-30 12:45*
