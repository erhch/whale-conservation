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
- `TimeoutInterceptor` - 请求超时控制 (防止慢查询阻塞资源)

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

---

### 📁 Pipes (验证管道)

✅ 已实现:

- `ParseOptionalIntPipe` - 可选整数解析管道 (支持默认值、范围验证)
- `ParseOptionalFloatPipe` - 可选浮点数解析管道 (支持默认值、范围验证、精度控制)
- `ParseOptionalBooleanPipe` - 可选布尔值解析管道 (支持多种格式)
- `ParseOptionalDatePipe` - 可选日期解析管道 (支持默认值、日期范围验证)
- `ParseOptionalStringPipe` - 可选字符串解析管道 (支持修剪、长度验证、正则匹配、大小写转换)
- `ParseEnumPipe` - 枚举值解析管道 (支持枚举类型验证、默认值、必填校验)

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

待实现:

- `ParseUUIDPipe` - UUID 解析 (NestJS 内置，可直接使用)
- 自定义业务验证管道 (根据业务需求扩展)

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

*最后更新：2026-03-28 14:10*
