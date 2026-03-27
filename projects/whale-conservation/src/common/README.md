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

待实现:

- `CacheInterceptor` - 响应缓存

### 📁 Pipes (验证管道)

待实现:

- `ParseIntPipe` - 整数解析 (NestJS 内置)
- `ParseUUIDPipe` - UUID 解析 (NestJS 内置)
- 自定义业务验证管道

### 📁 Decorators (装饰器)

✅ 已实现:

- `@Public()` - 标记公开路由 (跳过认证)
- `@Roles(...)` - 角色权限装饰器 (配合 RolesGuard 使用)
- `@CurrentUser()` - 获取当前用户装饰器

待实现:

- (无)

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

*最后更新：2026-03-27 23:35*
