import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * URL 验证管道选项
 */
export interface ParseUrlOptions {
  /** 是否必填，默认 true */
  required?: boolean;
  /** 允许的协议列表，默认 ['http', 'https'] */
  protocols?: string[];
  /** 是否允许 IP 地址作为主机，默认 false */
  allowIp?: boolean;
}

/**
 * URL 格式验证管道
 * 
 * 验证输入是否为有效的 URL 地址，支持协议、域名、端口等验证
 * 
 * @example
 * ```typescript
 * // 必填 URL - 基础用法 (仅允许 http/https)
 * @Body('website', new ParseUrlPipe())
 * website: string;
 * 
 * // 可选 URL - 允许 undefined
 * @Query('imageUrl', new ParseUrlPipe({ required: false }))
 * imageUrl?: string;
 * 
 * // 自定义协议 - 允许 ftp
 * @Body('ftpUrl', new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] }))
 * ftpUrl: string;
 * 
 * // 允许 IP 地址
 * @Body('apiEndpoint', new ParseUrlPipe({ allowIp: true }))
 * apiEndpoint: string;
 * ```
 */
@Injectable()
export class ParseUrlPipe implements PipeTransform<string | undefined, string> {
  private readonly required: boolean;
  private readonly protocols: string[];
  private readonly allowIp: boolean;

  /**
   * URL 正则表达式
   * 支持域名和可选的 IP 地址验证
   */
  private readonly urlRegex = /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):\/\/)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d{2,5})?(?:[/?#][^\s]*)?$/;

  /**
   * 仅域名 URL 正则 (不允许 IP)
   */
  private readonly domainUrlRegex = /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):\/\/)(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:[/?#][^\s]*)?$/;

  constructor(options: ParseUrlOptions = {}) {
    this.required = options.required ?? true;
    this.protocols = options.protocols ?? ['http', 'https'];
    this.allowIp = options.allowIp ?? false;
  }

  transform(value: string | undefined): string {
    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (!this.required) {
        return undefined as unknown as string;
      }
      throw new BadRequestException('URL 地址是必填项，请提供有效的 URL');
    }

    const trimmed = value.trim();

    // 验证 URL 格式
    const regex = this.allowIp ? this.urlRegex : this.domainUrlRegex;
    if (!regex.test(trimmed)) {
      throw new BadRequestException(`${value} 不是有效的 URL 地址格式`);
    }

    // 提取并验证协议
    const protocolMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
    if (protocolMatch) {
      const protocol = protocolMatch[1].toLowerCase();
      if (!this.protocols.includes(protocol)) {
        throw new BadRequestException(`不支持的协议：${protocol}，仅允许 ${this.protocols.join(', ')}`);
      }
    }

    return trimmed;
  }
}
