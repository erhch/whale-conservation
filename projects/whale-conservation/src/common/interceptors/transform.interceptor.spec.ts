/**
 * TransformInterceptor 单元测试
 * 测试统一响应格式拦截器的功能
 */

import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    
    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          url: '/api/v1/whales',
        }),
      }),
    };

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  it('应该被定义', () => {
    expect(interceptor).toBeDefined();
  });

  it('应该将响应转换为标准格式', (done) => {
    const mockData = { id: 1, name: '测试鲸鱼' };
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
      expect(response.message).toBe('操作成功');
      expect(response.path).toBe('/api/v1/whales');
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).not.toBeNaN();
      done();
    });
  });

  it('应该处理数组数据', (done) => {
    const mockData = [
      { id: 1, name: '鲸鱼 1' },
      { id: 2, name: '鲸鱼 2' },
    ];
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('鲸鱼 1');
      done();
    });
  });

  it('应该处理字符串数据', (done) => {
    const mockData = '操作成功';
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data).toBe('操作成功');
      done();
    });
  });

  it('应该处理数字数据', (done) => {
    const mockData = 42;
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data).toBe(42);
      done();
    });
  });

  it('应该处理 null 数据', (done) => {
    const mockData = null;
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      done();
    });
  });

  it('应该处理空对象', (done) => {
    const mockData = {};
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data).toEqual({});
      done();
    });
  });

  it('应该处理嵌套对象', (done) => {
    const mockData = {
      id: 1,
      profile: {
        name: '测试',
        details: { age: 5, weight: 3000 },
      },
    };
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data.profile.details.weight).toBe(3000);
      done();
    });
  });

  it('应该为不同请求路径返回正确的 path', (done) => {
    const testPaths = [
      '/api/v1/species',
      '/api/v1/whales/123',
      '/api/v1/stats/summary',
      '/health',
    ];

    let completedTests = 0;

    testPaths.forEach((path) => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ url: path }),
        }),
      };

      mockCallHandler.handle.mockReturnValue(of({ test: 'data' }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(response.path).toBe(path);
        completedTests++;
        if (completedTests === testPaths.length) {
          done();
        }
      });
    });
  });

  it('应该保持时间戳的 ISO 8601 格式', (done) => {
    mockCallHandler.handle.mockReturnValue(of({ test: 'data' }));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      // ISO 8601 格式应该包含 T 分隔符和时区信息
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      done();
    });
  });

  it('应该处理复杂的数据结构', (done) => {
    const mockData = {
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
      },
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      metadata: {
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0',
      },
    };
    mockCallHandler.handle.mockReturnValue(of(mockData));

    const result = interceptor.intercept(
      mockExecutionContext as ExecutionContext,
      mockCallHandler,
    );

    result.subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.data.pagination.total).toBe(100);
      expect(response.data.items).toHaveLength(2);
      expect(response.data.metadata.version).toBe('1.0');
      done();
    });
  });
});
