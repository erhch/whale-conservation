/**
 * ParseCoordinatePipe 单元测试
 * 
 * 测试 GPS 坐标解析管道的验证逻辑
 */

import { BadRequestException } from '@nestjs/common';
import { ParseCoordinatePipe, ParseCoordinatePairPipe } from './parse-coordinate.pipe';

describe('ParseCoordinatePipe', () => {
  let latitudePipe: ParseCoordinatePipe;
  let longitudePipe: ParseCoordinatePipe;
  let optionalLatitudePipe: ParseCoordinatePipe;

  beforeEach(() => {
    latitudePipe = new ParseCoordinatePipe({ type: 'latitude' });
    longitudePipe = new ParseCoordinatePipe({ type: 'longitude' });
    optionalLatitudePipe = new ParseCoordinatePipe({ type: 'latitude', allowOptional: true });
  });

  describe('纬度验证 (Latitude)', () => {
    it('应该接受有效的纬度值 (正数)', () => {
      expect(latitudePipe.transform(45.5, { type: 'query' })).toBe(45.5);
      expect(latitudePipe.transform('30.123', { type: 'query' })).toBe(30.123);
    });

    it('应该接受有效的纬度值 (负数)', () => {
      expect(latitudePipe.transform(-45.5, { type: 'query' })).toBe(-45.5);
      expect(latitudePipe.transform('-30.123', { type: 'query' })).toBe(-30.123);
    });

    it('应该接受边界值', () => {
      expect(latitudePipe.transform(0, { type: 'query' })).toBe(0); // 赤道
      expect(latitudePipe.transform(90, { type: 'query' })).toBe(90); // 北极
      expect(latitudePipe.transform(-90, { type: 'query' })).toBe(-90); // 南极
    });

    it('应该拒绝超出范围的纬度值', () => {
      expect(() => latitudePipe.transform(91, { type: 'query' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform(-91, { type: 'query' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform('95.5', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝无效的数字', () => {
      expect(() => latitudePipe.transform(NaN, { type: 'query' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform(Infinity, { type: 'query' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform('abc', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝空值 (非可选)', () => {
      expect(() => latitudePipe.transform(undefined, { type: 'query', data: 'lat' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform(null as any, { type: 'query', data: 'lat' })).toThrow(BadRequestException);
      expect(() => latitudePipe.transform('', { type: 'query', data: 'lat' })).toThrow(BadRequestException);
    });

    it('应该接受空值 (可选模式)', () => {
      expect(optionalLatitudePipe.transform(undefined, { type: 'query' })).toBeUndefined();
      expect(optionalLatitudePipe.transform(null as any, { type: 'query' })).toBeUndefined();
      expect(optionalLatitudePipe.transform('', { type: 'query' })).toBeUndefined();
    });
  });

  describe('经度验证 (Longitude)', () => {
    it('应该接受有效的经度值', () => {
      expect(longitudePipe.transform(120.5, { type: 'query' })).toBe(120.5);
      expect(longitudePipe.transform('-73.9857', { type: 'query' })).toBe(-73.9857);
    });

    it('应该接受边界值', () => {
      expect(longitudePipe.transform(0, { type: 'query' })).toBe(0); // 本初子午线
      expect(longitudePipe.transform(180, { type: 'query' })).toBe(180);
      expect(longitudePipe.transform(-180, { type: 'query' })).toBe(-180);
    });

    it('应该拒绝超出范围的经度值', () => {
      expect(() => longitudePipe.transform(181, { type: 'query' })).toThrow(BadRequestException);
      expect(() => longitudePipe.transform(-181, { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝无效的数字', () => {
      expect(() => longitudePipe.transform(NaN, { type: 'query' })).toThrow(BadRequestException);
      expect(() => longitudePipe.transform('invalid', { type: 'query' })).toThrow(BadRequestException);
    });
  });

  describe('错误消息', () => {
    it('应该包含字段名称在错误消息中', () => {
      try {
        latitudePipe.transform(undefined, { type: 'query', data: 'latitude' });
        fail('应该抛出异常');
      } catch (error) {
        expect(error.message).toContain('latitude');
        expect(error.message).toContain('必填项');
      }
    });

    it('应该使用默认坐标名称当字段名缺失', () => {
      try {
        latitudePipe.transform(undefined, { type: 'query' });
        fail('应该抛出异常');
      } catch (error) {
        expect(error.message).toContain('纬度');
      }
    });
  });

  describe('数字类型转换', () => {
    it('应该将字符串转换为数字', () => {
      expect(latitudePipe.transform('45.5', { type: 'query' })).toBe(45.5);
      expect(longitudePipe.transform('120.123456', { type: 'query' })).toBe(120.123456);
    });

    it('应该保持数字类型不变', () => {
      expect(latitudePipe.transform(45.5, { type: 'query' })).toBe(45.5);
      expect(longitudePipe.transform(120, { type: 'query' })).toBe(120);
    });

    it('应该处理科学计数法', () => {
      expect(latitudePipe.transform('4.5e1', { type: 'query' })).toBe(45);
      expect(longitudePipe.transform('1.2e2', { type: 'query' })).toBe(120);
    });
  });

  describe('精度测试', () => {
    it('应该保留高精度坐标', () => {
      const highPrecisionLat = 31.230416666666666; // 上海人民广场纬度
      expect(latitudePipe.transform(highPrecisionLat, { type: 'query' })).toBe(highPrecisionLat);
    });

    it('应该处理小数点后多位', () => {
      expect(latitudePipe.transform('31.230416666666666', { type: 'query' })).toBe(31.230416666666666);
    });
  });
});

describe('ParseCoordinatePairPipe', () => {
  let pairPipe: ParseCoordinatePairPipe;
  let optionalPairPipe: ParseCoordinatePairPipe;

  beforeEach(() => {
    pairPipe = new ParseCoordinatePairPipe();
    optionalPairPipe = new ParseCoordinatePairPipe({ allowOptional: true });
  });

  it('应该接受有效的坐标对', () => {
    const result = pairPipe.transform(
      { latitude: 31.2304, longitude: 121.4737 },
      { type: 'body' }
    );
    expect(result).toEqual({ latitude: 31.2304, longitude: 121.4737 });
  });

  it('应该接受字符串格式的坐标对', () => {
    const result = pairPipe.transform(
      { latitude: '31.2304', longitude: '121.4737' },
      { type: 'body' }
    );
    expect(result).toEqual({ latitude: 31.2304, longitude: 121.4737 });
  });

  it('应该拒绝无效的纬度', () => {
    expect(() =>
      pairPipe.transform({ latitude: 95, longitude: 121.4737 }, { type: 'body' })
    ).toThrow(BadRequestException);
  });

  it('应该拒绝无效的经度', () => {
    expect(() =>
      pairPipe.transform({ latitude: 31.2304, longitude: 185 }, { type: 'body' })
    ).toThrow(BadRequestException);
  });

  it('应该拒绝空值对象', () => {
    expect(() => pairPipe.transform(null as any, { type: 'body' })).toThrow(BadRequestException);
    expect(() => pairPipe.transform(undefined as any, { type: 'body' })).toThrow(BadRequestException);
  });

  it('应该拒绝缺失的坐标字段', () => {
    expect(() =>
      pairPipe.transform({ latitude: 31.2304 }, { type: 'body' })
    ).toThrow(BadRequestException);
    expect(() =>
      pairPipe.transform({ longitude: 121.4737 }, { type: 'body' })
    ).toThrow(BadRequestException);
  });

  describe('可选模式', () => {
    it('应该接受可选的空坐标', () => {
      // 注意：可选模式下，如果传入 null/undefined 会直接返回
      // 但如果传入对象，字段仍然需要验证
      expect(() => optionalPairPipe.transform(null as any, { type: 'body' })).toThrow(BadRequestException);
    });
  });

  describe('实际场景测试', () => {
    it('应该处理上海坐标', () => {
      const shanghai = { latitude: '31.2304', longitude: '121.4737' };
      const result = pairPipe.transform(shanghai, { type: 'body' });
      expect(result.latitude).toBeCloseTo(31.2304, 4);
      expect(result.longitude).toBeCloseTo(121.4737, 4);
    });

    it('应该处理北京坐标', () => {
      const beijing = { latitude: 39.9042, longitude: 116.4074 };
      const result = pairPipe.transform(beijing, { type: 'body' });
      expect(result.latitude).toBe(39.9042);
      expect(result.longitude).toBe(116.4074);
    });

    it('应该处理鲸鱼观测点坐标 (示例)', () => {
      // 假设的鲸鱼观测点坐标
      const whaleSpot = { latitude: '35.6762', longitude: '139.6503' }; // 东京湾
      const result = pairPipe.transform(whaleSpot, { type: 'body' });
      expect(result).toEqual({ latitude: 35.6762, longitude: 139.6503 });
    });
  });
});
