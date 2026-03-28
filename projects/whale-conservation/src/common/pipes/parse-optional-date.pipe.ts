/**
 * 可选日期解析管道
 * 
 * 用于处理查询参数中的可选日期字段
 * 支持 ISO 8601 格式 (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss.sssZ)
 * 当值为 undefined/null/空字符串时返回默认值
 * 当值无法转换为有效日期时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseOptionalDateOptions {
  defaultValue?: Date;
  min?: Date;
  max?: Date;
}

@Injectable()
export class ParseOptionalDatePipe implements PipeTransform<string | Date | undefined, Date | undefined> {
  private readonly defaultValue?: Date;
  private readonly min?: Date;
  private readonly max?: Date;

  constructor(options: ParseOptionalDateOptions = {}) {
    this.defaultValue = options.defaultValue;
    this.min = options.min;
    this.max = options.max;
  }

  transform(value: string | Date | undefined, metadata: ArgumentMetadata): Date | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
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
      throw new BadRequestException(`${metadata.data || '参数'} 不能早于 ${this.min.toISOString().split('T')[0]}`);
    }

    if (this.max !== undefined && dateValue.getTime() > this.max.getTime()) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能晚于 ${this.max.toISOString().split('T')[0]}`);
    }

    return dateValue;
  }
}
