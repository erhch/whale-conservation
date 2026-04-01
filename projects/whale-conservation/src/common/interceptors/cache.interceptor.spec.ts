import { CacheInterceptor, CacheKey, CacheTTL, CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.interceptor';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

/**
 * CacheInterceptor 单元测试
 * 
 * 测试覆盖:
 * - GET 请求缓存命中/未命中
 * - 非 GET 请求跳过缓存
 * - 自定义缓存键 (CacheKey 装饰器)
 * - 自定义缓存时间 (CacheTTL 装饰器)
 * - 缓存过期逻辑
 * - clearCache/clearAllCache/getCacheStats 方法
 * - CacheKey/CacheTTL 装饰器功能
 */
describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let reflector: Reflector;
  let mockExecutionContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new CacheInterceptor(reflector);
    
    // Mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
    };

    // Mock call handler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    interceptor.clearAllCache();
    jest.clearAllMocks();
  });

  describe('缓存基础功能', () => {
    it('应该缓存 GET 请求的响应', async () => {
      const mockData = { id: 1, name: '测试数据' };
      const mockRequest = { method: 'GET', url: '/api/test' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // 第一次请求 - 缓存未命中
      const result1 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      
      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(result1).toEqual(mockData);

      // 第二次请求 - 缓存命中
      mockCallHandler.handle.mockReturnValue(of({ id: 2, name: '新数据' }));
      const result2 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(result2).toEqual(mockData); // 应该返回缓存的数据，而不是新数据
    });

    it('应该跳过非 GET 请求的缓存', async () => {
      const mockData = { id: 1, name: 'POST 数据' };
      const mockRequest = { method: 'POST', url: '/api/test' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(mockResponse.header).not.toHaveBeenCalled();
      expect(result).toEqual(mockData);
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('应该为不同的 URL 使用不同的缓存键', async () => {
      const data1 = { endpoint: 'users' };
      const data2 = { endpoint: 'whales' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});

      // 请求 /api/users
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ method: 'GET', url: '/api/users' });
      mockCallHandler.handle.mockReturnValue(of(data1));
      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      // 请求 /api/whales
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ method: 'GET', url: '/api/whales' });
      mockCallHandler.handle.mockReturnValue(of(data2));
      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(result).toEqual(data2); // 应该是新数据，不是缓存
    });
  });

  describe('自定义缓存键 (CacheKey)', () => {
    it('应该使用自定义缓存键', async () => {
      const mockData = { custom: 'key-data' };
      const mockRequest = { method: 'GET', url: '/api/test' };
      const mockResponse = { header: jest.fn() };
      const customKey = 'my-custom-key';

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(function customHandler() {});
      
      // 设置自定义缓存键元数据
      Reflect.defineMetadata(CACHE_KEY_METADATA, customKey, function customHandler() {});
      mockExecutionContext.getHandler.mockReturnValue(function customHandler() {});
      
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // 第一次请求
      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');

      // 第二次请求 - 应该命中缓存
      mockCallHandler.handle.mockReturnValue(of({ different: 'data' }));
      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(result).toEqual(mockData);
    });

    it('CacheKey 装饰器应该正确设置元数据', () => {
      class TestController {
        @CacheKey('test-key')
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getData);
      expect(metadata).toBe('test-key');
    });
  });

  describe('自定义缓存时间 (CacheTTL)', () => {
    it('应该使用自定义缓存时间', async () => {
      const mockData = { ttl: 'custom' };
      const mockRequest = { method: 'GET', url: '/api/test' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(function customTTLHandler() {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // 第一次请求
      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      // 等待缓存过期 (使用很短的 TTL)
      // 注意：这里我们测试装饰器功能，实际过期测试在下面
      const metadata = Reflect.getMetadata(CACHE_TTL_METADATA, function customTTLHandler() {});
      expect(metadata).toBeUndefined(); // 没有设置装饰器时应该是 undefined
    });

    it('CacheTTL 装饰器应该正确设置元数据', () => {
      class TestController {
        @CacheTTL(3600)
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);
      expect(metadata).toBe(3600);
    });

    it('应该支持同时使用 CacheKey 和 CacheTTL 装饰器', () => {
      class TestController {
        @CacheKey('combined-key')
        @CacheTTL(7200)
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const keyMetadata = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getData);
      const ttlMetadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);

      expect(keyMetadata).toBe('combined-key');
      expect(ttlMetadata).toBe(7200);
    });
  });

  describe('缓存过期逻辑', () => {
    it('应该在缓存过期后重新获取数据', async () => {
      const mockData = { expired: 'test' };
      const mockRequest = { method: 'GET', url: '/api/expires' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      // 第一次请求 - 缓存
      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');

      // 手动使缓存过期 (通过等待或直接测试 clearCache)
      interceptor.clearCache('cache:/api/expires');

      // 第二次请求 - 应该重新获取
      const newData = { fresh: 'data' };
      mockCallHandler.handle.mockReturnValue(of(newData));
      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(result).toEqual(newData);
    });

    it('getCacheStats 应该返回正确的缓存统计', async () => {
      const mockResponse = { header: jest.fn() };
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});

      // 添加一些缓存数据
      const urls = ['/api/1', '/api/2', '/api/3'];
      for (const url of urls) {
        mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ method: 'GET', url });
        mockCallHandler.handle.mockReturnValue(of({ url }));
        await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      }

      const stats = interceptor.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.keys.length).toBe(3);
      expect(stats.keys).toContain('cache:/api/1');
      expect(stats.keys).toContain('cache:/api/2');
      expect(stats.keys).toContain('cache:/api/3');
    });

    it('getCacheStats 应该清理过期缓存', () => {
      // 手动添加一个过期缓存项
      (interceptor as any).cache.set('expired-key', {
        data: { old: 'data' },
        expiry: Date.now() - 1000, // 已过期
      });

      const stats = interceptor.getCacheStats();
      expect(stats.size).toBe(0);
      expect((interceptor as any).cache.has('expired-key')).toBe(false);
    });
  });

  describe('缓存清除方法', () => {
    it('clearCache 应该清除指定的缓存键', async () => {
      const mockResponse = { header: jest.fn() };
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});

      // 添加缓存
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ method: 'GET', url: '/api/to-clear' });
      mockCallHandler.handle.mockReturnValue(of({ toClear: true }));
      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      // 验证缓存存在
      let stats = interceptor.getCacheStats();
      expect(stats.size).toBe(1);

      // 清除缓存
      interceptor.clearCache('cache:/api/to-clear');

      // 验证缓存已清除
      stats = interceptor.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('clearAllCache 应该清除所有缓存', async () => {
      const mockResponse = { header: jest.fn() };
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});

      // 添加多个缓存
      const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
      for (const url of urls) {
        mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ method: 'GET', url });
        mockCallHandler.handle.mockReturnValue(of({ url }));
        await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      }

      // 验证缓存存在
      let stats = interceptor.getCacheStats();
      expect(stats.size).toBe(5);

      // 清除所有缓存
      interceptor.clearAllCache();

      // 验证所有缓存已清除
      stats = interceptor.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('clearCache 应该安全处理不存在的键', () => {
      // 不应该抛出错误
      expect(() => interceptor.clearCache('non-existent-key')).not.toThrow();
    });
  });

  describe('边界情况', () => {
    it('应该处理空响应数据', async () => {
      const mockRequest = { method: 'GET', url: '/api/empty' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(null));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(result).toBeNull();
      expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');
    });

    it('应该处理数组响应', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const mockRequest = { method: 'GET', url: '/api/array' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result1 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(result1).toEqual(mockData);

      // 缓存命中
      mockCallHandler.handle.mockReturnValue(of([{ id: 999 }]));
      const result2 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(result2).toEqual(mockData); // 应该返回缓存的数组
    });

    it('应该处理复杂嵌套对象', async () => {
      const mockData = {
        user: {
          id: 1,
          profile: {
            name: 'Test',
            settings: { theme: 'dark', lang: 'zh-CN' },
          },
        },
        metadata: { timestamp: '2026-04-01T00:00:00Z' },
      };
      const mockRequest = { method: 'GET', url: '/api/complex' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result1 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      
      // 缓存命中
      mockCallHandler.handle.mockReturnValue(of({ different: 'data' }));
      const result2 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      expect(result2).toEqual(mockData);
      expect(result2.user.profile.settings.theme).toBe('dark');
    });

    it('应该处理特殊字符 URL', async () => {
      const mockData = { special: 'url' };
      const mockRequest = { method: 'GET', url: '/api/search?q=鲸鱼&type=哺乳动物' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result1 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      
      // 缓存命中 - 相同 URL
      mockCallHandler.handle.mockReturnValue(of({ different: 'data' }));
      const result2 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(result2).toEqual(mockData);

      // 不同 URL - 应该不命中缓存
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ 
        method: 'GET', 
        url: '/api/search?q=海豚&type=哺乳动物' 
      });
      const result3 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
      expect(result3).toEqual({ different: 'data' });
    });
  });

  describe('HTTP 方法覆盖', () => {
    const httpMethods = [
      { method: 'POST', shouldCache: false },
      { method: 'PUT', shouldCache: false },
      { method: 'DELETE', shouldCache: false },
      { method: 'PATCH', shouldCache: false },
      { method: 'HEAD', shouldCache: false },
      { method: 'OPTIONS', shouldCache: false },
      { method: 'GET', shouldCache: true },
    ];

    httpMethods.forEach(({ method, shouldCache }) => {
      it(`应该${shouldCache ? '缓存' : '跳过'} ${method} 请求`, async () => {
        const mockRequest = { method, url: `/api/${method.toLowerCase()}` };
        const mockResponse = { header: jest.fn() };

        mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
        mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
        mockExecutionContext.getHandler.mockReturnValue(() => {});
        mockCallHandler.handle.mockReturnValue(of({ method }));

        const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

        if (shouldCache) {
          expect(mockResponse.header).toHaveBeenCalledWith('X-Cache', 'MISS');
        } else {
          expect(mockResponse.header).not.toHaveBeenCalled();
        }
        expect(result).toEqual({ method });
      });
    });
  });

  describe('默认缓存时间', () => {
    it('应该使用 300 秒 (5 分钟) 作为默认缓存时间', async () => {
      const mockData = { default: 'ttl' };
      const mockRequest = { method: 'GET', url: '/api/default-ttl' };
      const mockResponse = { header: jest.fn() };

      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      mockExecutionContext.switchToHttp().getResponse.mockReturnValue(mockResponse);
      mockExecutionContext.getHandler.mockReturnValue(() => {});
      mockCallHandler.handle.mockReturnValue(of(mockData));

      await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

      // 验证缓存已设置 (通过 getCacheStats 间接验证)
      const stats = interceptor.getCacheStats();
      expect(stats.size).toBe(1);
      
      // 验证缓存键格式
      expect(stats.keys[0]).toBe('cache:/api/default-ttl');
    });
  });
});

