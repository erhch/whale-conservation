/**
 * CurrentUser 装饰器单元测试
 * 
 * 测试 @CurrentUser() 装饰器的基本功能
 */

import { CurrentUser } from '../current-user.decorator';

describe('CurrentUser Decorator', () => {
  describe('@CurrentUser()', () => {
    it('应该被正确导出', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });

    it('应该返回一个函数', () => {
      const decorator = CurrentUser();
      expect(typeof decorator).toBe('function');
    });

    it('装饰器工厂应该可以无参数调用', () => {
      expect(() => CurrentUser()).not.toThrow();
    });

    it('装饰器工厂应该接受可选的 data 参数', () => {
      expect(() => CurrentUser('test')).not.toThrow();
      expect(() => CurrentUser(null)).not.toThrow();
      expect(() => CurrentUser({})).not.toThrow();
    });
  });

  describe('装饰器特性', () => {
    it('应该可以用于参数装饰', () => {
      // 验证装饰器可以应用于方法参数
      class TestController {
        testMethod(@CurrentUser() user: any) {
          return user;
        }
      }

      const controller = new TestController();
      expect(controller).toBeDefined();
    });

    it('应该可以与其他装饰器组合使用', () => {
      const MockParam = () => (target: any, key: string, index: number) => {};
      
      class TestController {
        testMethod(
          @CurrentUser() @MockParam() user: any
        ) {
          return user;
        }
      }

      const controller = new TestController();
      expect(controller).toBeDefined();
    });
  });

  describe('使用场景', () => {
    it('应该可以在控制器中使用', () => {
      class TestController {
        getProfile(@CurrentUser() user: any) {
          return { userId: user?.id };
        }

        updateProfile(@CurrentUser() user: any, data: any) {
          return { userId: user?.id, ...data };
        }
      }

      const controller = new TestController();
      expect(controller.getProfile({ id: '123' })).toEqual({ userId: '123' });
    });

    it('应该可以提取用户信息', () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'Test User',
        role: 'admin',
      };

      class TestController {
        getUserInfo(@CurrentUser() user: typeof mockUser) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      }

      const controller = new TestController();
      const result = controller.getUserInfo(mockUser);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });
  });

  describe('类型安全', () => {
    it('应该支持泛型用户类型', () => {
      interface CustomUser {
        id: string;
        customField: string;
      }

      class TestController {
        getCustomUser(@CurrentUser() user: CustomUser) {
          return user.customField;
        }
      }

      const controller = new TestController();
      expect(controller.getCustomUser({ id: '1', customField: 'test' })).toBe('test');
    });
  });
});
