# Interceptors 使用指南

> NestJS 拦截器完整文档 - 统一响应、日志、缓存、超时、限流、条件请求

版本：v0.1.0  
最后更新：2026-03-30

---

## 📌 概述

拦截器（Interceptors）是 NestJS 中强大的工具，可以在请求处理前后执行逻辑。本项目实现了 6 个核心拦截器，用于统一处理响应格式、日志记录、缓存、超时控制、速率限制和条件请求。

### 已实现拦截器

| 拦截器 | 用途 | 典型场景 |
|--------|------|----------|
| `TransformInterceptor` | 统一响应格式 | 所有 API 接口 |
| `LoggingInterceptor` | 请求日志记录 | 所有 API 接口 |
| `CacheInterceptor` | 响应缓存 | 频繁读取的静态数据 |
| `TimeoutInterceptor` | 请求超时控制 | 慢查询、大数据导出 |
| `RateLimitInterceptor` | 速率限制 | 防止 API 滥用 |
| `ETagInterceptor` | 条件请求支持 | 减少带宽消耗 |

### 执行顺序

```
请求进入
    ↓
1. LoggingInterceptor (记录请求)
    ↓
2. RateLimitInterceptor (检查限流)
    ↓
3. CacheInterceptor (检查缓存命中)
    ↓
4. TimeoutInterceptor (设置超时)
    ↓
5. ETagInterceptor (生成 ETag)
    ↓
6. 控制器处理
    ↓
7. TransformInterceptor (格式化响应)
    ↓
8. LoggingInterceptor (记录响应)
    ↓
响应返回
```

---

## 🚀 快速开始

### 全局注册 (main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { 
  TransformInterceptor,
  LoggingInterceptor,
  CacheInterceptor,
  TimeoutInterceptor,
  RateLimitInterceptor,
  ETagInterceptor,
} from '@/common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局拦截器注册
  app.useGlobalInterceptors(
    new LoggingInterceptor(),       // 1. 日志记录 (最先执行)
    new RateLimitInterceptor(),     // 2. 速率限制
    new CacheInterceptor(),         // 3. 缓存
    new TimeoutInterceptor(),       // 4. 超时控制
    new ETagInterceptor(),          // 5. ETag 条件请求
    new TransformInterceptor(),     // 6. 响应转换 (最后执行)
  );
  
  await app.listen(3000);
}
```

### 统一响应格式

所有成功响应自动封装为标准格式：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "timestamp": "2026-03-30T11:45:00.000Z",
  "path": "/api/v1/whales"
}
```

---

## 📁 TransformInterceptor - 统一响应格式

### 功能说明

自动将所有成功响应封装为标准格式，确保 API 响应一致性。

### 响应结构

```typescript
interface StandardResponse<T> {
  success: boolean;      // 是否成功
  data: T;               // 实际数据
  message?: string;      // 消息 (可选)
  timestamp: string;     // ISO 8601 时间戳
  path?: string;         // 请求路径
}
```

### 使用示例

```typescript
import { Controller, Get } from '@nestjs/common';
import { WhalesService } from './whales.service';

@Controller('whales')
export class WhalesController {
  constructor(private whalesService: WhalesService) {}

  // 返回数据自动封装
  @Get()
  findAll() {
    // 原始返回：[{ id: 1, name: '蓝鲸' }, ...]
    // 实际响应：{ success: true, data: [...], message: '操作成功', ... }
    return this.whalesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.whalesService.findOne(id);
  }
}
```

### 自定义消息

```typescript
import { SetMetadata } from '@nestjs/common';

// 在拦截器中检查元数据设置自定义消息
export const RESPONSE_MESSAGE = 'response_message';
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);

// 使用
@Get('create')
@ResponseMessage('创建成功')
create() {
  return this.service.create();
}
```

---

## 📁 LoggingInterceptor - 请求日志

### 功能说明

记录所有请求的详细信息，包括请求方法、路径、耗时、响应状态等。

### 日志格式

