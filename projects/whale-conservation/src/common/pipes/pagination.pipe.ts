/**
 * Pagination Pipe - 分页参数验证管道
 * 
 * 用于统一处理列表接口的分页参数 (page, limit)
 * 提供默认值、范围验证和类型转换
 * 
 * @example
 * ```typescript
 * @Get()
 * findAll(
 *   @Query('page', new PaginationPipe()) pagination: { page: number; limit: number }
 * ) {
 *   return this.service.findAll(pagination.page, pagination.limit);
 * }
 * ```
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface PaginationOptions {
  /** 默认页码 (从 1 开始), 默认值：1 */
  defaultPage?: number;
  /** 默认每页数量，默认值：10 */
  defaultLimit?: number;
  /** 最小页码，默认值：1 */
  minPage?: number;
  /** 最小每页数量，默认值：1 */
  minLimit?: number;
  /** 最大每页数量，默认值：100 */
  maxLimit?: number;
}

export interface PaginationResult {
  /** 当前页码 (从 1 开始) */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 偏移量 (用于数据库查询：OFFSET) */
  offset: number;
}

@Injectable()
export class PaginationPipe implements PipeTransform<Record<string, any>, PaginationResult> {
  private readonly defaultPage: number;
  private readonly defaultLimit: number;
  private readonly minPage: number;
  private readonly minLimit: number;
  private readonly maxLimit: number;

  constructor(options: PaginationOptions = {}) {
    this.defaultPage = options.defaultPage ?? 1;
    this.defaultLimit = options.defaultLimit ?? 10;
    this.minPage = options.minPage ?? 1;
    this.minLimit = options.minLimit ?? 1;
    this.maxLimit = options.maxLimit ?? 100;
  }

  transform(value: Record<string, any>, metadata: ArgumentMetadata): PaginationResult {
    // 从 query 参数中获取 page 和 limit
    const pageParam = value?.page ?? value?.['page'] ?? this.defaultPage;
    const limitParam = value?.limit ?? value?.['limit'] ?? value?.size ?? this.defaultLimit;

    // 转换为数字
    const page = this.parsePositiveInt(pageParam, 'page', this.defaultPage);
    const limit = this.parsePositiveInt(limitParam, 'limit', this.defaultLimit);

    // 验证范围
    if (page < this.minPage) {
      throw new BadRequestException(`页码不能小于 ${this.minPage}`);
    }

    if (limit < this.minLimit) {
      throw new BadRequestException(`每页数量不能小于 ${this.minLimit}`);
    }

    if (limit > this.maxLimit) {
      throw new BadRequestException(`每页数量不能超过 ${this.maxLimit}`);
    }

    return {
      page,
      limit,
      offset: (page - 1) * limit,
    };
  }

  private parsePositiveInt(value: any, paramName: string, defaultValue: number): number {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || parsed < 1) {
      return defaultValue;
    }

    return parsed;
  }
}
