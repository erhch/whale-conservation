import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

/**
 * ParseJSONPipe - JSON 字符串解析验证管道
 * 
 * 用于将 JSON 字符串解析为 JavaScript 对象，并在解析失败时抛出 BadRequestException。
 * 适用于查询参数、表单数据等需要接收 JSON 字符串的场景。
 * 
 * @example
 * // 基本用法
 * @Get('filter')
 * find(@Query('criteria', new ParseJSONPipe()) criteria: any) {
 *   return this.service.find(criteria);
 * }
 * 
 * @example
 * // 带选项的用法
 * @Post('batch')
 * createBatch(@Body('metadata', new ParseJSONPipe({ optional: true })) metadata?: any) {
 *   return this.service.create(metadata);
 * }
 * 
 * @see https://docs.nestjs.com/techniques/validation#custom-validators
 */
export interface ParseJSONPipeOptions {
  /**
   * 是否允许空值。如果为 true 且值为空，则返回 null 而不抛出异常。
   * @default false
   */
  optional?: boolean;

  /**
   * 自定义错误消息
   * @default '验证失败：无效的 JSON 格式'
   */
  errorMessage?: string;

  /**
   * 解析后的类型验证函数
   * 如果提供，将在解析后对结果进行额外验证
   */
  validate?: (value: any) => boolean | string;
}

export class ParseJSONPipe implements PipeTransform<any> {
  private readonly optional: boolean;
  private readonly errorMessage: string;
  private readonly validateFn?: (value: any) => boolean | string;

  constructor(options: ParseJSONPipeOptions = {}) {
    this.optional = options.optional ?? false;
    this.errorMessage = options.errorMessage ?? '验证失败：无效的 JSON 格式';
    this.validateFn = options.validate;
  }

  /**
   * 转换并验证 JSON 字符串
   * 
   * @param value 输入的 JSON 字符串
   * @param metadata 参数元数据
   * @returns 解析后的 JavaScript 对象
   * @throws BadRequestException 当 JSON 格式无效或验证失败时
   */
  transform(value: any, metadata: ArgumentMetadata): any {
    // 处理空值
    if (value === null || value === undefined || value === '') {
      if (this.optional) {
        return null;
      }
      throw new BadRequestException(this.errorMessage);
    }

    // 如果已经是对象，直接返回 (可能是在某些情况下已经被解析)
    if (typeof value === 'object') {
      return this.validateAndReturn(value, metadata);
    }

    // 尝试解析 JSON 字符串
    try {
      const parsed = JSON.parse(value);
      return this.validateAndReturn(parsed, metadata);
    } catch (error) {
      throw new BadRequestException(this.errorMessage);
    }
  }

  /**
   * 验证并返回值
   * 
   * @param value 解析后的值
   * @param metadata 参数元数据
   * @returns 验证通过的值
   * @throws BadRequestException 当自定义验证失败时
   */
  private validateAndReturn(value: any, metadata: ArgumentMetadata): any {
    if (this.validateFn) {
      const result = this.validateFn(value);
      
      if (result === false) {
        throw new BadRequestException(this.errorMessage);
      }
      
      if (typeof result === 'string') {
        throw new BadRequestException(result);
      }
    }

    return value;
  }
}
