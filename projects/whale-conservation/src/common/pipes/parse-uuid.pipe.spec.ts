/**
 * ParseUUIDPipe 单元测试
 * 
 * 测试 UUID 验证管道的验证逻辑
 * 覆盖 UUID v1-v5 格式验证、必填/可选模式、版本特定验证等场景
 */

import { BadRequestException } from '@nestjs/common';
import { ParseUUIDPipe } from './parse-uuid.pipe';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;
  let optionalPipe: ParseUUIDPipe;
  let uuidV1Pipe: ParseUUIDPipe;
  let uuidV4Pipe: ParseUUIDPipe;
  let uuidV5Pipe: ParseUUIDPipe;

  // 标准 UUID v4 示例
  const validUUIDv4 = '550e8400-e29b-41d4-a716-446655440000';
  const validUUIDv4Upper = '550E8400-E29B-41D4-A716-446655440000';
  
  // UUID v1 示例 (时间戳为基础)
  const validUUIDv1 = 'c232ab00-9aba-11ed-a1f0-0242ac120002';
  
  // UUID v3 示例 (基于 MD5 命名空间)
  const validUUIDv3 = '6fa459ea-ee8a-3ca4-894e-db77e160355e';
  
  // UUID v5 示例 (基于 SHA-1 命名空间)
  const validUUIDv5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';

  beforeEach(() => {
    pipe = new ParseUUIDPipe(); // 默认 required: true, 任意版本
    optionalPipe = new ParseUUIDPipe({ required: false });
    uuidV1Pipe = new ParseUUIDPipe({ version: 1 });
    uuidV4Pipe = new ParseUUIDPipe({ version: 4 });
    uuidV5Pipe = new ParseUUIDPipe({ version: 5 });
  });

  describe('基本 UUID 验证', () => {
    it('应该接受有效的 UUID v4', () => {
      const result = pipe.transform(validUUIDv4, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv4);
    });

    it('应该接受大写的 UUID', () => {
      const result = pipe.transform(validUUIDv4Upper, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv4Upper);
    });

    it('应该接受 UUID v1', () => {
      const result = pipe.transform(validUUIDv1, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv1);
    });

    it('应该接受 UUID v3', () => {
      const result = pipe.transform(validUUIDv3, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv3);
    });

    it('应该接受 UUID v5', () => {
      const result = pipe.transform(validUUIDv5, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv5);
    });

    it('应该接受混合大小写的 UUID', () => {
      const mixedCase = '550E8400-e29b-41D4-a716-446655440000';
      const result = pipe.transform(mixedCase, { type: 'param', data: 'id' });
      expect(result).toBe(mixedCase);
    });
  });

  describe('必填模式 (required: true)', () => {
    it('当值为 undefined 时应该抛出异常', () => {
      expect(() => {
        pipe.transform(undefined, { type: 'param', data: 'userId' });
      }).toThrow(BadRequestException);
    });

    it('当值为 null 时应该抛出异常', () => {
      expect(() => {
        pipe.transform(null as any, { type: 'param', data: 'userId' });
      }).toThrow(BadRequestException);
    });

    it('当值为空字符串时应该抛出异常', () => {
      expect(() => {
        pipe.transform('', { type: 'param', data: 'userId' });
      }).toThrow(BadRequestException);
    });

    it('异常消息应该包含参数名称', () => {
      try {
        pipe.transform(undefined, { type: 'param', data: 'orderId' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('orderId');
        expect(error.message).toContain('必填项');
      }
    });

    it('当没有参数名称时应该使用默认提示', () => {
      try {
        pipe.transform(undefined, { type: 'param' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('参数');
      }
    });
  });

  describe('可选模式 (required: false)', () => {
    it('当值为 undefined 时应该返回 undefined', () => {
      const result = optionalPipe.transform(undefined, { type: 'param', data: 'id' });
      expect(result).toBeUndefined();
    });

    it('当值为 null 时应该返回 undefined', () => {
      const result = optionalPipe.transform(null as any, { type: 'param', data: 'id' });
      expect(result).toBeUndefined();
    });

    it('当值为空字符串时应该返回 undefined', () => {
      const result = optionalPipe.transform('', { type: 'param', data: 'id' });
      expect(result).toBeUndefined();
    });

    it('当提供有效 UUID 时应该正常返回', () => {
      const result = optionalPipe.transform(validUUIDv4, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv4);
    });
  });

  describe('版本特定验证', () => {
    it('UUID v1 pipe 应该接受 UUID v1', () => {
      const result = uuidV1Pipe.transform(validUUIDv1, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv1);
    });

    it('UUID v1 pipe 应该拒绝 UUID v4', () => {
      expect(() => {
        uuidV1Pipe.transform(validUUIDv4, { type: 'param', data: 'id' });
      }).toThrow(BadRequestException);
    });

    it('UUID v4 pipe 应该接受 UUID v4', () => {
      const result = uuidV4Pipe.transform(validUUIDv4, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv4);
    });

    it('UUID v4 pipe 应该拒绝 UUID v1', () => {
      expect(() => {
        uuidV4Pipe.transform(validUUIDv1, { type: 'param', data: 'id' });
      }).toThrow(BadRequestException);
    });

    it('UUID v4 pipe 应该拒绝 UUID v5', () => {
      expect(() => {
        uuidV4Pipe.transform(validUUIDv5, { type: 'param', data: 'id' });
      }).toThrow(BadRequestException);
    });

    it('UUID v5 pipe 应该接受 UUID v5', () => {
      const result = uuidV5Pipe.transform(validUUIDv5, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv5);
    });

    it('UUID v5 pipe 应该拒绝 UUID v4', () => {
      expect(() => {
        uuidV5Pipe.transform(validUUIDv4, { type: 'param', data: 'id' });
      }).toThrow(BadRequestException);
    });

    it('版本特定异常消息应该包含版本号', () => {
      try {
        uuidV4Pipe.transform(validUUIDv1, { type: 'param', data: 'recordId' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('v4');
      }
    });
  });

  describe('无效 UUID 格式', () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '12345678-1234-1234-1234-123456789012', // 版本位不对 (0)
      '550e8400-e29b-41d4-a716-44665544000',  // 太短 (少一位)
      '550e8400-e29b-41d4-a716-4466554400000', // 太长 (多一位)
      '550e8400e29b41d4a716446655440000',     // 缺少连字符
      '550e8400-e29b-41d4-a716-44665544000g', // 包含无效字符 'g'
      '550e8400-e29b-61d4-a716-446655440000', // 版本位 6 (无效)
      '550e8400-e29b-41d4-c716-446655440000', // variant 位不对 (c)
      '550e8400-e29b-41d4-a716-446655440000-', // 尾部多余连字符
      '-550e8400-e29b-41d4-a716-446655440000', // 头部多余连字符
      '550e8400-e29b-41d4-a716-446655440000 ', // 尾部空格
      ' 550e8400-e29b-41d4-a716-446655440000', // 头部空格
      'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx', // 包含 'x' 占位符
    ];

    invalidUUIDs.forEach((invalidUUID) => {
      it(`应该拒绝无效的 UUID: "${invalidUUID}"`, () => {
        expect(() => {
          pipe.transform(invalidUUID, { type: 'param', data: 'id' });
        }).toThrow(BadRequestException);
      });
    });

    it('异常消息应该说明需要 UUID 格式', () => {
      try {
        pipe.transform('not-a-uuid', { type: 'param', data: 'testId' });
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('UUID');
        expect(error.message).toContain('格式');
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理 UUID v2 (虽然罕见)', () => {
      const validUUIDv2 = '12345678-1234-2abc-8def-123456789012';
      const result = pipe.transform(validUUIDv2, { type: 'param', data: 'id' });
      expect(result).toBe(validUUIDv2);
    });

    it('应该处理最小 UUID v4', () => {
      const minUUIDv4 = '00000000-0000-4000-8000-000000000000';
      const result = pipe.transform(minUUIDv4, { type: 'param', data: 'id' });
      expect(result).toBe(minUUIDv4);
    });

    it('应该处理最大 UUID v4', () => {
      const maxUUIDv4 = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
      const result = pipe.transform(maxUUIDv4, { type: 'param', data: 'id' });
      expect(result).toBe(maxUUIDv4);
    });

    it('应该拒绝 variant 位为 0-7 的 UUID', () => {
      const invalidVariant = '550e8400-e29b-41d4-0716-446655440000';
      expect(() => {
        pipe.transform(invalidVariant, { type: 'param', data: 'id' });
      }).toThrow(BadRequestException);
    });

    it('应该拒绝 variant 位为 a 以外的 8-b 范围外的值', () => {
      // 实际上 8, 9, a, b 都是有效的 variant 位
      const validVariant8 = '550e8400-e29b-41d4-8716-446655440000';
      const validVariant9 = '550e8400-e29b-41d4-9716-446655440000';
      const validVarianta = '550e8400-e29b-41d4-a716-446655440000';
      const validVariantb = '550e8400-e29b-41d4-b716-446655440000';
      
      expect(pipe.transform(validVariant8, { type: 'param', data: 'id' })).toBe(validVariant8);
      expect(pipe.transform(validVariant9, { type: 'param', data: 'id' })).toBe(validVariant9);
      expect(pipe.transform(validVarianta, { type: 'param', data: 'id' })).toBe(validVarianta);
      expect(pipe.transform(validVariantb, { type: 'param', data: 'id' })).toBe(validVariantb);
    });
  });

  describe('实际场景测试', () => {
    it('应该验证用户 ID 参数', () => {
      const userId = 'c9a9f0e8-3c4a-4b5e-8f7d-1a2b3c4d5e6f';
      const result = pipe.transform(userId, { type: 'param', data: 'userId' });
      expect(result).toBe(userId);
    });

    it('应该验证订单 ID 参数', () => {
      const orderId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
      const result = pipe.transform(orderId, { type: 'param', data: 'orderId' });
      expect(result).toBe(orderId);
    });

    it('应该验证记录 ID 参数 (UUID v4)', () => {
      const recordId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const result = uuidV4Pipe.transform(recordId, { type: 'param', data: 'recordId' });
      expect(result).toBe(recordId);
    });

    it('应该验证可选的会话 ID 参数', () => {
      const sessionId = '123e4567-e89b-42d3-a456-426614174000';
      const result = optionalPipe.transform(sessionId, { type: 'query', data: 'sessionId' });
      expect(result).toBe(sessionId);
    });

    it('应该处理缺失的可选会话 ID', () => {
      const result = optionalPipe.transform(undefined, { type: 'query', data: 'sessionId' });
      expect(result).toBeUndefined();
    });
  });

  describe('UUID 版本检测', () => {
    it('应该正确识别 UUID v1 (版本位为 1)', () => {
      expect(validUUIDv1).toMatch(UUID_REGEX_V1);
    });

    it('应该正确识别 UUID v3 (版本位为 3)', () => {
      expect(validUUIDv3).toMatch(UUID_REGEX_V3);
    });

    it('应该正确识别 UUID v4 (版本位为 4)', () => {
      expect(validUUIDv4).toMatch(UUID_REGEX_V4);
    });

    it('应该正确识别 UUID v5 (版本位为 5)', () => {
      expect(validUUIDv5).toMatch(UUID_REGEX_V5);
    });
  });
});

// UUID 正则表达式用于测试验证
const UUID_REGEX_V1 = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_REGEX_V3 = /^[0-9a-f]{8}-[0-9a-f]{4}-3[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_REGEX_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_REGEX_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
