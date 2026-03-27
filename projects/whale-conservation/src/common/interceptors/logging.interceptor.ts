/**
 * 请求日志拦截器
 * 记录每个请求的处理时间和基本信息
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const processingTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        this.logger.log(
          `${method} ${url} ${statusCode} - ${processingTime}ms`,
        );
      }),
    );
  }
}
