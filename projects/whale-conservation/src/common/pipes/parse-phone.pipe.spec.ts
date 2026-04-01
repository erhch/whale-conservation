/**
 * ParsePhonePipe 单元测试
 * 
 * 测试手机号格式验证管道的验证逻辑
 * 覆盖场景：标准格式、国际格式、必填/可选、边界情况、错误处理
 */

import { BadRequestException } from '@nestjs/common';
import { ParsePhonePipe } from './parse-phone.pipe';

describe('ParsePhonePipe', () => {
  let pipe: ParsePhonePipe;
  let optionalPipe: ParsePhonePipe;
  let internationalPipe: ParsePhonePipe;

  beforeEach(() => {
    pipe = new ParsePhonePipe(); // 默认：必填，不允许国际格式
    optionalPipe = new ParsePhonePipe({ required: false });
    internationalPipe = new ParsePhonePipe({ allowInternational: true });
  });

  describe('标准手机号验证 (Standard Format)', () => {
    it('应该接受有效的 11 位手机号', () => {
      expect(pipe.transform('13800138000')).toBe('13800138000');
      expect(pipe.transform('19812345678')).toBe('19812345678');
    });

    it('应该接受所有有效号段', () => {
      // 13x 号段
      expect(pipe.transform('13000000000')).toBe('13000000000');
      expect(pipe.transform('13100000000')).toBe('13100000000');
      expect(pipe.transform('13200000000')).toBe('13200000000');
      expect(pipe.transform('13300000000')).toBe('13300000000');
      expect(pipe.transform('13400000000')).toBe('13400000000');
      expect(pipe.transform('13500000000')).toBe('13500000000');
      expect(pipe.transform('13600000000')).toBe('13600000000');
      expect(pipe.transform('13700000000')).toBe('13700000000');
      expect(pipe.transform('13800000000')).toBe('13800000000');
      expect(pipe.transform('13900000000')).toBe('13900000000');
      
      // 14x 号段
      expect(pipe.transform('14000000000')).toBe('14000000000');
      expect(pipe.transform('14100000000')).toBe('14100000000');
      
      // 15x 号段
      expect(pipe.transform('15000000000')).toBe('15000000000');
      expect(pipe.transform('15100000000')).toBe('15100000000');
      expect(pipe.transform('15200000000')).toBe('15200000000');
      expect(pipe.transform('15300000000')).toBe('15300000000');
      expect(pipe.transform('15500000000')).toBe('15500000000');
      expect(pipe.transform('15600000000')).toBe('15600000000');
      expect(pipe.transform('15700000000')).toBe('15700000000');
      expect(pipe.transform('15800000000')).toBe('15800000000');
      expect(pipe.transform('15900000000')).toBe('15900000000');
      
      // 16x 号段
      expect(pipe.transform('16600000000')).toBe('16600000000');
      
      // 17x 号段
      expect(pipe.transform('17000000000')).toBe('17000000000');
      expect(pipe.transform('17100000000')).toBe('17100000000');
      expect(pipe.transform('17200000000')).toBe('17200000000');
      expect(pipe.transform('17300000000')).toBe('17300000000');
      expect(pipe.transform('17400000000')).toBe('17400000000');
      expect(pipe.transform('17500000000')).toBe('17500000000');
      expect(pipe.transform('17600000000')).toBe('17600000000');
      expect(pipe.transform('17700000000')).toBe('17700000000');
      expect(pipe.transform('17800000000')).toBe('17800000000');
      expect(pipe.transform('17900000000')).toBe('17900000000');
      
      // 18x 号段
      expect(pipe.transform('18000000000')).toBe('18000000000');
      expect(pipe.transform('18100000000')).toBe('18100000000');
      expect(pipe.transform('18200000000')).toBe('18200000000');
      expect(pipe.transform('18300000000')).toBe('18300000000');
      expect(pipe.transform('18400000000')).toBe('18400000000');
      expect(pipe.transform('18500000000')).toBe('18500000000');
      expect(pipe.transform('18600000000')).toBe('18600000000');
      expect(pipe.transform('18700000000')).toBe('18700000000');
      expect(pipe.transform('18800000000')).toBe('18800000000');
      expect(pipe.transform('18900000000')).toBe('18900000000');
      
      // 19x 号段
      expect(pipe.transform('19000000000')).toBe('19000000000');
      expect(pipe.transform('19100000000')).toBe('19100000000');
      expect(pipe.transform('19200000000')).toBe('19200000000');
      expect(pipe.transform('19300000000')).toBe('19300000000');
      expect(pipe.transform('19400000000')).toBe('19400000000');
      expect(pipe.transform('19500000000')).toBe('19500000000');
      expect(pipe.transform('19600000000')).toBe('19600000000');
      expect(pipe.transform('19700000000')).toBe('19700000000');
      expect(pipe.transform('19800000000')).toBe('19800000000');
      expect(pipe.transform('19900000000')).toBe('19900000000');
    });

    it('应该自动去除空格', () => {
      expect(pipe.transform('138 0013 8000')).toBe('13800138000');
      expect(pipe.transform('138 00138000')).toBe('13800138000');
      expect(pipe.transform('1380013 8000')).toBe('13800138000');
    });

    it('应该自动去除连字符', () => {
      expect(pipe.transform('138-0013-8000')).toBe('13800138000');
      expect(pipe.transform('138-00138000')).toBe('13800138000');
      expect(pipe.transform('1380013-8000')).toBe('13800138000');
    });

    it('应该同时去除空格和连字符', () => {
      expect(pipe.transform('138 - 0013 - 8000')).toBe('13800138000');
      expect(pipe.transform('138- 0013 -8000')).toBe('13800138000');
    });
  });

  describe('必填验证 (Required Validation)', () => {
    it('应该拒绝 undefined 值 (必填模式)', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
    });

    it('应该拒绝 null 值 (必填模式)', () => {
      expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    });

    it('应该拒绝空字符串 (必填模式)', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('应该接受 undefined 值 (可选模式)', () => {
      expect(optionalPipe.transform(undefined as any)).toBeUndefined();
    });

    it('应该接受 null 值 (可选模式)', () => {
      expect(optionalPipe.transform(null as any)).toBeUndefined();
    });

    it('应该接受空字符串 (可选模式)', () => {
      expect(optionalPipe.transform('')).toBeUndefined();
    });

    it('应该接受有效值 (可选模式)', () => {
      expect(optionalPipe.transform('13800138000')).toBe('13800138000');
    });
  });

  describe('国际格式验证 (International Format)', () => {
    it('应该拒绝 +86 国际格式 (默认模式)', () => {
      expect(() => pipe.transform('+8613800138000')).toThrow(BadRequestException);
    });

    it('应该接受 +86 国际格式 (国际模式)', () => {
      expect(internationalPipe.transform('+8613800138000')).toBe('+8613800138000');
      expect(internationalPipe.transform('+8619812345678')).toBe('+8619812345678');
    });

    it('应该接受标准格式 (国际模式)', () => {
      expect(internationalPipe.transform('13800138000')).toBe('13800138000');
    });

    it('应该拒绝不带 + 号的 86 前缀', () => {
      expect(() => internationalPipe.transform('8613800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('8613800138000')).toThrow(BadRequestException);
    });

    it('应该自动去除国际格式中的空格', () => {
      expect(internationalPipe.transform('+86 138 0013 8000')).toBe('+8613800138000');
    });

    it('应该自动去除国际格式中的连字符', () => {
      expect(internationalPipe.transform('+86-138-0013-8000')).toBe('+8613800138000');
    });
  });

  describe('无效格式拒绝 (Invalid Format Rejection)', () => {
    it('应该拒绝第二位不是 3-9 的号码', () => {
      expect(() => pipe.transform('10800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('11800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('12800138000')).toThrow(BadRequestException);
    });

    it('应该拒绝不足 11 位的号码', () => {
      expect(() => pipe.transform('1380013800')).toThrow(BadRequestException); // 10 位
      expect(() => pipe.transform('138001380')).toThrow(BadRequestException); // 9 位
      expect(() => pipe.transform('13800138')).toThrow(BadRequestException); // 8 位
    });

    it('应该拒绝超过 11 位的号码', () => {
      expect(() => pipe.transform('138001380001')).toThrow(BadRequestException); // 12 位
      expect(() => pipe.transform('1380013800012')).toThrow(BadRequestException); // 13 位
    });

    it('应该拒绝以 0 开头的号码', () => {
      expect(() => pipe.transform('013800138000')).toThrow(BadRequestException);
    });

    it('应该拒绝以 2-9 开头的号码', () => {
      expect(() => pipe.transform('23800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('33800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('53800138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('83800138000')).toThrow(BadRequestException);
    });

    it('应该拒绝包含字母的号码', () => {
      expect(() => pipe.transform('1380013800a')).toThrow(BadRequestException);
      expect(() => pipe.transform('13800138a00')).toThrow(BadRequestException);
      expect(() => pipe.transform('a3800138000')).toThrow(BadRequestException);
    });

    it('应该拒绝包含特殊字符的号码', () => {
      expect(() => pipe.transform('1380013800@')).toThrow(BadRequestException);
      expect(() => pipe.transform('138@0138000')).toThrow(BadRequestException);
      expect(() => pipe.transform('138.0013.8000')).toThrow(BadRequestException);
    });

    it('应该拒绝其他国家的手机号格式', () => {
      expect(() => pipe.transform('+12025551234')).toThrow(BadRequestException); // 美国
      expect(() => pipe.transform('+81312345678')).toThrow(BadRequestException); // 日本
      expect(() => pipe.transform('+447911123456')).toThrow(BadRequestException); // 英国
    });
  });

  describe('错误消息验证 (Error Message Validation)', () => {
    it('应该返回必填错误消息', () => {
      try {
        pipe.transform(undefined as any);
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('手机号是必填项');
        expect(error.message).toContain('中国大陆手机号');
      }
    });

    it('应该返回格式错误消息 (标准模式)', () => {
      try {
        pipe.transform('12800138000');
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('12800138000');
        expect(error.message).toContain('11 位数字');
        expect(error.message).toContain('以 1 开头');
        expect(error.message).toContain('第二位为 3-9');
      }
    });

    it('应该返回格式错误消息 (国际模式)', () => {
      try {
        internationalPipe.transform('12800138000');
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('12800138000');
        expect(error.message).toContain('11 位数字或 +86 开头的国际格式');
      }
    });
  });

  describe('边界情况 (Edge Cases)', () => {
    it('应该处理只包含空格的输入', () => {
      expect(() => pipe.transform('   ')).toThrow(BadRequestException);
    });

    it('应该处理只包含连字符的输入', () => {
      expect(() => pipe.transform('---')).toThrow(BadRequestException);
    });

    it('应该处理数字字符串类型的输入', () => {
      expect(pipe.transform('13800138000')).toBe('13800138000');
    });

    it('应该保留返回值的字符串类型', () => {
      const result = pipe.transform('13800138000');
      expect(typeof result).toBe('string');
    });
  });

  describe('实际使用场景 (Real-world Scenarios)', () => {
    it('应该处理用户注册场景', () => {
      // 模拟用户注册时的手机号验证
      const registrationPhone = '13800138000';
      expect(pipe.transform(registrationPhone)).toBe('13800138000');
    });

    it('应该处理备用手机号场景', () => {
      // 模拟可选的备用手机号
      const backupPhone = '13900139000';
      expect(optionalPipe.transform(backupPhone)).toBe('13900139000');
      expect(optionalPipe.transform(undefined as any)).toBeUndefined();
    });

    it('应该处理带格式化的用户输入', () => {
      // 用户可能输入带空格或连字符的号码
      const formattedInputs = [
        '138 0013 8000',
        '138-0013-8000',
        '138 0013-8000',
        '138-0013 8000',
      ];
      
      formattedInputs.forEach(input => {
        expect(pipe.transform(input)).toBe('13800138000');
      });
    });

    it('应该处理国际用户场景', () => {
      // 国际用户可能输入 +86 格式
      const intlPhone = '+8613800138000';
      expect(internationalPipe.transform(intlPhone)).toBe('+8613800138000');
    });
  });

  describe('性能测试 (Performance)', () => {
    it('应该快速处理大量验证请求', () => {
      const phoneNumbers = Array(1000).fill('13800138000');
      const startTime = Date.now();
      
      phoneNumbers.forEach(phone => {
        pipe.transform(phone);
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 1000 次验证应该在 100ms 内完成
      expect(duration).toBeLessThan(100);
    });
  });
});
