/**
 * UUID 验证管道
 * 
 * 用于验证参数是否为有效的 UUID 格式
 * 支持 UUID v1-v5 格式验证
 * 当值为无效 UUID 时抛出 BadRequestException
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface ParseUUIDOptions {
  version?: 1 | 2 | 3 | 4 | 5;
  required?: boolean;
}

// UUID 正则表达式 (支持 v1-v5)
const UUID_REGEX = {
  any: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  2: /^[0-9a-f]{8}-[0-9a-f]{4}-2[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  3: /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string | undefined, string> {
  private readonly version?: 1 | 2 | 3 | 4 | 5;
  private readonly required: boolean;

  constructor(options: ParseUUIDOptions = {}) {
    this.version = options.version;
    this.required = options.required ?? true;
  }

  transform(value: string | undefined, metadata: ArgumentMetadata): string {
    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (this.required) {
        throw new BadRequestException(`${metadata.data || '参数'} 是必填项，请提供有效的 UUID`);
      }
      return undefined as unknown as string;
    }

    // 选择正则表达式
    const regex = this.version ? UUID_REGEX[this.version] : UUID_REGEX.any;

    // 验证 UUID 格式
    if (!regex.test(value)) {
      const versionInfo = this.version ? `(v${this.version})` : '';
      throw new BadRequestException(`${metadata.data || '参数'} 必须是有效的 UUID${versionInfo}格式`);
    }

    return value;
  }
}
