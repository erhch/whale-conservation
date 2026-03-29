/**
 * ISO 8601 日期解析管道
 * 
 * 用于处理查询参数中的必填日期字段
 * 支持 ISO 8601 格式 (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss.sssZ)
 * 当值为 undefined/null/空字符串时抛出异常
 * 当值无法转换为有效日期时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseISO8601Options {
  min?: Date;
  max?: Date;
}

@Injectable()
export class ParseISO8601Pipe implements PipeTransform<string | Date, Date> {
  private readonly min?: Date;
  private readonly max?: Date;

  constructor(options: ParseISO8601Options = {}) {
    this.min = options.min;
    this.max = options.max;
  }

  transform(value: string | Date | undefined, metadata: ArgumentMetadata): Date {
    // 处理 undefined/null/空字符串 - 必填字段不允许
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${metadata.data || '参数'} 是必填项，请提供有效的日期 (ISO 8601 格式)`);
    }

    // 转换为 Date 对象
    let dateValue: Date;
    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === 'string') {
      dateValue = new Date(value);
    } else {
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的日期格式`);
    }

    // 验证是否为有效日期
    if (Number.isNaN(dateValue.getTime())) {
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的日期格式 (ISO 8601)`);
    }

    // 范围验证
    if (this.min !== undefined && dateValue.getTime() < this.min.getTime()) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能早于 ${this.min.toISOString()}`);
    }

    if (this.max !== undefined && dateValue.getTime() > this.max.getTime()) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能晚于 ${this.max.toISOString()}`);
    }

    return dateValue;
  }
}
