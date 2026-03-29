/**
 * 必填日期解析管道
 * 
 * 用于处理查询参数/路径参数中的必填日期字段 (YYYY-MM-DD 格式)
 * 当值为 undefined/null/空字符串时抛出异常
 * 当值无法转换为有效日期时抛出异常
 * 支持日期范围验证 (minDate/maxDate)
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseDateOptions {
  minDate?: string;
  maxDate?: string;
}

@Injectable()
export class ParseDatePipe implements PipeTransform<string | Date | undefined, Date> {
  private readonly minDate?: Date;
  private readonly maxDate?: Date;

  constructor(options: ParseDateOptions = {}) {
    if (options.minDate) {
      this.minDate = new Date(options.minDate);
    }
    if (options.maxDate) {
      this.maxDate = new Date(options.maxDate);
    }
  }

  transform(value: string | Date | undefined, metadata: ArgumentMetadata): Date {
    // 处理 undefined/null/空字符串 - 必填项不允许为空
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${metadata.data || '参数'} 是必填项，请提供有效的日期 (YYYY-MM-DD 格式)`);
    }

    // 转换为 Date 对象
    let dateValue: Date;
    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === 'string') {
      // 验证格式 YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        throw new BadRequestException(`${metadata.data || '参数'} 必须是 YYYY-MM-DD 格式的日期`);
      }

      dateValue = new Date(value);
      
      // 验证日期是否有效 (防止 2024-02-30 这样的无效日期)
      if (Number.isNaN(dateValue.getTime())) {
        throw new BadRequestException(`${metadata.data || '参数'} 不是有效的日期`);
      }

      // 确保解析后的日期与输入格式一致 (防止 2024-02-31 被解析为 2024-03-02)
      const [year, month, day] = value.split('-').map(Number);
      if (
        dateValue.getFullYear() !== year ||
        dateValue.getMonth() + 1 !== month ||
        dateValue.getDate() !== day
      ) {
        throw new BadRequestException(`${metadata.data || '参数'} 不是有效的日期`);
      }
    } else {
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的日期`);
    }

    // 范围验证
    if (this.minDate && dateValue < this.minDate) {
      const minDateStr = this.minDate.toISOString().split('T')[0];
      throw new BadRequestException(`${metadata.data || '参数'} 不能早于 ${minDateStr}`);
    }

    if (this.maxDate && dateValue > this.maxDate) {
      const maxDateStr = this.maxDate.toISOString().split('T')[0];
      throw new BadRequestException(`${metadata.data || '参数'} 不能晚于 ${maxDateStr}`);
    }

    return dateValue;
  }
}
