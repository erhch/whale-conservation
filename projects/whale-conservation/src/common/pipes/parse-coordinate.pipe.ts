/**
 * GPS 坐标解析管道
 * 
 * 用于处理地理位置坐标 (纬度/经度) 的验证
 * 支持单独的纬度或经度验证，也支持坐标对验证
 * 
 * 纬度范围：-90 到 90
 * 经度范围：-180 到 180
 */

import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type CoordinateType = 'latitude' | 'longitude';

export interface ParseCoordinateOptions {
  type: CoordinateType;
  allowOptional?: boolean; // 是否允许为空，默认 false
}

@Injectable()
export class ParseCoordinatePipe implements PipeTransform<string | number | undefined, number> {
  private readonly type: CoordinateType;
  private readonly allowOptional: boolean;
  private readonly min: number;
  private readonly max: number;

  constructor(options: ParseCoordinateOptions) {
    this.type = options.type;
    this.allowOptional = options.allowOptional ?? false;

    // 根据坐标类型设置范围
    if (this.type === 'latitude') {
      this.min = -90;
      this.max = 90;
    } else {
      this.min = -180;
      this.max = 180;
    }
  }

  transform(value: string | number | undefined, metadata: ArgumentMetadata): number {
    // 处理空值
    if (value === undefined || value === null || value === '') {
      if (this.allowOptional) {
        return undefined as any;
      }
      const coordName = this.type === 'latitude' ? '纬度' : '经度';
      throw new BadRequestException(`${metadata.data || coordName} 是必填项，请提供有效的坐标值`);
    }

    // 转换为数字
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // 验证是否为有效数字
    if (Number.isNaN(numValue) || !Number.isFinite(numValue)) {
      const coordName = this.type === 'latitude' ? '纬度' : '经度';
      throw new BadRequestException(`${metadata.data || coordName} 必须是有效的数字`);
    }

    // 范围验证
    if (numValue < this.min || numValue > this.max) {
      const coordName = this.type === 'latitude' ? '纬度' : '经度';
      throw new BadRequestException(`${metadata.data || coordName} 必须在 ${this.min} 到 ${this.max} 之间`);
    }

    return numValue;
  }
}

/**
 * 坐标对解析结果
 */
export interface CoordinatePair {
  latitude: number;
  longitude: number;
}

/**
 * 坐标对解析管道
 * 
 * 同时验证纬度和经度，返回坐标对对象
 */
@Injectable()
export class ParseCoordinatePairPipe implements PipeTransform<{ latitude?: any; longitude?: any }, CoordinatePair> {
  private readonly allowOptional: boolean;

  constructor(options: { allowOptional?: boolean } = {}) {
    this.allowOptional = options.allowOptional ?? false;
  }

  transform(value: { latitude?: any; longitude?: any }, metadata: ArgumentMetadata): CoordinatePair {
    if (!value) {
      throw new BadRequestException('坐标数据不能为空');
    }

    const latitudePipe = new ParseCoordinatePipe({ type: 'latitude', allowOptional: this.allowOptional });
    const longitudePipe = new ParseCoordinatePipe({ type: 'longitude', allowOptional: this.allowOptional });

    const latitude = latitudePipe.transform(value.latitude, { ...metadata, data: 'latitude' });
    const longitude = longitudePipe.transform(value.longitude, { ...metadata, data: 'longitude' });

    return { latitude, longitude };
  }
}
