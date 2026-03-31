# Filters - 异常过滤器

本目录包含全局异常过滤器，用于统一格式化错误响应格式。

## 文件列表

| 文件 | 说明 |
|------|------|
| `http-exception.filter.ts` | 统一格式化 HTTP 异常响应 |
| `index.ts` | 统一导出 (推荐使用 `import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters'`) |

---

## 快速使用

### 全局注册 (main.ts)

```typescript
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 注册过滤器 (推荐顺序：先 HTTP 异常，再兜底异常)
  app.useGlobalFilters(
    new HttpExceptionFilter(),      // 处理标准 HTTP 异常
    new AllExceptionsFilter()       // 兜底捕获所有未处理异常
  );
  
  await app.listen(3000);
}
```

---

## 过滤器说明

### HttpExceptionFilter - HTTP 异常过滤器

**作用:** 捕获并格式化所有 `HttpException` 及其子类异常。

**捕获的异常类型:**
- `HttpException` - 基础 HTTP 异常
- `BadRequestException` - 400 请求错误
- `UnauthorizedException` - 401 未授权
- `ForbiddenException` - 403 禁止访问
- `NotFoundException` - 404 资源不存在
- `ConflictException` - 409 资源冲突
- `InternalServerErrorException` - 500 服务器错误
- 所有其他 `HttpException` 子类

**统一响应格式:**

```json
{
  "statusCode": 404,
  "timestamp": "2026-03-31T03:46:00.000Z",
  "path": "/api/v1/whales/999",
  "message": "鲸鱼个体不存在",
  "error": "Not Found"
}
```

**响应字段说明:**

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusCode` | number | HTTP 状态码 |
| `timestamp` | string | ISO 8601 格式时间戳 |
| `path` | string | 请求路径 |
| `message` | string \| string[] | 错误消息 |
| `error` | string | 错误类型名称 (可选) |

---

### AllExceptionsFilter - 全局兜底异常过滤器

**作用:** 捕获所有未被处理的异常，作为最后一道防线。

**捕获的异常类型:**
- 未捕获的 JavaScript 异常
- 数据库连接错误
- 第三方 API 调用失败
- 代码逻辑错误
- 所有未被 `HttpExceptionFilter` 捕获的异常

**响应格式:**

```json
{
  "statusCode": 500,
  "timestamp": "2026-03-31T03:46:00.000Z",
  "path": "/api/v1/whales/complex-query",
  "message": "服务器内部错误",
  "error": "Internal Server Error"
}
```

---

## 使用示例

### 在控制器中抛出标准 HTTP 异常

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

@Controller('whales')
export class WhalesController {
  // 404 - 资源不存在
  @Get(':id')
  findOne(@Param('id') id: string) {
    const whale = this.whalesService.findOne(id);
    if (!whale) {
      throw new NotFoundException(`鲸鱼个体 ${id} 不存在`);
    }
    return whale;
  }

  // 400 - 参数验证失败
  @Post()
  create(@Body() dto: CreateWhaleDto) {
    if (!dto.identifier || dto.identifier.length < 3) {
      throw new BadRequestException('标识符长度不能少于 3 个字符');
    }
    return this.whalesService.create(dto);
  }

  // 409 - 资源冲突
  @Post()
  async create(@Body() dto: CreateWhaleDto) {
    try {
      return await this.whalesService.create(dto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(`标识符 ${dto.identifier} 已存在`);
      }
      throw error;
    }
  }
}
```

### 自定义错误响应

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

// 自定义错误响应格式
throw new HttpException(
  {
    statusCode: 400,
    message: '观测数据验证失败',
    error: 'ValidationFailed',
    details: [
      { field: 'latitude', message: '必须在 -90 到 90 之间' },
      { field: 'longitude', message: '必须在 -180 到 180 之间' },
    ],
  },
  HttpStatus.BAD_REQUEST
);
```

---

## 常见 HTTP 状态码参考

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

## 过滤器执行顺序

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

**完整请求处理流程:**

```
请求进入
    ↓
LoggingInterceptor (记录请求)
    ↓
控制器执行 → 可能抛出异常
    ↓
异常抛出 → HttpExceptionFilter (如果是 HTTP 异常)
    ↓
未处理异常 → AllExceptionsFilter (兜底捕获)
    ↓
响应返回 → TransformInterceptor (格式化响应)
    ↓
LoggingInterceptor (记录响应)
    ↓
响应发出
```

---

## 最佳实践

### ✅ 推荐

1. **统一错误格式** - 所有错误响应保持相同结构，便于前端处理
2. **使用语义化异常** - 选择正确的异常类型 (NotFoundException vs BadRequestException)
3. **提供有意义的错误消息** - 避免暴露敏感信息，但要有足够信息用于排查
4. **记录详细日志** - 在过滤器中记录完整错误堆栈用于排查
5. **兜底保护** - AllExceptionsFilter 确保没有异常会直接暴露给用户

### ❌ 避免

1. **直接抛出原始错误** - 不要返回数据库错误、堆栈跟踪等敏感信息
2. **模糊的错误消息** - 避免只返回"出错了"，要说明具体原因
3. **在过滤器中处理业务逻辑** - 过滤器只负责格式化，业务验证应在控制器/服务层
4. **忘记注册 AllExceptionsFilter** - 未捕获的异常会导致服务器崩溃

---

## 与前端集成

### 前端错误处理示例 (TypeScript)

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

## 调试技巧

### 查看过滤器日志

```bash
# 开发模式下查看完整错误日志
export LOG_LEVEL=debug

# 查看 NestJS 应用日志
docker compose logs -f api | grep -E "(Exception|Error|Filter)"
```

### 测试错误响应

```bash
# 测试 404 - 资源不存在
curl -i http://localhost:3000/api/v1/whales/00000000-0000-0000-0000-000000000000

# 测试 401 - 未认证
curl -i http://localhost:3000/api/v1/users/profile

# 测试 400 - 参数错误
curl -i -X POST http://localhost:3000/api/v1/whales \
  -H "Content-Type: application/json" \
  -d '{"identifier": "ab"}'
```

---

*最后更新：2026-03-31*
