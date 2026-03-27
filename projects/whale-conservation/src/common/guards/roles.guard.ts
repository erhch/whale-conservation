/**
 * RBAC 角色权限守卫
 * 
 * 检查用户是否拥有访问路由所需的角色权限
 * 需要配合 @Roles() 装饰器和 JwtAuthGuard 使用
 * 
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../auth/entities/user.entity';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由上标记的所需角色
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有标记角色，允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取当前用户 (由 JwtAuthGuard 注入)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // 检查用户角色是否在允许的角色列表中
    return requiredRoles.some((role) => user.role === role);
  }
}
