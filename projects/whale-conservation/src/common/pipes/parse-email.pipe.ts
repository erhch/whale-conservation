import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * 邮箱验证管道选项
 */
export interface ParseEmailOptions {
  /** 是否必填，默认 true */
  required?: boolean;
}

/**
 * 邮箱格式验证管道
 * 
 * 验证输入是否为有效的邮箱地址格式
 * 
 * @example
 * ```typescript
 * // 必填邮箱 - 基础用法
 * @Body('email', new ParseEmailPipe())
 * email: string;
 * 
 * // 可选邮箱 - 允许 undefined
 * @Query('contactEmail', new ParseEmailPipe({ required: false }))
 * contactEmail?: string;
 * ```
 */
@Injectable()
export class ParseEmailPipe implements PipeTransform<string | undefined, string> {
  private readonly required: boolean;

  /**
   * 邮箱正则表达式
   * 支持常见邮箱格式：user@domain.com, user.name+tag@domain.co.uk 等
   */
  private readonly emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  constructor(options: ParseEmailOptions = {}) {
    this.required = options.required ?? true;
  }

  transform(value: string | undefined): string {
    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (!this.required) {
        return undefined as unknown as string;
      }
      throw new BadRequestException('邮箱地址是必填项，请提供有效的邮箱地址');
    }

    // 验证邮箱格式
    if (!this.emailRegex.test(value)) {
      throw new BadRequestException(`${value} 不是有效的邮箱地址格式`);
    }

    return value.toLowerCase().trim();
  }
}
