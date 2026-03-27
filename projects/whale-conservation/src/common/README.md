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
| `AllExceptionsFilter` | 捕获所有未处理的异常 |

**使用示例:**

```typescript
// main.ts
app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());
```

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

### 📁 Guards (路由守卫)

✅ 已实现:

- `JwtAuthGuard` - JWT 认证守卫 (支持 @Public() 装饰器跳过认证)
- `RolesGuard` - RBAC 角色权限守卫 (配合 @Roles() 装饰器使用)

待实现:

- (无)

### 📁 Interceptors (拦截器)

✅ 已实现:

- `TransformInterceptor` - 统一响应格式封装
- `LoggingInterceptor` - 请求日志记录
- `CacheInterceptor` - 响应缓存 (支持自定义缓存键和 TTL)

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

---

### 📁 Pipes (验证管道)

✅ 已实现:

- `ParseOptionalIntPipe` - 可选整数解析管道 (支持默认值、范围验证)
- `ParseOptionalFloatPipe` - 可选浮点数解析管道 (支持默认值、范围验证)
- `ParseOptionalBooleanPipe` - 可选布尔值解析管道 (支持多种格式)

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
```

**选项说明:**

| 选项 | 类型 | 说明 |
|------|------|------|
| `defaultValue` | `number \| boolean` | 当参数为空时的默认值 |
| `min` | `number` | 最小值限制 (仅整数/浮点数管道) |
| `max` | `number` | 最大值限制 (仅整数/浮点数管道) |

**ParseOptionalBooleanPipe 支持的输入格式:**

| 输入值 | 解析结果 |
|--------|----------|
| `'true'`, `'1'`, `'yes'`, `'on'`, `'y'` | `true` |
| `'false'`, `'0'`, `'no'`, `'off'`, `'n'` | `false` |
| `undefined`, `null`, `''` | 默认值 |
| 其他 | 抛出 BadRequestException |

待实现:

- `ParseUUIDPipe` - UUID 解析 (NestJS 内置)
- 自定义业务验证管道

### 📁 Decorators (装饰器)

✅ 已实现:

- `@Public()` - 标记公开路由 (跳过 JWT 认证)
- `@Roles(...)` - 角色权限装饰器 (配合 RolesGuard 使用)
- `@CurrentUser()` - 获取当前用户装饰器

待实现:

- (无)

**@Public() 使用示例:**

```typescript
// 公开路由 - 无需登录即可访问
@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

@Public()
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}
```

**装饰器使用示例:**

```typescript
// 角色权限控制
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESEARCHER)
@Delete(':id')
remove(@Param('id') id: string) {
  return this.speciesService.remove(id);
}

// 获取当前用户信息
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return {
    username: user.username,
    role: user.role,
    nickname: user.nickname,
  };
}
```

**角色权限说明:**

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `ADMIN` | 系统管理员 | 全部权限 |
| `RESEARCHER` | 研究员 | 数据录入、编辑、分析 |
| `VOLUNTEER` | 志愿者 | 数据查看、有限录入 |
| `PUBLIC` | 公众用户 | 仅公开数据查看 |

---

## 最佳实践

1. **全局工具放在 common/** - 避免跨模块循环依赖
2. **优先使用装饰器** - 保持控制器代码简洁
3. **统一错误处理** - 所有异常通过过滤器统一格式化
4. **响应格式一致** - 通过拦截器封装标准响应结构

---

*最后更新：2026-03-28 05:50*
