/**
 * 角色权限装饰器
 * 
 * 用于标记路由需要的角色权限，配合 RolesGuard 使用
 * 
 * @example
 * @Roles(UserRole.ADMIN, UserRole.RESEARCHER)
 * @Get('admin-only')
 * findAll() { ... }
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../auth/entities/user.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
