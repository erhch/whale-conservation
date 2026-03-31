/**
 * HTTP 异常过滤器单元测试
 */

import { HttpExceptionFilter, AllExceptionsFilter, type ErrorResponse } from '../http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      url: '/api/v1/whales/123',
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch()', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Resource not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalled();
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Resource not found');
      expect(response.path).toBe('/api/v1/whales/123');
      expect(response.timestamp).toBeDefined();
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          error: 'InvalidParams',
          details: [{ field: 'email', message: 'Invalid email format' }],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Validation failed');
      expect(response.error).toBe('InvalidParams');
    });

    it('should handle NotFoundException', () => {
      const exception = new HttpException('Whale not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Whale not found');
    });

    it('should handle BadRequestException', () => {
      const exception = new HttpException('Invalid parameters', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(400);
    });

    it('should handle UnauthorizedException', () => {
      const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(401);
    });

    it('should handle ForbiddenException', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(403);
    });

    it('should handle InternalServerErrorException', () => {
      const exception = new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(500);
    });

    it('should handle exception with msg field instead of message', () => {
      const exception = new HttpException(
        { msg: 'Custom error message', statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toBe('Custom error message');
    });

    it('should handle exception without message or msg field', () => {
      const exception = new HttpException(
        { statusCode: 400, customField: 'value' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toBe('请求失败');
    });

    it('should include error field only when present in exception response', () => {
      const exceptionWith = new HttpException(
        { message: 'Error', error: 'CustomError' },
        HttpStatus.BAD_REQUEST,
      );
      const exceptionWithout = new HttpException('Simple error', HttpStatus.BAD_REQUEST);

      filter.catch(exceptionWith, mockArgumentsHost);
      const responseWith = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(responseWith.error).toBe('CustomError');

      jest.clearAllMocks();
      filter.catch(exceptionWithout, mockArgumentsHost);
      const responseWithout = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(responseWithout.error).toBeUndefined();
    });

    it('should use correct request path', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      mockRequest.url = '/api/v1/species';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.path).toBe('/api/v1/species');
    });

    it('should generate ISO 8601 timestamp', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });
});

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      url: '/api/v1/whales',
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch()', () => {
    it('should handle unknown exception', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('服务器内部错误');
      expect(response.error).toBe('Internal Server Error');
    });

    it('should handle HttpException passed to AllExceptionsFilter', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Not found');
    });

    it('should handle exception without message property', () => {
      const exception = { code: 'UNKNOWN' };

      filter.catch(exception as any, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.message).toBe('服务器内部错误');
      expect(response.error).toBe('Internal Server Error');
    });

    it('should handle null exception', () => {
      filter.catch(null as any, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('服务器内部错误');
    });

    it('should use correct request path', () => {
      const exception = new Error('Test error');
      mockRequest.url = '/api/v1/stations/456';

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.path).toBe('/api/v1/stations/456');
    });

    it('should generate timestamp for all exceptions', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
