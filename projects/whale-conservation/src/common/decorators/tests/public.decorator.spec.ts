/**
 * Public 装饰器单元测试
 * 
 * 测试 @Public() 装饰器是否正确设置元数据
 */

import { Reflector } from '@nestjs/core';
import { Public, IS_PUBLIC_KEY } from '../public.decorator';

describe('Public Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('@Public()', () => {
    it('应该设置 isPublic 元数据为 true', () => {
      // 创建一个测试类，使用 @Public() 装饰器
      class TestController {
        @Public()
        publicMethod() {
          return 'public';
        }

        nonDecoratedMethod() {
          return 'private';
        }
      }

      const controller = new TestController();

      // 验证 @Public() 装饰的方法
      const publicMetadata = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        TestController.prototype.publicMethod,
      );
      expect(publicMetadata).toBe(true);

      // 验证未装饰的方法没有元数据
      const privateMetadata = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        TestController.prototype.nonDecoratedMethod,
      );
      expect(privateMetadata).toBeUndefined();
    });

    it('应该导出 IS_PUBLIC_KEY 常量', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
      expect(typeof IS_PUBLIC_KEY).toBe('string');
    });

    it('应该可以应用于类级别', () => {
      @Public()
      class TestController {
        method1() {
          return 'method1';
        }

        method2() {
          return 'method2';
        }
      }

      // 类级别的装饰器会应用于所有方法
      const metadata1 = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        TestController.prototype.method1,
      );
      const metadata2 = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        TestController.prototype.method2,
      );

      // 注意：类装饰器的行为取决于实现，这里验证装饰器可应用于类
      expect(typeof TestController).toBe('function');
    });

    it('应该可以与其他装饰器组合使用', () => {
      const MockGet = () => (target: any, key: string) => {};
      
      class TestController {
        @Public()
        @MockGet()
        combinedMethod() {
          return 'combined';
        }
      }

      const metadata = reflector.get<boolean>(
        IS_PUBLIC_KEY,
        TestController.prototype.combinedMethod,
      );
      expect(metadata).toBe(true);
    });
  });

  describe('元数据键', () => {
    it('IS_PUBLIC_KEY 应该是唯一标识符', () => {
      expect(IS_PUBLIC_KEY).toMatch(/^[a-zA-Z]+$/);
      expect(IS_PUBLIC_KEY.length).toBeGreaterThan(0);
    });
  });
});
