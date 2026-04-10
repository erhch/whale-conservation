/**
 * 缓存 TTL 装饰器
 * 用于设置路由的缓存过期时间（秒）
 */

import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_METADATA = 'cache_ttl';

export const CacheTTL = (seconds: number) => SetMetadata(CACHE_TTL_METADATA, seconds);
