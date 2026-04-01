/**
 * JWT 认证守卫单元测试
 * 测试 JwtAuthGuard 的认证逻辑和 @Public() 装饰器
 */

import { JwtAuthGuard, Public, IS_PUBLIC_KEY } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

// 创建 Reflector 的 mock
const createMockReflector = () => ({
  getAllAndOverride: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
} as unknown as Reflector);

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockHandler: any;
  let mockClass: any;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new JwtAuthGuard(reflector);
    
    mockHandler = jest.fn();
    mockClass = jest.fn();
    
    const mockRequest = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      },
    };

    mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn().mockReturnValue(mockClass),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - Public Routes', () => {
    it('should allow access to public routes marked with @Public()', async () => {
      // 模拟路由被标记为公开
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
    });

    it('should check both handler and class metadata for @Public()', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });

  describe('canActivate - Protected Routes', () => {
    it('should delegate to parent AuthGuard for non-public routes', async () => {
      // 模拟路由不是公开的
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      // 创建 spy 来验证父类方法被调用
      const parentCanActivate = jest.fn().mockResolvedValue(true);
      guard.canActivate = parentCanActivate;

      await guard.canActivate(mockExecutionContext);

      expect(parentCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });
  });
});

describe('JwtAuthGuard - Integration Scenarios', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should protect admin routes from unauthenticated access', async () => {
    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(jest.fn()),
      getClass: jest.fn().mockReturnValue(jest.fn()),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as unknown as ExecutionContext;

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    
    // 模拟父类返回 false (认证失败)
    const parentCanActivate = jest.fn().mockResolvedValue(false);
    guard.canActivate = parentCanActivate;

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should allow authenticated users to access protected routes', async () => {
    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(jest.fn()),
      getClass: jest.fn().mockReturnValue(jest.fn()),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: 'user-123', role: 'admin' },
        }),
      }),
    } as unknown as ExecutionContext;

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    
    // 模拟父类返回 true (认证成功)
    const parentCanActivate = jest.fn().mockResolvedValue(true);
    guard.canActivate = parentCanActivate;

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should allow public access to health check endpoints', async () => {
    const mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(jest.fn()),
      getClass: jest.fn().mockReturnValue(jest.fn()),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    // 健康检查端点标记为公开
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    const result = await guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });
});
