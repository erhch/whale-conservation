# Interceptors - 拦截器模块

本模块提供 6 个通用拦截器，用于统一处理请求/响应的横切关注点。

## 快速开始

在 `main.ts` 中全局注册常用拦截器：

```typescript
import { Module } from '@nestjs/common';
import { TransformInterceptor, LoggingInterceptor, CacheInterceptor, TimeoutInterceptor, RateLimitInterceptor, ETagInterceptor } from './common/interceptors';

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ETagInterceptor },
  ],
})
export class AppModule {}
```

或在控制器/方法级别使用 `@UseInterceptors()` 装饰器。

---

## 拦截器列表

### 1. TransformInterceptor - 统一响应格式

**文件**: `transform.interceptor.ts`

将所有成功响应封装为标准格式：

```typescript
{
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path?: string;
}
```

**使用示例**:

```typescript
// 全局注册后自动生效
@Get('species')
findAll() {
  return this.speciesService.findAll();
}

// 输出:
// {
//   success: true,
//   data: [...],
//   message: '操作成功',
//   timestamp: '2026-03-30T12:00:00.000Z',
//   path: '/species'
// }
```

---

### 2. LoggingInterceptor - 请求日志

**文件**: `logging.interceptor.ts`

记录每个请求的 HTTP 方法、URL、状态码和处理时间。

**日志格式**:
```
[HTTP] GET /api/species 200 - 45ms
[HTTP] POST /api/whales 201 - 123ms
[HTTP] GET /api/sightings/500 404 - 12ms
```

**使用示例**:

```typescript
// 全局注册后自动记录所有请求
@UseInterceptors(LoggingInterceptor)
@Get('debug')
debugEndpoint() {
  return { message: 'Debug info' };
}
```

---

### 3. CacheInterceptor - 响应缓存

**文件**: `cache.interceptor.ts`

缓存 GET 请求响应，减少数据库查询压力。默认缓存 5 分钟。

**装饰器**:
- `@CacheKey(key: string)` - 自定义缓存键
- `@CacheTTL(ttl: number)` - 自定义缓存时间 (秒)

**使用示例**:

```typescript
import { CacheInterceptor, CacheKey, CacheTTL } from './common/interceptors';

// 基础用法 - 默认 5 分钟缓存
@UseInterceptors(CacheInterceptor)
@Get('species')
findAll() {
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

**响应头**:
- `X-Cache: HIT` - 缓存命中
- `X-Cache: MISS` - 缓存未命中

---

### 4. TimeoutInterceptor - 请求超时控制

**文件**: `timeout.interceptor.ts`

控制 API 请求的最大执行时间，防止慢查询阻塞服务器。默认超时 30 秒。

**装饰器**:
- `@Timeout(ms: number)` - 自定义超时时间 (毫秒)

**使用示例**:

```typescript
import { TimeoutInterceptor, Timeout } from './common/interceptors';

// 默认 30 秒超时
@UseInterceptors(TimeoutInterceptor)
@Get('large-dataset')
findLargeDataset() {
  return this.service.findLargeDataset();
}

// 自定义 60 秒超时
@UseInterceptors(TimeoutInterceptor)
@Timeout(60000)
@Get('complex-query')
findComplexQuery() {
  return this.service.findComplexQuery();
}

// 快速接口 - 5 秒超时
@UseInterceptors(TimeoutInterceptor)
@Timeout(5000)
@Get('health')
healthCheck() {
  return this.service.health();
}
```

**异常**: 超时会抛出 `RequestTimeoutException` (HTTP 408)

---

### 5. RateLimitInterceptor - 速率限制

**文件**: `rate-limit.interceptor.ts`

限制 API 请求频率，防止滥用和 DDoS 攻击。默认 100 次/分钟。

**装饰器**:
- `@RateLimit(limit: number)` - 最大请求次数
- `@RateLimitTTL(ttl: number)` - 时间窗口 (秒)

**使用示例**:

```typescript
import { RateLimitInterceptor, RateLimit, RateLimitTTL } from './common/interceptors';

// 默认 100 次/分钟
@UseInterceptors(RateLimitInterceptor)
@Get('species')
findAllSpecies() {
  return this.speciesService.findAll();
}

// 严格限制 - 10 次/分钟 (登录接口)
@UseInterceptors(RateLimitInterceptor)
@RateLimit(10)
@RateLimitTTL(60)
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// 宽松限制 - 1000 次/分钟 (公开数据)
@UseInterceptors(RateLimitInterceptor)
@RateLimit(1000)
@RateLimitTTL(60)
@Get('public/data')
getPublicData() {
  return this.publicService.getData();
}
```

**异常**: 超出限制会抛出 `TooManyRequestsException` (HTTP 429)

**响应头**: `Retry-After: <seconds>`

---

### 6. ETagInterceptor - HTTP 条件请求

**文件**: `etag.interceptor.ts`

通过 ETag 和 If-None-Match 头实现客户端缓存验证，支持 304 Not Modified。

**装饰器**:
- `@ETag(weak?: boolean)` - 启用 ETag (可选弱验证)

**使用示例**:

```typescript
import { ETagInterceptor, ETag } from './common/interceptors';

