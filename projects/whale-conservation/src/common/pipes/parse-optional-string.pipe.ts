/**
 * 可选字符串解析管道
 * 
 * 用于处理查询参数中的可选字符串字段
 * 支持自动修剪、长度验证、正则表达式匹配
 * 当值为 undefined/null/空字符串时返回默认值
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseOptionalStringOptions {
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
}

@Injectable()
export class ParseOptionalStringPipe implements PipeTransform<string | undefined, string | undefined> {
  private readonly defaultValue?: string;
  private readonly minLength?: number;
  private readonly maxLength?: number;
  private readonly pattern?: RegExp;
  private readonly patternMessage?: string;
  private readonly trim: boolean;
  private readonly toLowerCase: boolean;
  private readonly toUpperCase: boolean;

  constructor(options: ParseOptionalStringOptions = {}) {
    this.defaultValue = options.defaultValue;
    this.minLength = options.minLength;
    this.maxLength = options.maxLength;
    this.pattern = options.pattern;
    this.patternMessage = options.patternMessage;
    this.trim = options.trim ?? true;
    this.toLowerCase = options.toLowerCase ?? false;
    this.toUpperCase = options.toUpperCase ?? false;
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): string | undefined {
    // 处理 undefined/null/空字符串
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    // 字符串转换和修剪
    let stringValue = String(value);
    
    if (this.trim) {
      stringValue = stringValue.trim();
    }

    // 空字符串处理后返回默认值
    if (stringValue === '') {
      return this.defaultValue;
    }

    // 大小写转换
    if (this.toLowerCase) {
      stringValue = stringValue.toLowerCase();
    } else if (this.toUpperCase) {
      stringValue = stringValue.toUpperCase();
    }

    // 长度验证
    if (this.minLength !== undefined && stringValue.length < this.minLength) {
      throw new BadRequestException(
        `${metadata.data || '参数'} 长度不能少于 ${this.minLength} 个字符 (当前：${stringValue.length})`
      );
    }

    if (this.maxLength !== undefined && stringValue.length > this.maxLength) {
      throw new BadRequestException(
        `${metadata.data || '参数'} 长度不能超过 ${this.maxLength} 个字符 (当前：${stringValue.length})`
      );
    }

    // 正则表达式验证
    if (this.pattern !== undefined && !this.pattern.test(stringValue)) {
      throw new BadRequestException(
        this.patternMessage || `${metadata.data || '参数'} 格式不正确`
      );
    }

    return stringValue;
  }
}
