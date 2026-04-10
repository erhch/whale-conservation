import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const RATE_LIMIT_METADATA = 'rate_limit';
export const RATE_LIMIT_TTL_METADATA = 'rate_limit_ttl';

/**
 * 请求速率限制拦截器
 * 
 * 用于限制 API 请求频率，防止滥用和 DDoS 攻击
 * 使用简单的内存存储，适合单机部署场景
 * 
 * @example
 * // 基础用法 - 默认 100 次/分钟
 * @UseInterceptors(RateLimitInterceptor)
 * @Get('species')
 * findAllSpecies() {
 *   return this.speciesService.findAll();
 * }
 * 
 * @example
 * // 自定义限制 - 10 次/分钟 (适合敏感操作)
 * @UseInterceptors(RateLimitInterceptor)
 * @RateLimit(10)
 * @RateLimitTTL(60)
 * @Post('login')
 * login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 * 
 * @example
 * // 宽松限制 - 1000 次/分钟 (适合公开数据)
 * @UseInterceptors(RateLimitInterceptor)
 * @RateLimit(1000)
 * @RateLimitTTL(60)
 * @Get('public/data')
 * getPublicData() {
 *   return this.publicService.getData();
 * }
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  /** 默认请求限制次数 */
  private readonly defaultLimit = 100;
  
  /** 默认时间窗口 (秒) */
  private readonly defaultTTL = 60;
  
  /** 内存存储：key -> { count, resetTime } */
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {
    // 每分钟清理一次过期的记录
    setInterval(() => this.cleanup(), 60000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const clientIP = this.getClientIP(request);
    const route = this.getRouteKey(context);
    const key = `${clientIP}:${route}`;

    // 获取自定义限制配置
    const limit = this.reflector.get<number>(RATE_LIMIT_METADATA, context.getHandler()) || this.defaultLimit;
    const ttl = this.reflector.get<number>(RATE_LIMIT_TTL_METADATA, context.getHandler()) || this.defaultTTL;

    const now = Date.now();
    const record = this.requestCounts.get(key);

    // 检查是否需要重置或创建新记录
    if (!record || now > record.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + ttl * 1000,
      });
      return next.handle();
    }

    // 检查是否超出限制
    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        { message: `请求过于频繁，请 ${retryAfter} 秒后重试`, description: `限制：${limit} 次/${ttl}秒` },
        HttpStatus.TOO_MANY_REQUESTS,
        { cause: new Error('Rate limit exceeded') },
      );
    }

    // 增加计数
    record.count++;
    return next.handle();
  }

  /**
   * 获取客户端 IP 地址
   */
  private getClientIP(request: any): string {
    // 检查反向代理 header
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    // 检查其他常见 header
    const realIP = request.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }
    
    //  fallback 到直接连接 IP
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * 生成路由唯一键
   */
  private getRouteKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.method}:${request.url}`;
  }

  /**
   * 清理过期的记录
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requestCounts.entries()) {
      if (now > record.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }

  /**
   * 获取速率限制统计信息 (用于监控)
   */
  getStats(): { totalKeys: number; records: Array<{ key: string; count: number; resetTime: number }> } {
    const records: Array<{ key: string; count: number; resetTime: number }> = [];
    for (const [key, record] of this.requestCounts.entries()) {
      records.push({ key, ...record });
    }
    return {
      totalKeys: this.requestCounts.size,
      records,
    };
  }

  /**
   * 清除指定客户端的速率限制记录
   */
  clearClient(clientIP: string): void {
    for (const key of this.requestCounts.keys()) {
      if (key.startsWith(`${clientIP}:`)) {
        this.requestCounts.delete(key);
      }
    }
  }

  /**
   * 清除所有速率限制记录
   */
  clearAll(): void {
    this.requestCounts.clear();
  }
}

/**
 * 速率限制装饰器 - 设置请求次数限制
 * 
 * @param limit 最大请求次数
 * 
 * @example
 * @RateLimit(10) // 最多 10 次
 * @Get('sensitive')
 * getSensitiveData() {
 *   return this.service.getSensitive();
 * }
 */
export const RateLimit = (limit: number) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(RATE_LIMIT_METADATA, limit, descriptor.value);
    return descriptor;
  };
};

/**
 * 速率限制时间窗口装饰器 - 设置时间窗口 (秒)
 * 
 * @param ttlSeconds 时间窗口 (秒)
 * 
 * @example
 * @RateLimitTTL(60) // 60 秒窗口
 * @Get('api')
 * getData() {
 *   return this.service.getData();
 * }
 */
export const RateLimitTTL = (ttlSeconds: number) => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(RATE_LIMIT_TTL_METADATA, ttlSeconds, descriptor.value);
    return descriptor;
  };
};
