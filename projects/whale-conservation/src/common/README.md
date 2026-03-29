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
- `index.ts` - 统一导出 (推荐使用 `import { JwtAuthGuard, RolesGuard } from '@/common/guards'`)

待实现:

- (无)

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

### 📁 Pipes (验证管道)

✅ 已实现:

- `ParseOptionalIntPipe` - 可选整数解析管道 (支持默认值、范围验证)
- `ParseOptionalFloatPipe` - 可选浮点数解析管道 (支持默认值、范围验证、精度控制)
- `ParseOptionalBooleanPipe` - 可选布尔值解析管道 (支持多种格式)
- `ParseOptionalDatePipe` - 可选日期解析管道 (支持默认值、日期范围验证)
- `ParseOptionalStringPipe` - 可选字符串解析管道 (支持修剪、长度验证、正则匹配、大小写转换)
- `ParseEnumPipe` - 枚举值解析管道 (支持枚举类型验证、默认值、必填校验)
- `PaginationPipe` - 分页参数解析管道 (统一处理 page/limit，自动计算 offset)
- `ParseISO8601Pipe` - 必填 ISO 8601 日期解析管道 (支持范围验证)

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

*最后更新：2026-03-29 21:42*
