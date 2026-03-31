/**
 * ParseJSONPipe 单元测试
 * 
 * 测试 JSON 字符串解析管道的验证逻辑
 */

import { BadRequestException } from '@nestjs/common';
import { ParseJSONPipe } from './parse-json.pipe';

describe('ParseJSONPipe', () => {
  let pipe: ParseJSONPipe;
  let optionalPipe: ParseJSONPipe;
  let pipeWithValidation: ParseJSONPipe;

  beforeEach(() => {
    pipe = new ParseJSONPipe();
    optionalPipe = new ParseJSONPipe({ optional: true });
    pipeWithValidation = new ParseJSONPipe({
      validate: (value: any) => {
        if (typeof value !== 'object' || value === null) {
          return '验证失败：必须是对象类型';
        }
        return true;
      }
    });
  });

  describe('基本 JSON 解析', () => {
    it('应该解析有效的 JSON 对象字符串', () => {
      const jsonStr = '{"name": "test", "value": 123}';
      const result = pipe.transform(jsonStr, { type: 'query' });
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('应该解析有效的 JSON 数组字符串', () => {
      const jsonStr = '[1, 2, 3, 4, 5]';
      const result = pipe.transform(jsonStr, { type: 'query' });
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('应该解析简单的 JSON 值', () => {
      expect(pipe.transform('"hello"', { type: 'query' })).toBe('hello');
      expect(pipe.transform('123', { type: 'query' })).toBe(123);
      expect(pipe.transform('true', { type: 'query' })).toBe(true);
      expect(pipe.transform('false', { type: 'query' })).toBe(false);
      expect(pipe.transform('null', { type: 'query' })).toBe(null);
    });

    it('应该解析嵌套的 JSON 结构', () => {
      const jsonStr = '{"user": {"name": "Alice", "age": 30}, "tags": ["admin", "user"]}';
      const result = pipe.transform(jsonStr, { type: 'query' });
      expect(result).toEqual({
        user: { name: 'Alice', age: 30 },
        tags: ['admin', 'user']
      });
    });

    it('应该解析包含特殊字符的 JSON', () => {
      const jsonStr = '{"message": "Hello\\nWorld", "path": "C:\\\\Users\\\\test"}';
      const result = pipe.transform(jsonStr, { type: 'query' });
      expect(result.message).toBe('Hello\nWorld');
      expect(result.path).toBe('C:\\Users\\test');
    });

    it('应该解析 Unicode 字符', () => {
      const jsonStr = '{"chinese": "鲸鱼", "emoji": "🐋", "japanese": "クジラ"}';
      const result = pipe.transform(jsonStr, { type: 'query' });
      expect(result.chinese).toBe('鲸鱼');
      expect(result.emoji).toBe('🐋');
      expect(result.japanese).toBe('クジラ');
    });
  });

  describe('已经解析的对象处理', () => {
    it('如果输入已经是对象，应该直接返回', () => {
      const obj = { name: 'test', value: 123 };
      const result = pipe.transform(obj, { type: 'body' });
      expect(result).toBe(obj); // 同一个引用
    });

    it('如果输入已经是数组，应该直接返回', () => {
      const arr = [1, 2, 3];
      const result = pipe.transform(arr, { type: 'body' });
      expect(result).toBe(arr); // 同一个引用
    });
  });

  describe('空值处理', () => {
    it('应该拒绝空字符串 (非可选模式)', () => {
      expect(() => pipe.transform('', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝 null (非可选模式)', () => {
      expect(() => pipe.transform(null as any, { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝 undefined (非可选模式)', () => {
      expect(() => pipe.transform(undefined as any, { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该接受空字符串 (可选模式)', () => {
      expect(optionalPipe.transform('', { type: 'query' })).toBe(null);
    });

    it('应该接受 null (可选模式)', () => {
      expect(optionalPipe.transform(null as any, { type: 'query' })).toBe(null);
    });

    it('应该接受 undefined (可选模式)', () => {
      expect(optionalPipe.transform(undefined as any, { type: 'query' })).toBe(null);
    });
  });

  describe('无效 JSON 处理', () => {
    it('应该拒绝无效的 JSON 格式', () => {
      expect(() => pipe.transform('{name: "test"}', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝单引号的 JSON', () => {
      expect(() => pipe.transform("{'name': 'test'}", { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝未加引号的键', () => {
      expect(() => pipe.transform('{name: "test"}', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝 trailing comma', () => {
      expect(() => pipe.transform('{"name": "test",}', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝不匹配的括号', () => {
      expect(() => pipe.transform('{"name": "test"', { type: 'query' })).toThrow(BadRequestException);
      expect(() => pipe.transform('{"name": "test"]', { type: 'query' })).toThrow(BadRequestException);
    });

    it('应该拒绝无效的 JSON 值', () => {
      expect(() => pipe.transform('undefined', { type: 'query' })).toThrow(BadRequestException);
      expect(() => pipe.transform('NaN', { type: 'query' })).toThrow(BadRequestException);
      expect(() => pipe.transform('Infinity', { type: 'query' })).toThrow(BadRequestException);
    });
  });

  describe('自定义错误消息', () => {
    it('应该使用默认错误消息', () => {
      try {
        pipe.transform('invalid json', { type: 'query' });
        fail('应该抛出异常');
      } catch (error) {
        expect(error.message).toBe('验证失败：无效的 JSON 格式');
      }
    });

    it('应该使用自定义错误消息', () => {
      const customPipe = new ParseJSONPipe({
        errorMessage: '自定义错误：请输入有效的 JSON 格式'
      });
      try {
        customPipe.transform('invalid', { type: 'query' });
        fail('应该抛出异常');
      } catch (error) {
        expect(error.message).toBe('自定义错误：请输入有效的 JSON 格式');
      }
    });
  });

  describe('自定义验证函数', () => {
    it('应该在验证通过时返回值', () => {
      const result = pipeWithValidation.transform('{"name": "test"}', { type: 'query' });
      expect(result).toEqual({ name: 'test' });
    });

    it('应该在验证失败时抛出异常', () => {
      // 当 validate 函数返回 false 时，抛出 errorMessage
      // 当 validate 函数返回字符串时，抛出该字符串
      try {
        pipeWithValidation.transform('123', { type: 'query' }); // 数字不是对象
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('应该在验证失败时抛出异常', () => {
      const pipeWithStringError = new ParseJSONPipe({
        validate: (value: any) => {
          if (!value || typeof value !== 'object' || !value.id) {
            return '验证失败：缺少 id 字段';
          }
          return true;
        }
      });
      try {
        // 传入有效 JSON 但缺少 id 字段
        pipeWithStringError.transform('{"name": "test"}', { type: 'query' });
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('应该在验证通过时返回复杂对象', () => {
      const result = pipeWithValidation.transform(
        '{"user": {"id": 1, "name": "Alice"}}',
        { type: 'query' }
      );
      expect(result).toEqual({ user: { id: 1, name: 'Alice' } });
    });

    it('应该支持返回 boolean false 的验证函数', () => {
      const pipeWithBoolValidation = new ParseJSONPipe({
        validate: (value: any) => {
          return typeof value === 'object' && value !== null;
        }
      });
      // 有效对象应该通过
      expect(pipeWithBoolValidation.transform('{"test": 1}', { type: 'query' })).toEqual({ test: 1 });
      // 非对象应该失败
      expect(() => pipeWithBoolValidation.transform('123', { type: 'query' })).toThrow(BadRequestException);
    });
  });

  describe('实际场景测试', () => {
    it('应该处理查询参数中的 JSON 过滤器', () => {
      const filterJson = '{"status": "active", "role": "admin", "age": {"gte": 18}}';
      const result = pipe.transform(filterJson, { type: 'query' });
      expect(result).toEqual({
        status: 'active',
        role: 'admin',
        age: { gte: 18 }
      });
    });

    it('应该处理排序参数的 JSON', () => {
      const sortJson = '[{"field": "createdAt", "order": "DESC"}, {"field": "name", "order": "ASC"}]';
      const result = pipe.transform(sortJson, { type: 'query' });
      expect(result).toEqual([
        { field: 'createdAt', order: 'DESC' },
        { field: 'name', order: 'ASC' }
      ]);
    });

    it('应该处理鲸鱼观测数据的 JSON', () => {
      const sightingJson = `{
        "species": "蓝鲸",
        "location": { "lat": 31.2304, "lng": 121.4737 },
        "count": 3,
        "behavior": ["feeding", "breaching"],
        "weather": {"condition": "sunny", "temperature": 22.5}
      }`;
      const result = pipe.transform(sightingJson, { type: 'body' });
      expect(result.species).toBe('蓝鲸');
      expect(result.location).toEqual({ lat: 31.2304, lng: 121.4737 });
      expect(result.count).toBe(3);
      expect(result.behavior).toEqual(['feeding', 'breaching']);
      expect(result.weather).toEqual({ condition: 'sunny', temperature: 22.5 });
    });

    it('应该处理批量操作的 JSON', () => {
      const batchJson = '{"action": "update", "ids": [1, 2, 3], "data": {"status": "verified"}}';
      const result = pipe.transform(batchJson, { type: 'body' });
      expect(result.action).toBe('update');
      expect(result.ids).toEqual([1, 2, 3]);
      expect(result.data).toEqual({ status: 'verified' });
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空对象', () => {
      const result = pipe.transform('{}', { type: 'query' });
      expect(result).toEqual({});
    });

    it('应该处理空数组', () => {
      const result = pipe.transform('[]', { type: 'query' });
      expect(result).toEqual([]);
    });

    it('应该处理包含 null 值的对象', () => {
      const result = pipe.transform('{"name": null, "value": "test"}', { type: 'query' });
      expect(result).toEqual({ name: null, value: 'test' });
    });

    it('应该处理包含空字符串的对象', () => {
      const result = pipe.transform('{"name": "", "value": "test"}', { type: 'query' });
      expect(result).toEqual({ name: '', value: 'test' });
    });

    it('应该处理大数字', () => {
      const result = pipe.transform('{"bigNumber": 123456789012345}', { type: 'query' });
      expect(result.bigNumber).toBe(123456789012345);
    });

    it('应该处理科学计数法', () => {
      const result = pipe.transform('{"value": 1.23e10}', { type: 'query' });
      expect(result.value).toBe(1.23e10);
    });

    it('应该处理转义字符', () => {
      const result = pipe.transform('{"quote": "He said \\"Hello\\""}', { type: 'query' });
      expect(result.quote).toBe('He said "Hello"');
    });
  });

  describe('性能测试 (基本)', () => {
    it('应该快速解析小型 JSON', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        pipe.transform('{"test": "value"}', { type: 'query' });
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // 1000 次解析应该在 1 秒内完成
    });

    it('应该快速解析大型 JSON', () => {
      const largeJson = JSON.stringify({
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))
      });
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        pipe.transform(largeJson, { type: 'query' });
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
