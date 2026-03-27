/**
 * 可选布尔值解析管道
 * 
 * 用于处理查询参数中的可选布尔字段
 * 支持多种输入格式：'true'/'false', '1'/'0', 'yes'/'no', 'on'/'off'
 * 当值为 undefined/null/空字符串时返回默认值
 * 当值无法转换为布尔值时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseOptionalBooleanOptions {
  defaultValue?: boolean;
}

@Injectable()
export class ParseOptionalBooleanPipe implements PipeTransform<string | boolean | undefined, boolean | undefined> {
  private readonly defaultValue?: boolean;

  // 真值映射
  private readonly trueValues = new Set(['true', '1', 'yes', 'on', 'y']);
  // 假值映射
  private readonly falseValues = new Set(['false', '0', 'no', 'off', 'n']);

  constructor(options: ParseOptionalBooleanOptions = {}) {
    this.defaultValue = options.defaultValue;
  }

  transform(value: string | boolean | undefined, metadata: ArgumentMetadata): boolean | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    // 如果已经是布尔值，直接返回
    if (typeof value === 'boolean') {
      return value;
    }

    // 转换为小写字符串进行匹配
    const lowerValue = value.toString().toLowerCase();

    // 检查是否为真值
    if (this.trueValues.has(lowerValue)) {
      return true;
    }

    // 检查是否为假值
    if (this.falseValues.has(lowerValue)) {
      return false;
    }

    // 无法解析，抛出异常
    throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的布尔值 (true/false, 1/0, yes/no, on/off)`);
  }
}