```
[请求] POST /api/v1/whales - 192.168.1.100 - Mozilla/5.0...
[响应] POST /api/v1/whales - 201 - 45ms
```

### 使用示例

```typescript
// 全局注册后自动生效，无需额外配置
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
```

### 日志内容

| 字段 | 说明 |
|------|------|
| 方法 | HTTP 方法 (GET/POST/PUT/DELETE) |
| 路径 | 请求 URL 路径 |
| IP | 客户端 IP 地址 |
| User-Agent | 客户端标识 |
| 状态码 | HTTP 响应状态码 |
| 耗时 | 请求处理时间 (毫秒) |

---

## 📁 CacheInterceptor - 响应缓存

### 功能说明

缓存 API 响应，减少数据库查询和计算开销，适用于频繁读取的静态数据。

### 装饰器

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@CacheKey()` | 自定义缓存键 | 键名 (string) |
| `@CacheTTL()` | 缓存有效期 | 毫秒数 (number) |

### 基础用法

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@/common/interceptors';

@Controller('species')
export class SpeciesController {
  // 缓存 5 分钟
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll() {
    return this.speciesService.findAll();
  }
}
```

### 自定义缓存键

```typescript
import { CacheKey, CacheTTL } from '@/common/interceptors';

@Controller('whales')
export class WhalesController {
  // 自定义缓存键
  @Get('stats')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('whale-statistics')
  @CacheTTL(600000)  // 10 分钟
  getStatistics() {
    return this.whalesService.getStatistics();
  }
}
```

### 动态缓存键

```typescript
@Get(':id')
@UseInterceptors(CacheInterceptor)
@CacheTTL(1800000)  // 30 分钟
findOne(@Param('id') id: string) {
  // 缓存键自动生成：cache:/api/v1/whales/{id}
  return this.whalesService.findOne(id);
}
```

### 缓存控制

```typescript
import { CacheInterceptor } from '@/common/interceptors';

@Controller('cache')
export class CacheController {
  constructor(private cacheInterceptor: CacheInterceptor) {}

  // 清除特定缓存
  @Post('clear/whales')
  clearWhalesCache() {
    this.cacheInterceptor.clearCache('whale-statistics');
    return { message: '缓存已清除' };
  }

  // 清除所有缓存
  @Post('clear/all')
  clearAllCache() {
    this.cacheInterceptor.clearAllCache();
    return { message: '所有缓存已清除' };
  }

  // 获取缓存统计
  @Get('stats')
  getCacheStats() {
    const stats = this.cacheInterceptor.getCacheStats();
    // { hits: 150, misses: 30, size: 45, totalKeys: 45 }
    return stats;
  }
}
```

### 缓存失效场景

```typescript
// 创建新数据后清除相关缓存
@Post()
async create(@Body() createDto: CreateWhaleDto) {
  const result = await this.whalesService.create(createDto);
  
  // 清除列表缓存
  this.cacheInterceptor.clearCache('cache:/api/v1/whales');
  
  return result;
}

// 更新数据后清除相关缓存
@Patch(':id')
async update(@Param('id') id: string, @Body() updateDto: UpdateWhaleDto) {
  const result = await this.whalesService.update(id, updateDto);
  
  // 清除单个和列表缓存
  this.cacheInterceptor.clearCache(`cache:/api/v1/whales/${id}`);
  this.cacheInterceptor.clearCache('cache:/api/v1/whales');
  
  return result;
}
```

### 推荐缓存策略

| 数据类型 | 推荐 TTL | 说明 |
|----------|----------|------|
| 物种列表 | 30 分钟 | 变化频率低 |
| 观测站点 | 1 小时 | 基本不变 |
| 统计数据 | 10 分钟 | 定期计算 |
| 个体详情 | 5 分钟 | 可能更新 |
| 实时位置 | 1 分钟 | 高频更新 |

---

## 📁 TimeoutInterceptor - 超时控制

### 功能说明

设置 API 请求的最大执行时间，防止慢查询阻塞服务器资源。

