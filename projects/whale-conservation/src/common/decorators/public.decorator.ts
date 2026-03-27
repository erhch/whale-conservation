import { SetMetadata } from '@nestjs/common';

/**
 * IS_PUBLIC_KEY - 用于标记公开路由的元数据键
 * 配合 JwtAuthGuard 使用，允许特定路由跳过 JWT 认证
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() - 公开路由装饰器
 * 
 * 用于标记不需要认证的路由，通常用于：
 * - 登录/注册接口
 * - 公开数据查询接口
 * - 健康检查接口
 * 
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 * 
 * @Public()
 * @Get('species')
 * findAll() {
 *   return this.speciesService.findAll();
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
