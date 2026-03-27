/**
 * 可选浮点数解析管道
 * 
 * 用于处理查询参数中的可选浮点数字段
 * 适用于鲸鱼体长、体重、水温、盐度等测量数据
 * 当值为 undefined/null/空字符串时返回默认值
 * 当值无法转换为浮点数时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseOptionalFloatOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
  precision?: number; // 小数位数限制
}

@Injectable()
export class ParseOptionalFloatPipe implements PipeTransform<string | number | undefined, number | undefined> {
  private readonly defaultValue?: number;
  private readonly min?: number;
  private readonly max?: number;
  private readonly precision?: number;

  constructor(options: ParseOptionalFloatOptions = {}) {
    this.defaultValue = options.defaultValue;
    this.min = options.min;
    this.max = options.max;
    this.precision = options.precision;
  }

  transform(value: string | number | undefined, metadata: ArgumentMetadata): number | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
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

    // 精度验证（如果需要）
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