### 装饰器

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@Timeout()` | 自定义超时时间 | 毫秒数 (number) |

### 默认超时

- 默认超时时间：**30 秒**
- 适用于所有使用拦截器的接口

### 基础用法

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { TimeoutInterceptor } from '@/common/interceptors';

@Controller('export')
export class ExportController {
  // 使用默认 30 秒超时
  @Get('report')
  @UseInterceptors(TimeoutInterceptor)
  generateReport() {
    return this.exportService.generateReport();
  }
}
```

### 自定义超时时间

```typescript
import { Timeout } from '@/common/interceptors';

@Controller('data')
export class DataController {
  // 快速接口 - 5 秒超时
  @Get('health')
  @UseInterceptors(TimeoutInterceptor)
  @Timeout(5000)
  healthCheck() {
    return this.healthService.check();
  }

  // 大数据导出 - 120 秒超时
  @Get('export/all')
  @UseInterceptors(TimeoutInterceptor)
  @Timeout(120000)
  exportAllData() {
    return this.exportService.exportAll();
  }

  // 复杂查询 - 60 秒超时
  @Get('analytics')
  @UseInterceptors(TimeoutInterceptor)
  @Timeout(60000)
  getAnalytics() {
    return this.analyticsService.compute();
  }
}
```

### 超时响应

```json
{
  "statusCode": 408,
  "message": "请求超时",
  "error": "Request Timeout"
}
```

### 推荐超时设置

| 接口类型 | 推荐超时 | 说明 |
|----------|----------|------|
| 健康检查 | 5 秒 | 快速响应 |
| 简单查询 | 10 秒 | 单表查询 |
| 复杂查询 | 30-60 秒 | 多表关联/聚合 |
| 数据导出 | 120 秒 | 大数据量 |
| 报表生成 | 60 秒 | 计算密集型 |

---

## 📁 RateLimitInterceptor - 速率限制

### 功能说明

限制客户端在指定时间内的请求次数，防止 API 滥用和 DDoS 攻击。

### 装饰器

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@RateLimit()` | 限流配置 | limit(次数), ttl(毫秒) |
| `@RateLimitTTL()` | 仅设置时间窗口 | 毫秒数 (number) |

### 基础用法

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { RateLimitInterceptor, RateLimit } from '@/common/interceptors';

@Controller('api')
export class ApiController {
  // 限制：60 秒内最多 10 次请求
  @Get('data')
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ limit: 10, ttl: 60000 })
  getData() {
    return this.apiService.getData();
  }
}
```

### 不同限流策略

```typescript
import { RateLimit } from '@/common/interceptors';

@Controller('resources')
export class ResourcesController {
  // 严格限流 - 登录接口
  @Post('login')
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ limit: 5, ttl: 60000 })  // 1 分钟 5 次
  login(@Body() credentials: CredentialsDto) {
    return this.authService.login(credentials);
  }

  // 中等限流 - 数据查询
  @Get('search')
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ limit: 30, ttl: 60000 })  // 1 分钟 30 次
  search(@Query() query: SearchDto) {
    return this.searchService.search(query);
  }

  // 宽松限流 - 公开数据
  @Get('public')
  @UseInterceptors(RateLimitInterceptor)
  @RateLimit({ limit: 100, ttl: 60000 })  // 1 分钟 100 次
  getPublicData() {
    return this.publicService.getData();
  }
}
```

### 仅设置时间窗口

```typescript
import { RateLimitTTL } from '@/common/interceptors';

// 使用默认 limit，仅自定义时间窗口
@Get('status')
@UseInterceptors(RateLimitInterceptor)
@RateLimitTTL(10000)  // 10 秒窗口
getStatus() {
  return this.statusService.get();
}
```

### 限流响应

```json
{
  "statusCode": 429,
  "message": "请求过于频繁，请稍后再试",
  "error": "Too Many Requests",
  "retryAfter": 45  // 建议等待时间 (秒)
}
```

### 推荐限流策略

