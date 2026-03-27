/**
 * 统一响应格式拦截器
 * 将所有成功响应封装为标准格式
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: '操作成功',
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
