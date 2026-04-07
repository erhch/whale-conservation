/**
 * 请求日志中间件
 * 记录所有 HTTP 请求的方法、路径、状态码、响应时间
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    // 请求完成后的日志
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const responseTime = Date.now() - start;

      const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';

      this.logger.log(
        `${color}${statusCode}${reset} ${method} ${originalUrl} ${responseTime}ms ${contentLength}b - ${ip} "${userAgent}"`,
      );
    });

    next();
  }
}
