/**
 * ETagInterceptor 单元测试
 * 测试 ETag 条件请求拦截器的功能
 */

import { ETagInterceptor, ETag } from './etag.interceptor';
import { of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

describe('ETagInterceptor', () => {
  let interceptor: ETagInterceptor;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    interceptor = new ETagInterceptor();
    
    // Mock Request
    mockRequest = {
      method: 'GET',
      headers: {
        'if-none-match': undefined,
      },
    };

    // Mock Response
    mockResponse = {
      hasHeader: jest.fn().mockReturnValue(false),
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getHandler: jest.fn().mockReturnValue(() => {}),
    };

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  describe('基本功能', () => {
    it('应该被定义', () => {
      expect(interceptor).toBeDefined();
    });

    it('应该为 GET 请求生成 ETag', (done) => {
      const mockData = { id: 1, name: '测试鲸鱼' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(mockData);
        done();
      });
    });

    it('应该为 HEAD 请求生成 ETag', (done) => {
      mockRequest.method = 'HEAD';
      const mockData = { id: 1, name: '测试' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        done();
      });
    });

    it('应该对非 GET/HEAD 请求跳过 ETag 处理', (done) => {
      mockRequest.method = 'POST';
      const mockData = { id: 1, name: '测试' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        expect(response).toEqual(mockData);
        done();
      });
    });

    it('应该对 PUT 请求跳过 ETag 处理', (done) => {
      mockRequest.method = 'PUT';
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        done();
      });
    });

    it('应该对 DELETE 请求跳过 ETag 处理', (done) => {
      mockRequest.method = 'DELETE';
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        done();
      });
    });

    it('应该对 PATCH 请求跳过 ETag 处理', (done) => {
      mockRequest.method = 'PATCH';
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('空响应处理', () => {
    it('应该跳过 null 响应的 ETag 处理', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        expect(response).toBeNull();
        done();
      });
    });

    it('应该跳过 undefined 响应的 ETag 处理', (done) => {
      mockCallHandler.handle.mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        expect(response).toBeUndefined();
        done();
      });
    });

    it('应该为空对象响应生成 ETag', (done) => {
      mockCallHandler.handle.mockReturnValue(of({}));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual({});
        done();
      });
    });
  });

  describe('已存在 ETag 处理', () => {
    it('应该跳过已设置 ETag 的响应', (done) => {
      (mockResponse.hasHeader as jest.Mock).mockReturnValue(true);
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('If-None-Match 条件请求', () => {
    it('应该在不匹配时返回完整响应', (done) => {
      mockRequest.headers = { 'if-none-match': '"different-etag"' };
      const mockData = { id: 1, name: '测试鲸鱼' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).not.toHaveBeenCalledWith(304);
        expect(response).toEqual(mockData);
        done();
      });
    });

    it('应该在匹配时返回 304 Not Modified', (done) => {
      const mockData = { id: 1, name: '测试鲸鱼' };
      
      // Mock the generateETag to return a known value
      jest.spyOn(interceptor as any, 'generateETag').mockReturnValue('"abc123"');
      
      mockRequest.headers = { 'if-none-match': '"abc123"' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        expect(mockResponse.removeHeader).toHaveBeenCalledWith('Content-Type');
        expect(mockResponse.removeHeader).toHaveBeenCalledWith('Content-Length');
        expect(response).toBeNull();
        done();
      });
    });

    it('应该处理多个 ETag 的 If-None-Match', (done) => {
      const mockData = { id: 1, name: '测试' };
      jest.spyOn(interceptor as any, 'generateETag').mockReturnValue('"def456"');
      
      mockRequest.headers = { 'if-none-match': '"abc123", "def456", "ghi789"' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        expect(response).toBeNull();
        done();
      });
    });

    it('应该处理通配符 * 的 If-None-Match', (done) => {
      const mockData = { id: 1, name: '测试' };
      mockRequest.headers = { 'if-none-match': '*' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        expect(response).toBeNull();
        done();
      });
    });

    it('应该处理带空格的 If-None-Match', (done) => {
      const mockData = { id: 1 };
      jest.spyOn(interceptor as any, 'generateETag').mockReturnValue('"xyz789"');
      
      mockRequest.headers = { 'if-none-match': '  "abc123"  ,  "xyz789"  ' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        done();
      });
    });
  });

  describe('弱验证 ETag', () => {
    it('应该生成强验证 ETag (默认)', (done) => {
      const mockData = { id: 1 };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const etagCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === 'ETag'
        );
        expect(etagCall).toBeDefined();
        expect(etagCall[1]).toMatch(/^"[a-f0-9]{16}"$/);
        done();
      });
    });

    it('应该生成弱验证 ETag 当使用 @ETag(true) 装饰器', () => {
      const mockHandler = jest.fn();
      Reflect.defineMetadata('etag:weak', true, mockHandler);
      
      (mockExecutionContext.getHandler as jest.Mock).mockReturnValue(mockHandler);
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const etagCall = (mockResponse.setHeader as jest.Mock).mock.calls.find(
          (call: any[]) => call[0] === 'ETag'
        );
        expect(etagCall).toBeDefined();
        expect(etagCall[1]).toMatch(/^W\/"[a-f0-9]{16}"$/);
      });
    });

    it('应该处理弱验证 ETag 的 If-None-Match 匹配', (done) => {
      const mockData = { id: 1 };
      jest.spyOn(interceptor as any, 'generateETag').mockReturnValue('W/"abc123"');
      
      // 客户端发送的 If-None-Match 可能不带 W/ 前缀
      mockRequest.headers = { 'if-none-match': '"abc123"' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        expect(response).toBeNull();
        done();
      });
    });

    it('应该处理弱验证 ETag 的 If-None-Match 匹配 (带 W/ 前缀)', (done) => {
      const mockData = { id: 1 };
      jest.spyOn(interceptor as any, 'generateETag').mockReturnValue('W/"def456"');
      
      mockRequest.headers = { 'if-none-match': 'W/"def456"' };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.status).toHaveBeenCalledWith(304);
        done();
      });
    });
  });

  describe('ETag 生成', () => {
    it('应该为相同数据生成相同 ETag', () => {
      const data = { id: 1, name: '测试' };
      const etag1 = (interceptor as any).generateETag(data);
      const etag2 = (interceptor as any).generateETag(data);
      expect(etag1).toBe(etag2);
    });

    it('应该为不同数据生成不同 ETag', () => {
      const data1 = { id: 1, name: '测试 1' };
      const data2 = { id: 2, name: '测试 2' };
      const etag1 = (interceptor as any).generateETag(data1);
      const etag2 = (interceptor as any).generateETag(data2);
      expect(etag1).not.toBe(etag2);
    });

    it('应该为字符串数据生成 ETag', () => {
      const etag = (interceptor as any).generateETag('测试字符串');
      expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('应该为数组数据生成 ETag', () => {
      const etag = (interceptor as any).generateETag([1, 2, 3]);
      expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('应该为嵌套对象生成 ETag', () => {
      const data = { 
        id: 1, 
        nested: { key: 'value' },
        array: [1, 2, 3]
      };
      const etag = (interceptor as any).generateETag(data);
      expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('应该为数字数据生成 ETag', () => {
      const etag = (interceptor as any).generateETag(42);
      expect(etag).toMatch(/^"[a-f0-9]{16}"$/);
    });

    it('应该为布尔数据生成 ETag', () => {
      const etagTrue = (interceptor as any).generateETag(true);
      const etagFalse = (interceptor as any).generateETag(false);
      expect(etagTrue).toMatch(/^"[a-f0-9]{16}"$/);
      expect(etagFalse).toMatch(/^"[a-f0-9]{16}"$/);
      expect(etagTrue).not.toBe(etagFalse);
    });
  });

  describe('Vary 头设置', () => {
    it('应该设置 Vary 头为 If-None-Match', (done) => {
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Vary', 'If-None-Match');
        done();
      });
    });

    it('应该跳过已存在 Vary 头的情况', (done) => {
      (mockResponse.hasHeader as jest.Mock).mockImplementation((header: string) => {
        return header === 'Vary';
      });
      mockCallHandler.handle.mockReturnValue(of({ id: 1 }));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe(() => {
        const varyCalls = (mockResponse.setHeader as jest.Mock).mock.calls.filter(
          (call: any[]) => call[0] === 'Vary'
        );
        expect(varyCalls).toHaveLength(0);
        done();
      });
    });
  });

  describe('实际场景测试', () => {
    it('应该处理鲸鱼列表 API 响应', (done) => {
      const mockData = {
        success: true,
        data: [
          { id: 1, name: '大白', species: '蓝鲸' },
          { id: 2, name: '小白', species: '座头鲸' },
        ],
        total: 2,
      };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(mockData);
        done();
      });
    });

    it('应该处理统计数据 API 响应', (done) => {
      const mockData = {
        totalWhales: 150,
        totalSightings: 1200,
        activeResearchers: 25,
      };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(mockData);
        done();
      });
    });

    it('应该处理分页响应', (done) => {
      const mockData = {
        data: [{ id: 1 }, { id: 2 }],
        page: 1,
        limit: 10,
        total: 100,
      };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(mockData);
        done();
      });
    });
  });

  describe('ETag 装饰器', () => {
    it('ETag 装饰器应该设置元数据', () => {
      const mockHandler = jest.fn();
      
      // 应用弱验证装饰器
      ETag(true)(mockHandler);
      
      const metadata = Reflect.getMetadata('etag:weak', mockHandler);
      expect(metadata).toBe(true);
    });

    it('ETag 装饰器默认应该使用强验证', () => {
      const mockHandler = jest.fn();
      
      // 应用默认装饰器 (强验证)
      ETag()(mockHandler);
      
      const metadata = Reflect.getMetadata('etag:weak', mockHandler);
      expect(metadata).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该跳过空字符串响应的 ETag 处理', (done) => {
      mockCallHandler.handle.mockReturnValue(of(''));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        expect(response).toBe('');
        done();
      });
    });

    it('应该处理大对象响应', (done) => {
      const largeData = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      };
      mockCallHandler.handle.mockReturnValue(of(largeData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(largeData);
        done();
      });
    });

    it('应该处理包含特殊字符的响应', (done) => {
      const mockData = {
        name: '测试鲸鱼 🐋',
        description: 'Special chars: <>&"\'',
      };
      mockCallHandler.handle.mockReturnValue(of(mockData));

      const result = interceptor.intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler,
      );

      result.subscribe((response) => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
        expect(response).toEqual(mockData);
        done();
      });
    });
  });
});
