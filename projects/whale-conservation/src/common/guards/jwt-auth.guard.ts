/**
 * JWT 认证守卫
 * 保护需要登录的路由
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

// 定义 public 元数据键
export const IS_PUBLIC_KEY = 'isPublic';

// 创建 @Public() 装饰器
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 检查路由是否标记为公开
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

// 需要导入 SetMetadata
import { SetMetadata } from '@nestjs/common';
