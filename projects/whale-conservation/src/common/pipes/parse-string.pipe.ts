/**
 * 字符串解析管道
 * 
 * 用于处理查询参数/请求体中的必需字符串字段
 * 支持自动修剪、长度验证、正则表达式匹配
 * 当值为 undefined/null/空字符串时抛出异常
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseStringOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
}

@Injectable()
export class ParseStringPipe implements PipeTransform<string | undefined, string> {
  private readonly minLength?: number;
  private readonly maxLength?: number;
  private readonly pattern?: RegExp;
  private readonly patternMessage?: string;
  private readonly trim: boolean;
  private readonly toLowerCase: boolean;
  private readonly toUpperCase: boolean;

  constructor(options: ParseStringOptions = {}) {
    this.minLength = options.minLength;
    this.maxLength = options.maxLength;
    this.pattern = options.pattern;
    this.patternMessage = options.patternMessage;
    this.trim = options.trim ?? true;
    this.toLowerCase = options.toLowerCase ?? false;
    this.toUpperCase = options.toUpperCase ?? false;
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): string {
    // 处理 undefined/null
    if (value === undefined || value === null) {
      throw new BadRequestException(`${metadata.data || '参数'} 不能为空`);
    }

    // 字符串转换和修剪
    let stringValue = String(value);
    
    if (this.trim) {
      stringValue = stringValue.trim();
    }

    // 空字符串检查
    if (stringValue === '') {
      throw new BadRequestException(`${metadata.data || '参数'} 不能为空字符串`);
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
