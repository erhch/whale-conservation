# Decorators Tests - 装饰器单元测试

本目录包含 Common Decorators 模块的单元测试。

## 测试文件

| 文件 | 测试目标 | 测试用例数 |
|------|----------|-----------|
| `public.decorator.spec.ts` | `@Public()` 装饰器 | 5 |
| `roles.decorator.spec.ts` | `@Roles()` 装饰器 | 9 |
| `current-user.decorator.spec.ts` | `@CurrentUser()` 装饰器 | 10 |

## 运行测试

```bash
# 运行所有装饰器测试
npm test -- decorators/tests

# 运行单个测试文件
npm test -- public.decorator.spec
npm test -- roles.decorator.spec
npm test -- current-user.decorator.spec

# 带覆盖率报告
npm test -- decorators/tests --coverage
```

## 测试覆盖

### @Public() 装饰器测试

- ✅ 设置 isPublic 元数据为 true
- ✅ 未装饰的方法返回 undefined
- ✅ 可应用于类级别
- ✅ 可与其他装饰器组合使用
- ✅ IS_PUBLIC_KEY 常量导出

### @Roles() 装饰器测试

- ✅ 设置单个角色元数据
- ✅ 设置多个角色元数据
- ✅ 未装饰的方法返回 undefined
- ✅ ROLES_KEY 常量导出
- ✅ 角色值验证
- ✅ 装饰器组合使用
- ✅ 多装饰器覆盖行为
- ✅ 边界情况处理

### @CurrentUser() 装饰器测试

- ✅ 装饰器正确导出
- ✅ 返回函数类型
- ✅ 无参数调用
- ✅ 接受可选 data 参数
- ✅ 参数装饰应用
- ✅ 与其他装饰器组合
- ✅ 控制器中使用
- ✅ 用户信息提取
- ✅ 泛型类型支持

## 测试最佳实践

1. **独立测试**: 每个测试用例独立运行，不依赖其他测试
2. **Mock 使用**: 使用 Jest mock 模拟外部依赖
3. **类型安全**: 测试代码遵循 TypeScript 类型规范
4. **覆盖率**: 目标覆盖率 >90%

## 相关文件

- `../public.decorator.ts` - Public 装饰器实现
- `../roles.decorator.ts` - Roles 装饰器实现
- `../current-user.decorator.ts` - CurrentUser 装饰器实现
- `../README.md` - 装饰器使用文档

---

**最后更新:** 2026-04-01  
**测试状态:** ✅ 24 tests passed