| 接口类型 | limit | ttl | 说明 |
|----------|-------|-----|------|
| 登录/注册 | 5 | 60s | 防止暴力破解 |
| 密码重置 | 3 | 300s | 防止滥用 |
| 数据查询 | 30 | 60s | 正常使用 |
| 数据写入 | 10 | 60s | 防止刷屏 |
| 公开接口 | 100 | 60s | 宽松限制 |

### 组合使用示例

```typescript
import { 
  UseInterceptors,
  CacheInterceptor,
  RateLimitInterceptor,
  CacheTTL,
  RateLimit,
} from '@/common/interceptors';

// 缓存 + 限流组合
@Get('trending')
@UseInterceptors(CacheInterceptor, RateLimitInterceptor)
@CacheTTL(60000)      // 缓存 1 分钟
@RateLimit({ limit: 20, ttl: 60000 })  // 1 分钟 20 次
getTrending() {
  return this.trendingService.get();
}
```

---

## 📁 ETagInterceptor - 条件请求

### 功能说明

基于 ETag 的 HTTP 条件请求支持，减少带宽消耗和服务器负载。

### 装饰器

| 装饰器 | 用途 | 参数 |
|--------|------|------|
| `@ETag()` | 自定义 ETag 生成 | 生成函数 |

### 工作原理

1. 服务器生成资源 ETag (基于内容哈希)
2. 客户端缓存响应和 ETag
3. 后续请求携带 `If-None-Match` 头
4. 服务器比较 ETag，未变化返回 304 Not Modified

### 基础用法

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ETagInterceptor } from '@/common/interceptors';

@Controller('config')
export class ConfigController {
  // 自动计算 ETag
  @Get('app')
  @UseInterceptors(ETagInterceptor)
  getAppConfig() {
    return this.configService.getAppConfig();
  }
}
```

### 客户端使用

```bash
# 第一次请求
curl -i https://api.example.com/api/v1/config/app
# 响应：200 OK + ETag: "abc123"

# 第二次请求 (携带 ETag)
curl -i -H 'If-None-Match: "abc123"' https://api.example.com/api/v1/config/app
# 响应：304 Not Modified (无响应体)
```

### 自定义 ETag 生成

```typescript
import { ETag } from '@/common/interceptors';
import { createHash } from 'crypto';

@Controller('data')
export class DataController {
  @Get('version')
  @UseInterceptors(ETagInterceptor)
  @ETag((data) => {
    // 基于版本号生成 ETag
    return `v${data.version}`;
  })
  getVersionedData() {
    return this.dataService.getVersionedData();
  }
}
```

### 组合缓存 + ETag

```typescript
import { 
  UseInterceptors,
  CacheInterceptor,
  ETagInterceptor,
  CacheTTL,
} from '@/common/interceptors';

@Get('static')
@UseInterceptors(CacheInterceptor, ETagInterceptor)
@CacheTTL(3600000)  // 服务器缓存 1 小时
getStaticData() {
  return this.staticService.getData();
}
```

### 适用场景

| 场景 | 推荐 | 说明 |
|------|------|------|
| 静态配置 | ✅ | 很少变化 |
| 版本化数据 | ✅ | 版本号作为 ETag |
| 实时数据 | ❌ | 频繁变化，ETag 失效快 |
| 大文件下载 | ✅ | 显著节省带宽 |

---

## 🔄 拦截器组合使用

### 典型组合模式

```typescript
import { 
  UseInterceptors,
  TransformInterceptor,
  LoggingInterceptor,
  CacheInterceptor,
  RateLimitInterceptor,
  TimeoutInterceptor,
  ETagInterceptor,
  CacheTTL,
  RateLimit,
  Timeout,
} from '@/common/interceptors';

@Controller('analytics')
export class AnalyticsController {
  
