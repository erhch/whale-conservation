/**
 * 必填浮点数解析管道
 * 
 * 用于处理查询参数/路径参数中的必填浮点数字段
 * 当值为 undefined/null/空字符串时抛出异常
 * 当值无法转换为浮点数时抛出异常
 * 支持范围验证 (min/max) 和精度控制
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseFloatOptions {
  min?: number;
  max?: number;
  precision?: number; // 小数位数限制
}

@Injectable()
export class ParseFloatPipe implements PipeTransform<string | number | undefined, number> {
  private readonly min?: number;
  private readonly max?: number;
  private readonly precision?: number;

  constructor(options: ParseFloatOptions = {}) {
    this.min = options.min;
    this.max = options.max;
    this.precision = options.precision;
  }

  transform(value: string | number | undefined, metadata: ArgumentMetadata): number {
    // 处理 undefined/null/空字符串 - 必填项不允许为空
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${metadata.data || '参数'} 是必填项，请提供有效的数字`);
    }

    // 转换为数字
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // 验证是否为有效数字
    if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的数字`);
    }

    // 范围验证
    if (this.min !== undefined && numValue < this.min) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能小于 ${this.min}`);
    }

    if (this.max !== undefined && numValue > this.max) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能大于 ${this.max}`);
    }

    // 精度验证
    if (this.precision !== undefined) {
      const stringValue = numValue.toString();
      const decimalIndex = stringValue.indexOf('.');
      if (decimalIndex !== -1) {
        const decimalPlaces = stringValue.length - decimalIndex - 1;
        if (decimalPlaces > this.precision) {
          throw new BadRequestException(`${metadata.data || '参数'} 最多保留 ${this.precision} 位小数`);
        }
      }
    }

    return numValue;
  }
}