// 全局注册后自动生效
@Get('species/:id')
findOne(@Param('id') id: string) {
  return this.speciesService.findOne(id);
}

// 弱验证 ETag (适合内容频繁变化但语义不变的场景)
@UseInterceptors(ETagInterceptor)
@ETag(true)
@Get('feed')
getFeed() {
  return this.feedService.getLatest();
}
```

**工作原理**:
1. 服务器生成响应体的哈希值作为 ETag
2. 客户端后续请求携带 `If-None-Match: <etag>` 头
3. 如果 ETag 匹配，返回 304 Not Modified (无 body)
4. 如果不匹配，返回 200 + 新数据

**响应头**:
- `ETag: "<hash>"` - 强验证
- `ETag: W/"<hash>"` - 弱验证
- `Vary: If-None-Match` - 缓存策略

---

## 组合使用示例

```typescript
import {
  UseInterceptors,
  CacheInterceptor,
  TimeoutInterceptor,
  RateLimitInterceptor,
} from './common/interceptors';

@Controller('whales')
export class WhalesController {
  
  // 组合使用多个拦截器
  @Get()
  @UseInterceptors(CacheInterceptor, TimeoutInterceptor, RateLimitInterceptor)
  @CacheTTL(300)      // 缓存 5 分钟
  @Timeout(30000)     // 30 秒超时
  @RateLimit(100)     // 100 次/分钟
  findAll() {
    return this.whalesService.findAll();
  }
  
  // 敏感操作 - 严格限流
  @Post()
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit(5)       // 5 次/分钟
  @RateLimitTTL(60)
  create(@Body() dto: CreateWhaleDto) {
    return this.whalesService.create(dto);
  }
}
```

---

## 最佳实践

### 1. 全局 vs 局部注册

- **全局**: TransformInterceptor, LoggingInterceptor, ETagInterceptor
- **局部**: CacheInterceptor, TimeoutInterceptor, RateLimitInterceptor (按需使用)

### 2. 缓存策略

| 数据类型 | 建议 TTL | 说明 |
|---------|---------|------|
| 配置数据 | 1 小时 | 很少变化 |
| 物种列表 | 30 分钟 | 定期更新 |
| 观测记录 | 5 分钟 | 频繁更新 |
| 统计数据 | 1 小时 | 计算密集型 |
| 实时数据 | 不缓存 | 使用 @CacheKey 跳过 |

### 3. 超时设置

| 接口类型 | 建议超时 | 说明 |
|---------|---------|------|
| 健康检查 | 5 秒 | 快速失败 |
| 简单查询 | 10-30 秒 | 常规操作 |
| 复杂查询 | 60 秒 | 报表/导出 |
| 文件上传 | 120 秒 | 大文件处理 |

### 4. 速率限制

| 接口类型 | 限制 | 说明 |
|---------|------|------|
| 公开 API | 1000 次/分钟 | 低敏感度 |
| 认证用户 | 100 次/分钟 | 默认限制 |
| 登录接口 | 10 次/分钟 | 防暴力破解 |
| 敏感操作 | 5 次/分钟 | 删除/导出等 |

---

## 监控与调试

### 查看缓存状态

```typescript
// 在 service 中注入 CacheInterceptor
constructor(private cacheInterceptor: CacheInterceptor) {}

// 获取缓存统计
const stats = this.cacheInterceptor.getCacheStats();
console.log(`缓存条目：${stats.size}`);
console.log(`缓存键：${stats.keys}`);
```

### 查看速率限制状态

```typescript
// 在 service 中注入 RateLimitInterceptor
constructor(private rateLimitInterceptor: RateLimitInterceptor) {}

// 获取速率限制统计
const stats = this.rateLimitInterceptor.getStats();
console.log(`受限制客户端：${stats.totalKeys}`);
```

### 清除缓存

```typescript
// 清除指定缓存
this.cacheInterceptor.clearCache('home-page-data');

// 清除所有缓存
this.cacheInterceptor.clearAllCache();
```

### 清除速率限制

```typescript
// 清除指定客户端
this.rateLimitInterceptor.clearClient('192.168.1.100');

// 清除所有记录
this.rateLimitInterceptor.clearAll();
```

---

## 故障排除

### 问题：缓存不生效

**检查**:
1. 确认是 GET 请求 (仅 GET 被缓存)
2. 检查 `X-Cache` 响应头 (HIT/MISS)
3. 确认没有使用 `@CacheKey` 冲突

### 问题：速率限制过于严格

**解决**:
1. 增加 `@RateLimit` 次数
2. 增加 `@RateLimitTTL` 时间窗口
3. 对可信 IP 使用白名单 (需自定义)

### 问题：304 响应导致数据不更新

**解决**:
1. 检查 ETag 生成逻辑
2. 对实时数据使用 `@ETag(false)` 禁用
3. 客户端强制刷新缓存

---

## 相关文件

- `index.ts` - 拦截器导出入口
- `transform.interceptor.ts` - 统一响应格式
- `logging.interceptor.ts` - 请求日志
- `cache.interceptor.ts` - 响应缓存
- `timeout.interceptor.ts` - 超时控制
- `rate-limit.interceptor.ts` - 速率限制
- `etag.interceptor.ts` - 条件请求