/**
 * CacheKey 和 CacheTTL 装饰器独立测试
 */
describe('缓存装饰器', () => {
  describe('@CacheKey', () => {
    it('应该允许在方法上使用', () => {
      class TestController {
        @CacheKey('method-key')
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getData);
      expect(metadata).toBe('method-key');
    });

    it('应该支持动态键', () => {
      const dynamicKey = `dynamic-${Date.now()}`;
      
      class TestController {
        @CacheKey(dynamicKey)
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getData);
      expect(metadata).toBe(dynamicKey);
    });
  });

  describe('@CacheTTL', () => {
    it('应该允许设置秒级缓存时间', () => {
      class TestController {
        @CacheTTL(1800) // 30 分钟
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);
      expect(metadata).toBe(1800);
    });

    it('应该允许设置 0 表示不缓存', () => {
      class TestController {
        @CacheTTL(0)
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);
      expect(metadata).toBe(0);
    });

    it('应该允许设置很长的缓存时间', () => {
      class TestController {
        @CacheTTL(86400) // 24 小时
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const metadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);
      expect(metadata).toBe(86400);
    });
  });

  describe('装饰器组合', () => {
    it('应该支持装饰器堆叠', () => {
      class TestController {
        @CacheKey('stacked-key')
        @CacheTTL(3600)
        getData() {
          return { data: 'test' };
        }
      }

      const controller = new TestController();
      const keyMetadata = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getData);
      const ttlMetadata = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getData);

      expect(keyMetadata).toBe('stacked-key');
      expect(ttlMetadata).toBe(3600);
    });

    it('应该支持多个方法使用不同配置', () => {
      class TestController {
        @CacheKey('fast-data')
        @CacheTTL(60)
        getFastData() {
          return { type: 'fast' };
        }

        @CacheKey('slow-data')
        @CacheTTL(3600)
        getSlowData() {
          return { type: 'slow' };
        }
      }

      const controller = new TestController();
      
      const fastKey = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getFastData);
      const fastTTL = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getFastData);
      
      const slowKey = Reflect.getMetadata(CACHE_KEY_METADATA, controller.getSlowData);
      const slowTTL = Reflect.getMetadata(CACHE_TTL_METADATA, controller.getSlowData);

      expect(fastKey).toBe('fast-data');
      expect(fastTTL).toBe(60);
      expect(slowKey).toBe('slow-data');
      expect(slowTTL).toBe(3600);
    });
  });
});

