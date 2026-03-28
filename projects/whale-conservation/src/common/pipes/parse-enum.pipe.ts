/**
 * 枚举值解析管道
 * 
 * 用于处理查询参数中的枚举值字段
 * 验证输入值是否为有效的枚举成员
 * 当值为 undefined/null/空字符串时返回默认值
 * 当值不在枚举范围内时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseEnumOptions<T = any> {
  enumType: T;
  defaultValue?: T[keyof T];
  required?: boolean;
}

@Injectable()
export class ParseEnumPipe<T = any> implements PipeTransform<string | undefined, T[keyof T] | undefined> {
  private readonly enumType: T;
  private readonly defaultValue?: T[keyof T];
  private readonly required: boolean;
  private readonly validValues: string[];

  constructor(options: ParseEnumOptions<T>) {
    this.enumType = options.enumType;
    this.defaultValue = options.defaultValue;
    this.required = options.required ?? false;

    // 提取枚举的所有有效值 (仅字符串值)
    this.validValues = Object.values(this.enumType)
      .filter((value) => typeof value === 'string');
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): T[keyof T] | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      if (this.required) {
        throw new BadRequestException(`${metadata.data || '参数'} 是必填项`);
      }
      return this.defaultValue;
    }

    // 验证是否为有效的枚举值
    if (!this.validValues.includes(value)) {
      throw new BadRequestException(
        `${metadata.data || '参数'} 必须是以下值之一：${this.validValues.join(', ')}`
      );
    }

    // 返回对应的枚举值
    return (this.enumType as any)[value];
  }
}
