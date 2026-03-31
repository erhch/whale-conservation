/**
 * Roles 装饰器单元测试
 * 
 * 测试 @Roles() 装饰器是否正确设置角色元数据
 */

import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from '../roles.decorator';

// 模拟 UserRole 枚举
enum UserRole {
  ADMIN = 'admin',
  RESEARCHER = 'researcher',
  VOLUNTEER = 'volunteer',
}

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('@Roles()', () => {
    it('应该设置单个角色元数据', () => {
      class TestController {
        @Roles(UserRole.ADMIN)
        adminOnlyMethod() {
          return 'admin';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.adminOnlyMethod,
      );

      expect(metadata).toEqual([UserRole.ADMIN]);
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata?.length).toBe(1);
    });

    it('应该设置多个角色元数据', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
        adminOrResearcherMethod() {
          return 'admin or researcher';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.adminOrResearcherMethod,
      );

      expect(metadata).toEqual([UserRole.ADMIN, UserRole.RESEARCHER]);
      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata?.length).toBe(2);
    });

    it('应该设置所有三个角色元数据', () => {
      class TestController {
        @Roles(UserRole.ADMIN, UserRole.RESEARCHER, UserRole.VOLUNTEER)
        allRolesMethod() {
          return 'all roles';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.allRolesMethod,
      );

      expect(metadata).toEqual([
        UserRole.ADMIN,
        UserRole.RESEARCHER,
        UserRole.VOLUNTEER,
      ]);
      expect(metadata?.length).toBe(3);
    });

    it('未装饰的方法应该返回 undefined', () => {
      class TestController {
        nonDecoratedMethod() {
          return 'no roles';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.nonDecoratedMethod,
      );

      expect(metadata).toBeUndefined();
    });

    it('应该导出 ROLES_KEY 常量', () => {
      expect(ROLES_KEY).toBe('roles');
      expect(typeof ROLES_KEY).toBe('string');
    });
  });

  describe('角色值验证', () => {
    it('角色值应该是字符串', () => {
      expect(typeof UserRole.ADMIN).toBe('string');
      expect(typeof UserRole.RESEARCHER).toBe('string');
      expect(typeof UserRole.VOLUNTEER).toBe('string');
    });

    it('角色值应该符合预期', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.RESEARCHER).toBe('researcher');
      expect(UserRole.VOLUNTEER).toBe('volunteer');
    });
  });

  describe('装饰器组合', () => {
    it('应该可以与其他装饰器组合使用', () => {
      const MockGet = () => (target: any, key: string) => {};
      
      class TestController {
        @Roles(UserRole.ADMIN)
        @MockGet()
        combinedMethod() {
          return 'combined';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.combinedMethod,
      );
      expect(metadata).toEqual([UserRole.ADMIN]);
    });

    it('多个 @Roles 装饰器应该保留后者（装饰器从下往上应用）', () => {
      class TestController {
        @Roles(UserRole.VOLUNTEER)
        @Roles(UserRole.ADMIN)
        multiDecoratedMethod() {
          return 'multi';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.multiDecoratedMethod,
      );
      // 装饰器从下往上应用，@Roles(VOLUNTEER) 后应用，会覆盖
      expect(metadata).toEqual([UserRole.VOLUNTEER]);
    });
  });

  describe('边界情况', () => {
    it('应该处理空角色数组（虽然不推荐）', () => {
      class TestController {
        @Roles()
        noRolesMethod() {
          return 'no roles';
        }
      }

      const metadata = reflector.get<UserRole[]>(
        ROLES_KEY,
        TestController.prototype.noRolesMethod,
      );

      expect(Array.isArray(metadata)).toBe(true);
      expect(metadata?.length).toBe(0);
    });
  });
});