  // 完整组合：日志 + 限流 + 缓存 + 超时 + ETag + 响应转换
  @Get('dashboard')
  @UseInterceptors(
    LoggingInterceptor,      // 记录请求
    RateLimitInterceptor,    // 限流保护
    CacheInterceptor,        // 响应缓存
    TimeoutInterceptor,      // 超时控制
    ETagInterceptor,         // 条件请求
    TransformInterceptor,    // 响应格式
  )
  @RateLimit({ limit: 20, ttl: 60000 })  // 1 分钟 20 次
  @CacheTTL(300000)                       // 缓存 5 分钟
  @Timeout(30000)                         // 30 秒超时
  getDashboard() {
    return this.analyticsService.getDashboard();
  }
}
```

### 组合优先级

```
1. LoggingInterceptor     - 始终最先 (记录入口)
2. RateLimitInterceptor   - 早期拦截 (防止滥用)
3. CacheInterceptor       - 检查缓存 (快速返回)
4. TimeoutInterceptor     - 设置超时 (保护资源)
5. ETagInterceptor        - 条件请求 (节省带宽)
6. TransformInterceptor   - 始终最后 (格式化输出)
```

---

## 📊 拦截器选择指南

| 需求 | 推荐拦截器 | 配置建议 |
|------|------------|----------|
| 统一响应格式 | `TransformInterceptor` | 全局注册 |
| 请求日志 | `LoggingInterceptor` | 全局注册 |
| 减少数据库查询 | `CacheInterceptor` | @CacheTTL(5-60 分钟) |
| 防止慢查询 | `TimeoutInterceptor` | @Timeout(10-60 秒) |
| 防止 API 滥用 | `RateLimitInterceptor` | @RateLimit(10-100 次/分钟) |
| 节省带宽 | `ETagInterceptor` | 静态/版本化数据 |

---

## 🔧 故障排查

### 缓存不生效

```typescript
// 检查点：
// 1. 拦截器是否正确注册
app.useGlobalInterceptors(new CacheInterceptor());

// 2. 是否使用了 @CacheTTL 装饰器
@CacheTTL(300000)

// 3. 检查缓存键是否唯一
@CacheKey('unique-key')

// 4. 清除缓存后测试
this.cacheInterceptor.clearAllCache();
```

### 限流过于严格

```typescript
// 调整限流参数
@RateLimit({ 
  limit: 50,      // 增加请求次数
  ttl: 120000     // 延长窗口时间 (2 分钟)
})
```

### 超时频繁触发

```typescript
// 增加超时时间
@Timeout(120000)  // 120 秒

// 或优化查询性能
// - 添加数据库索引
// - 使用分页
// - 缓存中间结果
```

---

## 📝 最佳实践

### 1. 全局注册基础拦截器

```typescript
// main.ts
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
);
```

### 2. 按需使用功能拦截器

```typescript
// 仅在需要的接口使用
@UseInterceptors(CacheInterceptor)
@CacheTTL(300000)
```

### 3. 合理设置缓存时间

```typescript
// 静态数据：长缓存
@CacheTTL(3600000)  // 1 小时

// 动态数据：短缓存
@CacheTTL(60000)    // 1 分钟
```

### 4. 数据变更后清除缓存

```typescript
@Patch(':id')
async update(@Param('id') id: string, @Body() dto: UpdateDto) {
  const result = await this.service.update(id, dto);
  
  // 清除相关缓存
  this.cacheInterceptor.clearCache(`cache:/api/v1/resource/${id}`);
  this.cacheInterceptor.clearCache('cache:/api/v1/resource');
  
  return result;
}
```

### 5. 限流保护敏感接口

```typescript
// 登录接口严格限流
@Post('login')
@RateLimit({ limit: 5, ttl: 60000 })
login(@Body() credentials: CredentialsDto) {
  return this.authService.login(credentials);
}
```

---

## 📚 相关文档

- [API 设计文档](./api-design.md) - API 规范
- [API 示例](./api-examples.md) - 使用示例
- [Common 模块速查](./common-quickstart.md) - 快速参考
- [数据字典](./data-dictionary.md) - 数据结构

---

**文档版本:** v0.1.0  
**维护者:** 鲸创开发团队  
**最后更新:** 2026-03-30
