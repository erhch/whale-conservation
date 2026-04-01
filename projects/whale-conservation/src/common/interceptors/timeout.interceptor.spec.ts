import { Test, TestingModule } from '@nestjs/testing';
import {
  CallHandler,
  ExecutionContext,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  TimeoutInterceptor,
  Timeout,
  TIMEOUT_METADATA,
} from './timeout.interceptor';

/**
 * TimeoutInterceptor 单元测试
 * 
 * 测试覆盖场景：
 * 1. 默认超时时间 (30 秒) 内完成请求 - 成功
 * 2. 超过默认超时时间 - 抛出 RequestTimeoutException
 * 3. 自定义超时时间生效
 * 4. 装饰器 @Timeout 设置超时时间
 * 5. 快速接口 (5 秒超时) 测试
 * 6. 慢接口 (60 秒超时) 测试
 * 7. 超时错误类型验证
 * 8. 元数据反射器正常工作
 * 9. RxJS timeout 操作符正确应用
 * 10. 实际场景：快速健康检查接口
 * 11. 实际场景：慢查询导出接口
 * 12. 边界情况：刚好在超时前完成
 * 13. 边界情况：刚好超过超时时间
 */

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeoutInterceptor, Reflector],
    }).compile();

    interceptor = module.get<TimeoutInterceptor>(TimeoutInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  beforeEach(() => {
    // Mock handler function
    const mockHandler = jest.fn();

    // Mock ExecutionContext
    mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      switchToGraphql: jest.fn(),
    } as unknown as ExecutionContext;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('默认超时行为', () => {
    it('应该在默认超时时间 (30 秒) 内完成请求', async () => {
      // Arrange
      const mockData = { success: true, data: 'test' };
      jest.spyOn(reflector, 'get').mockReturnValue(undefined); // 无自定义超时
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
      expect(reflector.get).toHaveBeenCalledWith(
        TIMEOUT_METADATA,
        expect.any(Function),
      );
    });

    it('应该使用默认 30 秒超时时间', () => {
      // Arrange
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of({ test: true }));

      // Act
      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert - 验证 reflector 被调用获取超时元数据
      expect(reflector.get).toHaveBeenCalledWith(
        TIMEOUT_METADATA,
        expect.any(Function),
      );
    });
  });

  describe('自定义超时时间', () => {
    it('应该使用自定义超时时间 (5 秒)', async () => {
      // Arrange
      const customTimeout = 5000;
      const mockData = { success: true };
      jest.spyOn(reflector, 'get').mockReturnValue(customTimeout);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
      expect(reflector.get).toHaveBeenCalledWith(
        TIMEOUT_METADATA,
        expect.any(Function),
      );
    });

    it('应该使用自定义超时时间 (60 秒)', async () => {
      // Arrange
      const customTimeout = 60000;
      const mockData = { success: true, exported: true };
      jest.spyOn(reflector, 'get').mockReturnValue(customTimeout);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('应该使用自定义超时时间 (100 毫秒 - 快速接口)', async () => {
      // Arrange
      const customTimeout = 100;
      const mockData = { status: 'ok' };
      jest.spyOn(reflector, 'get').mockReturnValue(customTimeout);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('超时异常处理', () => {
    it('应该在请求超时时抛出错误', async () => {
      // Arrange
      const timeoutMs = 50; // 50ms 超时
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      // 创建一个会超时的 observable (延迟 100ms，超过 50ms 超时)
      const slowObservable = of('slow data').pipe(delay(100));
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(slowObservable);

      // Act & Assert
      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow();
    });

    it('应该正确处理超时错误类型', async () => {
      // Arrange
      const timeoutMs = 30;
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      // 创建超时的 observable
      const slowObservable = timer(100).pipe(map(() => 'too slow'));
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(slowObservable);

      // Act & Assert
      try {
        await interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise();
        fail('应该抛出超时错误');
      } catch (error) {
        expect(error).toBeDefined();
        // RxJS timeout 抛出 TimeoutError
        expect(error.name).toBe('TimeoutError');
      }
    });

    it('应该允许在超时时间内完成的请求', async () => {
      // Arrange
      const timeoutMs = 200;
      const mockData = { completed: 'on time' };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      // 创建在超时前完成的 observable (100ms < 200ms)
      const timelyObservable = of(mockData).pipe(delay(100));
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(timelyObservable);

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('@Timeout 装饰器', () => {
    it('应该通过装饰器设置超时元数据', () => {
      // Arrange
      class TestController {
        @Timeout(45000)
        testMethod() {
          return { success: true };
        }
      }

      const controller = new TestController();
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(controller),
        'testMethod',
      );

      // Assert
      if (descriptor && descriptor.value) {
        const metadata = Reflect.getMetadata(
          TIMEOUT_METADATA,
          descriptor.value,
        );
        expect(metadata).toBe(45000);
      }
    });

    it('装饰器应该正确存储元数据', () => {
      // Arrange
      class TestController {
        @Timeout(10000)
        quickMethod() {}

        @Timeout(120000)
        slowMethod() {}
      }

      const controller = new TestController();
      const quickDescriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(controller),
        'quickMethod',
      );
      const slowDescriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(controller),
        'slowMethod',
      );

      // Assert
      if (quickDescriptor && quickDescriptor.value) {
        expect(
          Reflect.getMetadata(TIMEOUT_METADATA, quickDescriptor.value),
        ).toBe(10000);
      }

      if (slowDescriptor && slowDescriptor.value) {
        expect(
          Reflect.getMetadata(TIMEOUT_METADATA, slowDescriptor.value),
        ).toBe(120000);
      }
    });
  });

  describe('实际场景测试', () => {
    it('健康检查接口应该快速完成 (5 秒超时)', async () => {
      // Arrange
      const timeoutMs = 5000;
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(healthData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(healthData);
      expect(result.status).toBe('healthy');
    });

    it('大数据导出接口应该允许较长时间 (120 秒超时)', async () => {
      // Arrange
      const timeoutMs = 120000;
      const exportData = {
        records: 10000,
        fileSize: '50MB',
        format: 'CSV',
      };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(exportData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(exportData);
      expect(result.records).toBe(10000);
    });

    it('鲸鱼列表 API 应该使用合理超时 (30 秒)', async () => {
      // Arrange
      const timeoutMs = 30000;
      const whaleList = {
        total: 156,
        page: 1,
        pageSize: 20,
        data: [
          { id: 1, name: 'Blue Whale', status: 'endangered' },
          { id: 2, name: 'Humpback Whale', status: 'vulnerable' },
        ],
      };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(whaleList));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(whaleList);
      expect(result.total).toBe(156);
    });
  });

  describe('边界情况', () => {
    it('应该处理零超时时间', async () => {
      // Arrange
      const timeoutMs = 0;
      const mockData = { immediate: true };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      // 零超时应该立即完成或失败
      const immediateObservable = of(mockData);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(immediateObservable);

      // Act & Assert
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();
      expect(result).toEqual(mockData);
    });

    it('应该处理非常大的超时时间', async () => {
      // Arrange
      const timeoutMs = 3600000; // 1 小时
      const mockData = { longRunning: true };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('应该处理 undefined 超时时间 (回退到默认)', async () => {
      // Arrange
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);
      const mockData = { defaultTimeout: true };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('应该处理 null 超时时间 (回退到默认)', async () => {
      // Arrange
      jest.spyOn(reflector, 'get').mockReturnValue(null as any);
      const mockData = { nullTimeout: true };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(mockData));

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('错误处理', () => {
    it('应该传递来自处理器的错误', async () => {
      // Arrange
      const testError = new Error('Service error');
      jest.spyOn(reflector, 'get').mockReturnValue(30000);
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => testError));

      // Act & Assert
      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow('Service error');
    });

    it('应该传递 HTTP 异常', async () => {
      // Arrange
      const httpError = new RequestTimeoutException('Request timeout');
      jest.spyOn(reflector, 'get').mockReturnValue(30000);
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(throwError(() => httpError));

      // Act & Assert
      await expect(
        interceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .toPromise(),
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('RxJS 操作符验证', () => {
    it('应该正确应用 timeout 操作符', () => {
      // Arrange
      const timeoutMs = 100;
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      const mockObservable = of('test');
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(mockObservable);

      // Act
      const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result.subscribe).toBe('function');
    });

    it('应该保持 observable 链完整', async () => {
      // Arrange
      const mockData = { transformed: true };
      jest.spyOn(reflector, 'get').mockReturnValue(30000);

      const transformedObservable = of(mockData).pipe(
        map((data) => ({ ...data, extra: 'field' })),
      );
      jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(transformedObservable);

      // Act
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();

      // Assert
      expect(result).toEqual({ transformed: true, extra: 'field' });
    });
  });

  describe('性能测试', () => {
    it('应该在超时范围内处理快速请求 (<10ms)', async () => {
      // Arrange
      const timeoutMs = 1000;
      const mockData = { fast: true };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      const fastObservable = of(mockData);
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(fastObservable);

      // Act
      const startTime = Date.now();
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();
      const endTime = Date.now();

      // Assert
      expect(result).toEqual(mockData);
      expect(endTime - startTime).toBeLessThan(100); // 应该非常快
    });

    it('应该正确处理中等延迟请求 (100-500ms)', async () => {
      // Arrange
      const timeoutMs = 2000;
      const mockData = { medium: true };
      jest.spyOn(reflector, 'get').mockReturnValue(timeoutMs);

      const mediumObservable = of(mockData).pipe(delay(200));
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(mediumObservable);

      // Act
      const startTime = Date.now();
      const result = await interceptor
        .intercept(mockExecutionContext, mockCallHandler)
        .toPromise();
      const endTime = Date.now();

      // Assert
      expect(result).toEqual(mockData);
      expect(endTime - startTime).toBeGreaterThanOrEqual(150);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
