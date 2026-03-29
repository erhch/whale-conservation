/**
 * Parse Array Pipe - 数组解析验证管道
 *
 * 用于解析逗号分隔的字符串为数组，支持类型转换和验证
 *
 * @example
 * ```typescript
 * // GET /api/species?ids=blue,fin,humpback
 * @Query('ids', new ParseArrayPipe()) ids: string[]
 *
 * // GET /api/sightings?minDepth=100,200,300
 * @Query('minDepth', new ParseArrayPipe({ transform: (item) => parseFloat(item) })) depths: number[]
 *
 * // GET /api/stations?status=active,pending (with enum validation)
 * @Query('status', new ParseArrayPipe({ enum: StationStatus })) statuses: StationStatus[]
 * ```
 */

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';

export interface ParseArrayOptions {
  /** 分隔符，默认为逗号 */
  separator?: string;
  /** 是否允许空数组，默认为 true */
  allowEmpty?: boolean;
  /** 最小数组长度 */
  minItems?: number;
  /** 最大数组长度 */
  maxItems?: number;
  /** 数组项转换函数 */
  transform?: (item: string, index: number) => any;
  /** 枚举类型验证 */
  enum?: Type<any> | Record<string, any>;
  /** 自定义错误消息 */
  errorMessage?: string;
}

@Injectable()
export class ParseArrayPipe implements PipeTransform<any> {
  private readonly options: Required<Omit<ParseArrayOptions, 'transform' | 'enum' | 'errorMessage'>> &
    Pick<ParseArrayOptions, 'transform' | 'enum' | 'errorMessage'>;

  constructor(options: ParseArrayOptions = {}) {
    this.options = {
      separator: options.separator ?? ',',
      allowEmpty: options.allowEmpty ?? true,
      minItems: options.minItems ?? 0,
      maxItems: options.maxItems ?? Infinity,
      transform: options.transform,
      enum: options.enum,
      errorMessage: options.errorMessage,
    };
  }

  transform(value: any, metadata: ArgumentMetadata): any {
    // 如果值为空且允许空数组，返回空数组
    if (value === null || value === undefined || value === '') {
      if (this.options.allowEmpty) {
        return [];
      }
      throw new BadRequestException(
        this.options.errorMessage ?? `${metadata.data || '参数'} 不能为空`,
      );
    }

    // 如果已经是数组，直接验证
    if (Array.isArray(value)) {
      return this.validateArray(value);
    }

    // 如果是字符串，解析为数组
    if (typeof value === 'string') {
      const items = value.split(this.options.separator).map((item) => item.trim()).filter((item) => item !== '');
      
      // 如果解析后为空且允许空数组，返回空数组
      if (items.length === 0) {
        if (this.options.allowEmpty) {
          return [];
        }
        throw new BadRequestException(
          this.options.errorMessage ?? `${metadata.data || '参数'} 不能为空数组`,
        );
      }

      // 转换数组项
      const transformed = this.options.transform
        ? items.map((item, index) => this.options.transform!(item, index))
        : items;

      return this.validateArray(transformed);
    }

    // 其他类型，包装为数组
    return this.validateArray([value]);
  }

  private validateArray(items: any[]): any[] {
    // 验证最小长度
    if (items.length < this.options.minItems) {
      throw new BadRequestException(
        this.options.errorMessage ?? `数组长度不能少于 ${this.options.minItems} 项`,
      );
    }

    // 验证最大长度
    if (items.length > this.options.maxItems) {
      throw new BadRequestException(
        this.options.errorMessage ?? `数组长度不能超过 ${this.options.maxItems} 项`,
      );
    }

    // 枚举验证
    if (this.options.enum) {
      const enumValues = this.getEnumValues(this.options.enum);
      for (const item of items) {
        if (!enumValues.includes(item)) {
          throw new BadRequestException(
            this.options.errorMessage ?? `值 "${item}" 不是有效的枚举值`,
          );
        }
      }
    }

    return items;
  }

  private getEnumValues(enumType: Type<any> | Record<string, any>): any[] {
    // 处理 TypeScript 枚举 (包含数字和字符串映射)
    if (typeof enumType === 'object') {
      return Object.values(enumType).filter(
        (value) => typeof value !== 'number' || !Number.isNaN(value),
      );
    }
    return [];
  }
}
