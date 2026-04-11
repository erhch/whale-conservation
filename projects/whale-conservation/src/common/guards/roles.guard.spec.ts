/**
 * RBAC 角色权限守卫单元测试
 * 测试 RolesGuard 的角色验证逻辑
 */

import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 创建 Reflector 的 mock
const createMockReflector = () => ({
  getAllAndOverride: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndMerge: jest.fn(),
} as unknown as Reflector);

// Helper function to create mock execution context
function createMockContext(request: any): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue(() => {}),
    getClass: jest.fn().mockReturnValue(class {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      const mockRequest = { user: null };
      mockExecutionContext = createMockContext(mockRequest);

      // 模拟没有角色要求
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should allow access when required roles array is empty', () => {
      const mockRequest = { user: null };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user is not authenticated', () => {
      const mockRequest = { user: null };
      mockExecutionContext = createMockContext(mockRequest);

      // 需要 ADMIN 角色
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should allow access when user has required role', () => {
      const mockRequest = {
        user: {
          id: 'user-123',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      };
      mockExecutionContext = createMockContext(mockRequest);

      // 需要 ADMIN 角色
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      const mockRequest = {
        user: {
          id: 'user-456',
          email: 'user@example.com',
          role: UserRole.VOLUNTEER,
        },
      };
      mockExecutionContext = createMockContext(mockRequest);

      // 需要 ADMIN 角色
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const mockRequest = {
        user: {
          id: 'user-789',
          email: 'researcher@example.com',
          role: UserRole.RESEARCHER,
        },
      };
      mockExecutionContext = createMockContext(mockRequest);

      // 需要 ADMIN 或 RESEARCHER 角色
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
        UserRole.RESEARCHER,
      ]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user has none of the required roles', () => {
      const mockRequest = {
        user: {
          id: 'user-999',
          email: 'volunteer@example.com',
          role: UserRole.VOLUNTEER,
        },
      };
      mockExecutionContext = createMockContext(mockRequest);

      // 需要 ADMIN 或 RESEARCHER 角色
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
        UserRole.RESEARCHER,
      ]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('Role scenarios', () => {
    it('should correctly handle ADMIN role access', () => {
      const mockRequest = {
        user: { id: 'admin-1', role: UserRole.ADMIN },
      };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should correctly handle RESEARCHER role access', () => {
      const mockRequest = {
        user: { id: 'researcher-1', role: UserRole.RESEARCHER },
      };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.RESEARCHER]);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should correctly handle VOLUNTEER role access', () => {
      const mockRequest = {
        user: { id: 'volunteer-1', role: UserRole.VOLUNTEER },
      };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.VOLUNTEER]);

      expect(guard.canActivate(mockExecutionContext)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle user object without role property', () => {
      const mockRequest = {
        user: { id: 'user-123', email: 'test@example.com' },
      };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should check both handler and class metadata', () => {
      const mockRequest = { user: { id: 'user-1', role: UserRole.ADMIN } };
      mockExecutionContext = createMockContext(mockRequest);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        expect.any(Function), // handler
        expect.any(Function), // class
      ]);
    });
  });
});

describe('RolesGuard - Real-world scenarios', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = createMockReflector();
    guard = new RolesGuard(reflector);
  });

  it('should protect admin-only endpoints from regular users', () => {
    const mockRequest = {
      user: { id: 'regular-user', role: UserRole.VOLUNTEER },
    };
    const mockExecutionContext = createMockContext(mockRequest);

    // 管理员专用端点
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(false);
  });

  it('should allow admins to access all protected endpoints', () => {
    const mockRequest = {
      user: { id: 'admin-user', role: UserRole.ADMIN },
    };
    const mockExecutionContext = createMockContext(mockRequest);

    // 任何受保护的端点
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
      UserRole.RESEARCHER,
    ]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should work with multiple role requirements (OR logic)', () => {
    const mockRequest = {
      user: { id: 'researcher-user', role: UserRole.RESEARCHER },
    };
    const mockExecutionContext = createMockContext(mockRequest);

    // 管理员或研究员都可以访问
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ADMIN,
      UserRole.RESEARCHER,
      UserRole.VOLUNTEER,
    ]);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });
});
