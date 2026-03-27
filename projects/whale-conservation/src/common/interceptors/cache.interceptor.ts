import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * 缓存元数据接口
 */
export interface CacheOptions {
  /** 缓存键 (可选，默认使用请求 URL) */
  key?: string;
  /** 缓存时间 (秒)，默认 300 秒 (5 分钟) */
  ttl?: number;
}

/**
 * 缓存拦截器
 * 
 * 用于缓存 GET 请求的响应数据，减少数据库查询压力
 * 
 * @example
 * // 基础用法 - 默认 5 分钟缓存
 * @UseInterceptors(CacheInterceptor)
 * @Get('species')
 * findAll() {
 *   return this.speciesService.findAll();
 * }
 * 
 * @example
 * // 自定义缓存时间 - 1 小时
 * @UseInterceptors(CacheInterceptor)
 * @CacheTTL(3600)
 * @Get('statistics')
 * getStatistics() {
 *   return this.statsService.getStatistics();
 * }
 * 
 * @example
 * // 自定义缓存键
 * @UseInterceptors(CacheInterceptor)
 * @CacheKey('home-page-data')
 * @Get('home')
 * getHomeData() {
 *   return this.homeService.getData();
 * }
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  /** 内存缓存存储 */
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 仅缓存 GET 请求
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 获取缓存配置
    const customKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    const customTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    // 生成缓存键
    const cacheKey = customKey || `cache:${request.url}`;
    const ttl = customTTL || 300; // 默认 5 分钟

    // 检查缓存是否命中
    const cachedItem = this.cache.get(cacheKey);
    if (cachedItem && cachedItem.expiry > Date.now()) {
      // 缓存命中
      response.header('X-Cache', 'HIT');
      return of(cachedItem.data);
    }

    // 缓存未命中，执行请求
    response.header('X-Cache', 'MISS');
    return next.handle().pipe(
      tap((data) => {
        // 存储到缓存
        this.cache.set(cacheKey, {
          data,
          expiry: Date.now() + ttl * 1000,
        });
      }),
    );
  }

  /**
   * 清除指定缓存键
   */
  clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number; keys: string[] } {
    const now = Date.now();
    const validKeys: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry > now) {
        validKeys.push(key);
      } else {
        this.cache.delete(key); // 清理过期缓存
      }
    }
    
    return {
      size: validKeys.length,
      keys: validKeys,
    };
  }
}

/**
 * 自定义缓存键装饰器
 * 
 * @param key 缓存键
 */
export const CacheKey = (key: string) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value);
    return descriptor;
  };
};

/**
 * 自定义缓存时间装饰器
 * 
 * @param ttl 缓存时间 (秒)
 */
export const CacheTTL = (ttl: number) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};
