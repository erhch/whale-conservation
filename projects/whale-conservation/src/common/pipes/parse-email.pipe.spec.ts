/**
 * ParseEmailPipe 单元测试
 * 
 * 测试邮箱格式验证管道的验证逻辑
 * 覆盖场景：标准格式、特殊字符、必填/可选、边界情况、错误处理
 */

import { BadRequestException } from '@nestjs/common';
import { ParseEmailPipe } from './parse-email.pipe';

describe('ParseEmailPipe', () => {
  let pipe: ParseEmailPipe;
  let optionalPipe: ParseEmailPipe;

  beforeEach(() => {
    pipe = new ParseEmailPipe(); // 默认：必填
    optionalPipe = new ParseEmailPipe({ required: false });
  });

  describe('标准邮箱格式验证 (Standard Format)', () => {
    it('应该接受常见邮箱格式', () => {
      expect(pipe.transform('user@example.com')).toBe('user@example.com');
      expect(pipe.transform('test@gmail.com')).toBe('test@gmail.com');
      expect(pipe.transform('admin@company.cn')).toBe('admin@company.cn');
    });

    it('应该接受带有点号的邮箱地址', () => {
      expect(pipe.transform('john.doe@example.com')).toBe('john.doe@example.com');
      expect(pipe.transform('first.last@company.org')).toBe('first.last@company.org');
      expect(pipe.transform('a.b.c@test.com')).toBe('a.b.c@test.com');
    });

    it('应该接受带加号标签的邮箱地址', () => {
      expect(pipe.transform('user+newsletter@gmail.com')).toBe('user+newsletter@gmail.com');
      expect(pipe.transform('test+tag@example.com')).toBe('test+tag@example.com');
    });

    it('应该接受带下划线的邮箱地址', () => {
      expect(pipe.transform('user_name@example.com')).toBe('user_name@example.com');
      expect(pipe.transform('first_last@company.com')).toBe('first_last@company.com');
    });

    it('应该接受带连字符的邮箱地址', () => {
      expect(pipe.transform('user-name@example.com')).toBe('user-name@example.com');
      expect(pipe.transform('first-last@company.com')).toBe('first-last@company.com');
    });

    it('应该接受数字开头的邮箱地址', () => {
      expect(pipe.transform('123@example.com')).toBe('123@example.com');
      expect(pipe.transform('007@agent.com')).toBe('007@agent.com');
    });

    it('应该接受带数字的域名', () => {
      expect(pipe.transform('user@mail123.com')).toBe('user@mail123.com');
      expect(pipe.transform('test@server456.org')).toBe('test@server456.org');
    });
  });

  describe('大小写处理 (Case Handling)', () => {
    it('应该将大写字母转换为小写', () => {
      expect(pipe.transform('USER@EXAMPLE.COM')).toBe('user@example.com');
      expect(pipe.transform('Test@Gmail.Com')).toBe('test@gmail.com');
      expect(pipe.transform('ADMIN@COMPANY.CN')).toBe('admin@company.cn');
    });

    it('应该保留域名的大小写结构但转换为小写', () => {
      expect(pipe.transform('User@Example.COM')).toBe('user@example.com');
      expect(pipe.transform('TEST@Gmail.com')).toBe('test@gmail.com');
    });
  });

  describe('空格处理 (Whitespace Handling)', () => {
    it('应该去除首尾空格', () => {
      expect(pipe.transform('  user@example.com  ')).toBe('user@example.com');
      expect(pipe.transform('\ttest@gmail.com\n')).toBe('test@gmail.com');
    });

    it('应该去除空格后验证', () => {
      expect(pipe.transform('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });
  });

  describe('必填模式 (Required Mode)', () => {
    it('应该拒绝 undefined 值', () => {
      expect(() => pipe.transform(undefined as unknown as string))
        .toThrow(new BadRequestException('邮箱地址是必填项，请提供有效的邮箱地址'));
    });

    it('应该拒绝 null 值', () => {
      expect(() => pipe.transform(null as unknown as string))
        .toThrow(new BadRequestException('邮箱地址是必填项，请提供有效的邮箱地址'));
    });

    it('应该拒绝空字符串', () => {
      expect(() => pipe.transform(''))
        .toThrow(new BadRequestException('邮箱地址是必填项，请提供有效的邮箱地址'));
    });
  });

  describe('可选模式 (Optional Mode)', () => {
    it('应该接受 undefined 值', () => {
      expect(optionalPipe.transform(undefined as unknown as string)).toBeUndefined();
    });

    it('应该接受 null 值', () => {
      expect(optionalPipe.transform(null as unknown as string)).toBeUndefined();
    });

    it('应该接受空字符串', () => {
      expect(optionalPipe.transform('')).toBeUndefined();
    });

    it('应该验证非空值', () => {
      expect(optionalPipe.transform('valid@example.com')).toBe('valid@example.com');
    });

    it('应该拒绝无效的可选值', () => {
      expect(() => optionalPipe.transform('invalid-email'))
        .toThrow(new BadRequestException('invalid-email 不是有效的邮箱地址格式'));
    });
  });

  describe('无效邮箱格式 (Invalid Format)', () => {
    it('应该拒绝没有@符号的地址', () => {
      expect(() => pipe.transform('userexample.com'))
        .toThrow(new BadRequestException('userexample.com 不是有效的邮箱地址格式'));
    });

    it('应该拒绝没有用户名的地址', () => {
      expect(() => pipe.transform('@example.com'))
        .toThrow(new BadRequestException('@example.com 不是有效的邮箱地址格式'));
    });

    it('应该拒绝没有域名的地址', () => {
      expect(() => pipe.transform('user@'))
        .toThrow(new BadRequestException('user@ 不是有效的邮箱地址格式'));
    });

    it('应该接受没有顶级域名的地址 (单段域名)', () => {
      // 注意：RFC 允许单段域名，如 user@localhost
      expect(pipe.transform('user@example')).toBe('user@example');
      expect(pipe.transform('admin@localhost')).toBe('admin@localhost');
    });

    it('应该拒绝多个@符号', () => {
      expect(() => pipe.transform('user@@example.com'))
        .toThrow(new BadRequestException('user@@example.com 不是有效的邮箱地址格式'));
      expect(() => pipe.transform('user@name@example.com'))
        .toThrow(new BadRequestException('user@name@example.com 不是有效的邮箱地址格式'));
    });

    it('应该拒绝空格在中间的地址', () => {
      expect(() => pipe.transform('user name@example.com'))
        .toThrow(new BadRequestException('user name@example.com 不是有效的邮箱地址格式'));
    });

    it('应该拒绝某些特殊字符 (空格和括号)', () => {
      // 空格不允许
      expect(() => pipe.transform('user name@example.com'))
        .toThrow();
      // 圆括号不允许
      expect(() => pipe.transform('user(name@example.com'))
        .toThrow();
      expect(() => pipe.transform('user)name@example.com'))
        .toThrow();
    });

    it('应该拒绝中文域名（当前不支持）', () => {
      expect(() => pipe.transform('用户@例子。中国'))
        .toThrow();
    });
  });

  describe('边界情况 (Edge Cases)', () => {
    it('应该接受单字符用户名', () => {
      expect(pipe.transform('a@example.com')).toBe('a@example.com');
    });

    it('应该接受单字符域名', () => {
      expect(pipe.transform('user@x.com')).toBe('user@x.com');
    });

    it('应该接受长用户名', () => {
      const longUsername = 'a'.repeat(64) + '@example.com';
      expect(pipe.transform(longUsername)).toBe(longUsername);
    });

    it('应该接受多级子域名', () => {
      expect(pipe.transform('user@mail.server.example.com')).toBe('user@mail.server.example.com');
      expect(pipe.transform('admin@dept.company.org.cn')).toBe('admin@dept.company.org.cn');
    });

    it('应该接受带连字符的域名', () => {
      expect(pipe.transform('user@my-company.com')).toBe('user@my-company.com');
      expect(pipe.transform('test@mail-server.example.com')).toBe('test@mail-server.example.com');
    });
  });

  describe('特殊字符支持 (Special Characters)', () => {
    it('应该接受点号在用户名中', () => {
      expect(pipe.transform('u.s.e.r@example.com')).toBe('u.s.e.r@example.com');
    });

    it('应该接受百分号', () => {
      expect(pipe.transform('user%name@example.com')).toBe('user%name@example.com');
    });

    it('应该接受星号', () => {
      expect(pipe.transform('user*name@example.com')).toBe('user*name@example.com');
    });

    it('应该接受问号', () => {
      expect(pipe.transform('user?name@example.com')).toBe('user?name@example.com');
    });

    it('应该接受脱字符', () => {
      expect(pipe.transform('user^name@example.com')).toBe('user^name@example.com');
    });

    it('应该接受波浪号', () => {
      expect(pipe.transform('user~name@example.com')).toBe('user~name@example.com');
    });

    it('应该接受竖线', () => {
      expect(pipe.transform('user|name@example.com')).toBe('user|name@example.com');
    });

    it('应该接受花括号', () => {
      expect(pipe.transform('user{name@example.com')).toBe('user{name@example.com');
      expect(pipe.transform('user}name@example.com')).toBe('user}name@example.com');
    });

    it('应该拒绝方括号', () => {
      expect(() => pipe.transform('user[name@example.com'))
        .toThrow();
      expect(() => pipe.transform('user]name@example.com'))
        .toThrow();
    });

    it('应该接受单引号', () => {
      expect(pipe.transform("user'name@example.com")).toBe("user'name@example.com");
    });

    it('应该接受反引号', () => {
      expect(pipe.transform('user`name@example.com')).toBe('user`name@example.com');
    });

    it('应该接受等号', () => {
      expect(pipe.transform('user=name@example.com')).toBe('user=name@example.com');
    });
  });

  describe('实际使用场景 (Real-world Scenarios)', () => {
    it('应该接受常见邮箱服务商', () => {
      expect(pipe.transform('user@gmail.com')).toBe('user@gmail.com');
      expect(pipe.transform('user@yahoo.com')).toBe('user@yahoo.com');
      expect(pipe.transform('user@hotmail.com')).toBe('user@hotmail.com');
      expect(pipe.transform('user@outlook.com')).toBe('user@outlook.com');
      expect(pipe.transform('user@icloud.com')).toBe('user@icloud.com');
      expect(pipe.transform('user@163.com')).toBe('user@163.com');
      expect(pipe.transform('user@qq.com')).toBe('user@qq.com');
      expect(pipe.transform('user@sina.com')).toBe('user@sina.com');
    });

    it('应该接受企业邮箱格式', () => {
      expect(pipe.transform('john.doe@company.com')).toBe('john.doe@company.com');
      expect(pipe.transform('j.smith@corporation.org')).toBe('j.smith@corporation.org');
      expect(pipe.transform('support@customer-service.net')).toBe('support@customer-service.net');
    });

    it('应该接受教育机构邮箱', () => {
      expect(pipe.transform('student@university.edu')).toBe('student@university.edu');
      expect(pipe.transform('professor@college.edu.cn')).toBe('professor@college.edu.cn');
      expect(pipe.transform('research@lab.ac.uk')).toBe('research@lab.ac.uk');
    });

    it('应该接受政府机构邮箱', () => {
      expect(pipe.transform('contact@government.gov')).toBe('contact@government.gov');
      expect(pipe.transform('info@agency.gov.cn')).toBe('info@agency.gov.cn');
    });
  });

  describe('性能测试 (Performance)', () => {
    it('应该快速处理大量验证', () => {
      const emails = Array.from({ length: 100 }, (_, i) => `user${i}@example.com`);
      const start = Date.now();
      
      emails.forEach(email => {
        expect(pipe.transform(email)).toBe(email.toLowerCase());
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100 个验证应该在 100ms 内完成
    });
  });

  describe('返回值验证 (Return Value)', () => {
    it('应该返回修剪并小写化的邮箱地址', () => {
      expect(pipe.transform('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('应该保持有效邮箱的完整性', () => {
      const email = 'test.user+tag@sub.domain.example.com';
      expect(pipe.transform(email)).toBe(email.toLowerCase());
    });
  });
});