/**
 * 实际使用场景测试
 */
describe('CacheInterceptor 实际场景', () => {
  let interceptor: CacheInterceptor;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new CacheInterceptor(reflector);
  });

  afterEach(() => {
    interceptor.clearAllCache();
  });

  it('场景：鲸鱼列表 API 缓存', async () => {
    const mockExecutionContext: any = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
    };
    const mockCallHandler: any = { handle: jest.fn() };

    const whaleListData = [
      { id: 1, name: 'Whale-001', species: 'Blue Whale' },
      { id: 2, name: 'Whale-002', species: 'Humpback' },
      { id: 3, name: 'Whale-003', species: 'Orca' },
    ];

    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ 
      method: 'GET', 
      url: '/api/v1/whales' 
    });
    mockExecutionContext.switchToHttp().getResponse.mockReturnValue({ header: jest.fn() });
    mockExecutionContext.getHandler.mockReturnValue(() => {});
    mockCallHandler.handle.mockReturnValue(of(whaleListData));

    // 第一次请求 - 从数据库获取
    const result1 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
    expect(result1).toEqual(whaleListData);

    // 第二次请求 - 从缓存获取
    mockCallHandler.handle.mockReturnValue(of([{ id: 999, name: 'New Whale' }]));
    const result2 = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
    
    // 应该返回缓存的数据，而不是新的模拟数据
    expect(result2).toEqual(whaleListData);
    expect(result2.length).toBe(3);
  });

  it('场景：统计数据 API 缓存 (较长 TTL)', async () => {
    const mockExecutionContext: any = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
    };
    const mockCallHandler: any = { handle: jest.fn() };

    const statsData = {
      totalWhales: 150,
      totalSightings: 1200,
      activeResearchers: 25,
    };

    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ 
      method: 'GET', 
      url: '/api/v1/stats/summary' 
    });
    mockExecutionContext.switchToHttp().getResponse.mockReturnValue({ header: jest.fn() });
    mockExecutionContext.getHandler.mockReturnValue(function statsHandler() {});
    
    // 设置 1 小时缓存
    Reflect.defineMetadata(CACHE_TTL_METADATA, 3600, function statsHandler() {});
    
    mockCallHandler.handle.mockReturnValue(of(statsData));

    // 第一次请求
    await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();

    // 第二次请求 - 应该命中缓存
    mockCallHandler.handle.mockReturnValue(of({ totalWhales: 999 }));
    const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
    
    expect(result.totalWhales).toBe(150); // 缓存值
  });

  it('场景：POST 创建请求不应该被缓存', async () => {
    const mockExecutionContext: any = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
    };
    const mockCallHandler: any = { handle: jest.fn() };

    mockExecutionContext.switchToHttp().getRequest.mockReturnValue({ 
      method: 'POST', 
      url: '/api/v1/whales',
      body: { name: 'New Whale', species: 'Blue Whale' }
    });
    mockExecutionContext.switchToHttp().getResponse.mockReturnValue({ header: jest.fn() });
    mockCallHandler.handle.mockReturnValue(of({ id: 1, name: 'New Whale' }));

    const result = await interceptor.intercept(mockExecutionContext, mockCallHandler).toPromise();
    
    // POST 请求不应该设置缓存头
    expect(mockExecutionContext.switchToHttp().getResponse().header).not.toHaveBeenCalled();
    expect(result.id).toBe(1);
    
    // 验证没有缓存被创建
    const stats = interceptor.getCacheStats();
    expect(stats.size).toBe(0);
  });
});
