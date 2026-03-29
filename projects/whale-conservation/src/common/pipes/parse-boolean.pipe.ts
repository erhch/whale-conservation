import { Injectable, BadRequestException, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * ParseBooleanPipe Options
 */
export interface ParseBooleanOptions {
  /**
   * 是否必填
   * @default true
   */
  required?: boolean;

  /**
   * 默认值 (仅在 required=false 且值为空时使用)
   * @default false
   */
  defaultValue?: boolean;
}

/**
 * 布尔值解析管道
 * 
 * 将字符串/数字/布尔值转换为标准的 boolean 类型
 * 
 * 支持的真值:
 * - 字符串：'true', '1', 'yes', 'on' (不区分大小写)
 * - 数字：1
 * - 布尔值：true
 * 
 * 支持的假值:
 * - 字符串：'false', '0', 'no', 'off' (不区分大小写)
 * - 数字：0
 * - 布尔值：false
 * 
 * @example
 * ```typescript
 * // 必填布尔参数 - 基础用法
 * @Query('isActive', new ParseBooleanPipe())
 * isActive: boolean;
 * 
 * // 可选布尔参数 - 允许 undefined
 * @Query('verified', new ParseBooleanPipe({ required: false }))
 * verified?: boolean;
 * 
 * // 带默认值
 * @Query('includeInactive', new ParseBooleanPipe({ required: false, defaultValue: false }))
 * includeInactive: boolean;
 * 
 * // 在 Controller 中使用
 * @Get('whales')
 * findAll(
 *   @Query('isActive', new ParseBooleanPipe()) isActive: boolean,
 *   @Query('verified', new ParseBooleanPipe({ required: false })) verified?: boolean,
 * ) {
 *   return this.whalesService.findAll({ isActive, verified });
 * }
 * ```
 */
@Injectable()
export class ParseBooleanPipe implements PipeTransform<string | number | boolean | undefined, boolean> {
  private readonly required: boolean;
  private readonly defaultValue: boolean;

  constructor(options: ParseBooleanOptions = {}) {
    this.required = options.required ?? true;
    this.defaultValue = options.defaultValue ?? false;
  }

  transform(
    value: string | number | boolean | undefined,
    metadata: ArgumentMetadata,
  ): boolean {
    const fieldName = metadata.data || '参数';

    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (!this.required) {
        return this.defaultValue;
      }
      throw new BadRequestException(`${fieldName} 是必填项，请提供有效的布尔值 (true/false)`);
    }

    // 已经是布尔值
    if (typeof value === 'boolean') {
      return value;
    }

    // 数字转换
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
      throw new BadRequestException(`${fieldName} 必须是有效的布尔值 (0 或 1)`);
    }

    // 字符串转换
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      
      // 真值
      if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
        return true;
      }
      
      // 假值
      if (['false', '0', 'no', 'off'].includes(lowerValue)) {
        return false;
      }

      throw new BadRequestException(
        `${fieldName} 必须是有效的布尔值 (true/false/1/0/yes/no/on/off)`,
      );
    }

    throw new BadRequestException(`${fieldName} 类型错误，期望布尔值`);
  }
}
