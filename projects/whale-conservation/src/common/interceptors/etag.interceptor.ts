/**
 * ETag 拦截器 - 支持 HTTP 条件请求
 * 通过 ETag 和 If-None-Match 头实现客户端缓存验证
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { createHash } from 'crypto';
import { Request, Response } from 'express';

/**
 * ETag 装饰器 - 为路由启用 ETag 支持
 * @param weak 是否使用弱验证 (默认 false)
 */
export const ETag = (weak: boolean = false) => {
  return Reflect.metadata('etag:weak', weak);
};

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // 只对 GET 和 HEAD 请求处理 ETag
    if (!['GET', 'HEAD'].includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      map((body: any) => {
        // 跳过已经设置 ETag 的响应
        if (response.hasHeader('ETag')) {
          return body;
        }

        // 跳过没有 body 或 body 为 null/undefined 的响应
        if (!body || body === null || body === undefined) {
          return body;
        }

        // 生成 ETag
        const isWeak = this.getWeakMetadata(context);
        const etag = this.generateETag(body, isWeak);

        // 检查 If-None-Match 头
        const ifNoneMatch = request.headers['if-none-match'];
        if (ifNoneMatch) {
          // 处理多个 ETag 和弱验证前缀
          const matchList = ifNoneMatch.split(',').map((tag) => tag.trim().replace(/^W\//, ''));
          const currentEtag = etag.replace(/^W\//, '');

          // 如果匹配，返回 304 Not Modified
          if (matchList.includes(currentEtag) || matchList.includes('*')) {
            response.status(304);
            response.removeHeader('Content-Type');
            response.removeHeader('Content-Length');
            return null;
          }
        }

        // 设置 ETag 响应头
        response.setHeader('ETag', etag);

        // 设置 Vary 头，确保缓存正确处理
        if (!response.hasHeader('Vary')) {
          response.setHeader('Vary', 'If-None-Match');
        }

        return body;
      }),
    );
  }

  /**
   * 获取路由的弱验证元数据
   */
  private getWeakMetadata(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    return Reflect.getMetadata('etag:weak', handler) || false;
  }

  /**
   * 生成响应体的 ETag
   * @param body 响应体
   * @param weak 是否使用弱验证
   * @returns ETag 字符串
   */
  private generateETag(body: any, weak: boolean = false): string {
    // 序列化响应体
    const serialized = typeof body === 'string'
      ? body
      : JSON.stringify(body);

    // 生成 SHA256 哈希并截取前 16 个字符
    const hash = createHash('sha256')
      .update(serialized)
      .digest('hex')
      .substring(0, 16);

    // 添加 W/ 前缀表示弱验证
    return weak ? `W/"${hash}"` : `"${hash}"`;
  }
}
