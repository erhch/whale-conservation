import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const TIMEOUT_METADATA = 'request_timeout';

/**
 * 请求超时拦截器
 * 
 * 用于控制 API 请求的最大执行时间，防止慢查询阻塞服务器资源
 * 
 * @example
 * // 基础用法 - 默认 30 秒超时
 * @UseInterceptors(TimeoutInterceptor)
 * @Get('large-dataset')
 * findLargeDataset() {
 *   return this.service.findLargeDataset();
 * }
 * 
 * @example
 * // 自定义超时时间 - 60 秒
 * @UseInterceptors(TimeoutInterceptor)
 * @Timeout(60000)
 * @Get('complex-query')
 * findComplexQuery() {
 *   return this.service.findComplexQuery();
 * }
 * 
 * @example
 * // 快速接口 - 5 秒超时
 * @UseInterceptors(TimeoutInterceptor)
 * @Timeout(5000)
 * @Get('health')
 * healthCheck() {
 *   return this.service.health();
 * }
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  /** 默认超时时间 (毫秒) */
  private readonly defaultTimeout = 30000; // 30 秒

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取自定义超时时间
    const customTimeout = this.reflector.get<number>(
      TIMEOUT_METADATA,
      context.getHandler(),
    );

    const timeoutMs = customTimeout || this.defaultTimeout;

    return next.handle().pipe(
      timeout(timeoutMs),
    );
  }
}

/**
 * 请求超时装饰器
 * 
 * 设置接口请求的最大执行时间 (毫秒)
 * 
 * @param timeoutMs 超时时间 (毫秒)
 * 
 * @example
 * @Timeout(60000) // 60 秒超时
 * @Get('export')
 * exportData() {
 *   return this.service.exportLargeData();
 * }
 */
export const Timeout = (timeoutMs: number) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(TIMEOUT_METADATA, timeoutMs, descriptor.value);
    return descriptor;
  };
};
