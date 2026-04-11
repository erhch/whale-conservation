import { Injectable, BadRequestException } from '@nestjs/common';
import { PipeTransform } from '@nestjs/common';

/**
 * ParsePhonePipe 选项
 */
export interface ParsePhoneOptions {
  /** 是否必填，默认 true */
  required?: boolean;
  /** 是否允许国际格式 (带 +86 前缀)，默认 false */
  allowInternational?: boolean;
}

/**
 * 手机号格式验证管道
 * 
 * 支持中国大陆手机号格式验证：
 * - 11 位数字
 * - 以 1 开头
 * - 第二位为 3-9
 * - 可选支持国际格式 (+86 前缀)
 * 
 * @example
 * // 基础用法 - 必填手机号
 * @Body('phone', new ParsePhonePipe())
 * phone: string;
 * 
 * @example
 * // 可选手机号
 * @Body('backupPhone', new ParsePhonePipe({ required: false }))
 * backupPhone?: string;
 * 
 * @example
 * // 允许国际格式
 * @Body('phone', new ParsePhonePipe({ allowInternational: true }))
 * phone: string;
 */
@Injectable()
export class ParsePhonePipe implements PipeTransform<string | undefined, string> {
  private readonly required: boolean;
  private readonly allowInternational: boolean;

  // 中国大陆手机号正则：1 开头，第二位 3-9，共 11 位
  private readonly cnPhoneRegex = /^1[3-9]\d{9}$/;
  
  // 国际格式：+86 开头 + 11 位手机号
  private readonly intlPhoneRegex = /^\+861[3-9]\d{9}$/;

  constructor(options: ParsePhoneOptions = {}) {
    this.required = options.required ?? true;
    this.allowInternational = options.allowInternational ?? false;
  }

  transform(value: string | undefined): string {
    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (!this.required) {
        return undefined as unknown as string;
      }
      throw new BadRequestException('手机号是必填项，请提供有效的中国大陆手机号');
    }

    // 去除空格和连字符
    const cleaned = value.replace(/[\s-]/g, '');

    // 选择正则表达式
    let regex: RegExp;
    if (this.allowInternational) {
      // 国际模式：支持 +86 前缀或纯 11 位
      if (!this.intlPhoneRegex.test(cleaned) && !this.cnPhoneRegex.test(cleaned)) {
        throw new BadRequestException(
          `${value} 不是有效的手机号格式 (支持 11 位数字或 +86 开头的国际格式)`
        );
      }
      return cleaned;
    } else {
      regex = this.cnPhoneRegex;
    }

    // 验证格式
    if (!regex.test(cleaned)) {
      throw new BadRequestException(
        `${value} 不是有效的中国大陆手机号格式 (11 位数字，以 1 开头，第二位为 3-9)`
      );
    }

    return cleaned;
  }
}
