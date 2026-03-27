/**
 * 可选整数解析管道
 * 
 * 用于处理查询参数中的可选整数字段
 * 当值为 undefined/null/空字符串时返回默认值
 * 当值无法转换为整数时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseOptionalIntOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
}

@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<string | number | undefined, number | undefined> {
  private readonly defaultValue?: number;
  private readonly min?: number;
  private readonly max?: number;

  constructor(options: ParseOptionalIntOptions = {}) {
    this.defaultValue = options.defaultValue;
    this.min = options.min;
    this.max = options.max;
  }

  transform(value: string | number | undefined, metadata: ArgumentMetadata): number | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    // 转换为数字
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;

    // 验证是否为有效整数
    if (Number.isNaN(numValue) || !Number.isInteger(numValue)) {
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的整数`);
    }

    // 范围验证
    if (this.min !== undefined && numValue < this.min) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能小于 ${this.min}`);
    }

    if (this.max !== undefined && numValue > this.max) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能大于 ${this.max}`);
    }

    return numValue;
  }
}
