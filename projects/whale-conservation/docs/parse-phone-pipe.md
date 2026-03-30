# ParsePhonePipe - 手机号格式验证管道

## 概述

`ParsePhonePipe` 是一个用于验证中国大陆手机号格式的管道，支持必填/可选配置和国际格式选项。

## 核心功能

- ✅ **标准格式验证**：11 位数字，以 1 开头，第二位为 3-9
- ✅ **自动格式化**：去除空格和连字符
- ✅ **必填/可选配置**：支持 `required` 选项
- ✅ **国际格式支持**：可选支持 +86 前缀的国际格式
- ✅ **中文错误提示**：清晰的验证失败消息

## 快速开始

### 必填手机号

```typescript
@Body('phone', new ParsePhonePipe())
phone: string;
```

### 可选手机号

```typescript
@Body('backupPhone', new ParsePhonePipe({ required: false }))
backupPhone?: string;
```

### 允许国际格式

```typescript
@Body('phone', new ParsePhonePipe({ allowInternational: true }))
phone: string;
```

## 使用场景

### 场景 1：用户注册 - 必填手机号

```typescript
@Post('register')
async register(
  @Body('username', new ParseStringPipe({ minLength: 3, maxLength: 20 })) username: string,
  @Body('phone', new ParsePhonePipe()) phone: string,
  @Body('password', new ParseStringPipe({ minLength: 8 })) password: string,
) {
  return this.authService.register({ username, phone, password });
}
```

**说明**：注册时手机号为必填，使用默认配置验证标准 11 位格式。

### 场景 2：用户资料更新 - 可选备用手机

```typescript
@Patch('profile')
@UseGuards(JwtAuthGuard)
async updateProfile(
  @User() user: UserEntity,
  @Body('nickname', new ParseOptionalStringPipe()) nickname?: string,
  @Body('backupPhone', new ParsePhonePipe({ required: false })) backupPhone?: string,
) {
  return this.userService.updateProfile(user.id, { nickname, backupPhone });
}
```

**说明**：备用手机号为可选字段，用户可以选择性提供。

### 场景 3：国际用户 - 支持 +86 格式

```typescript
@Post('contact')
async addContact(
  @Body('name', new ParseStringPipe()) name: string,
  @Body('phone', new ParsePhonePipe({ allowInternational: true })) phone: string,
) {
  return this.contactService.add({ name, phone });
}
```

**说明**：允许用户输入 +8613800138000 或 13800138000 两种格式。

### 场景 4：批量导入研究人员 - 数组验证

```typescript
@Post('researchers/import')
async importResearchers(
  @Body('data', new ParseArrayPipe({ items: Object })) data: any[],
) {
  // 在 service 层对每个对象的 phone 字段使用 ParsePhonePipe 验证
  for (const item of data) {
    const phone = await new ParsePhonePipe().transform(item.phone);
    item.phone = phone;
  }
  return this.researcherService.bulkCreate(data);
}
```

**说明**：批量导入时对每个手机号进行验证。

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `required` | `boolean` | `true` | 是否必填 |
| `allowInternational` | `boolean` | `false` | 是否允许 +86 国际格式 |

## 支持的格式

### ✅ 有效格式

| 输入 | 说明 |
|------|------|
| `13800138000` | 标准 11 位格式 |
| `19812345678` | 198 号段 |
| `138 0013 8000` | 带空格（自动去除） |
| `138-0013-8000` | 带连字符（自动去除） |
| `+8613800138000` | 国际格式（需 `allowInternational: true`） |

### ❌ 无效格式

| 输入 | 原因 |
|------|------|
| `12800138000` | 第二位必须是 3-9 |
| `1380013800` | 只有 10 位，不足 11 位 |
| `138001380001` | 12 位，超出 11 位 |
| `213800138000` | 不能以 2 开头 |
| `013800138000` | 不能以 0 开头 |
| `8613800138000` | 国际格式必须带 + 号 |

## 错误处理

### 常见错误响应

#### 必填字段为空

```json
{
  "statusCode": 400,
  "message": "手机号是必填项，请提供有效的中国大陆手机号",
  "error": "Bad Request"
}
```

#### 格式无效（标准模式）

```json
{
  "statusCode": 400,
  "message": "12800138000 不是有效的中国大陆手机号格式 (11 位数字，以 1 开头，第二位为 3-9)",
  "error": "Bad Request"
}
```

#### 格式无效（国际模式）

```json
{
  "statusCode": 400,
  "message": "12800138000 不是有效的手机号格式 (支持 11 位数字或 +86 开头的国际格式)",
  "error": "Bad Request"
}
```

## 最佳实践

### 1. 前端配合验证

在前端表单中也进行手机号格式验证，提供即时反馈：

```typescript
// 前端验证正则
const phoneRegex = /^1[3-9]\d{9}$/;

if (!phoneRegex.test(phone)) {
  showError('请输入有效的手机号');
}
```

### 2. 统一格式化

后端会自动去除空格和连字符，但建议前端也进行预处理：

```typescript
// 前端预处理
const cleanedPhone = phone.replace(/[\s-]/g, '');
```

### 3. DTO 中标注清晰

```typescript
class CreateResearcherDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  phone: string;
  
  @ApiProperty({ description: '备用手机号', required: false, example: '13900139000' })
  @IsOptional()
  @IsString()
  backupPhone?: string;
}
```

### 4. 错误提示友好

在控制器层捕获并转换错误消息，使其更友好：

```typescript
@Catch(BadRequestException)
export class PhoneValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const message = exception.message;
    // 将技术错误消息转换为用户友好的提示
    const friendlyMessage = message.includes('手机号') 
      ? '请填写正确的 11 位手机号码' 
      : message;
  }
}
```

### 5. 测试覆盖

编写单元测试覆盖各种场景：

```typescript
describe('ParsePhonePipe', () => {
  it('should accept valid phone number', () => {
    const pipe = new ParsePhonePipe();
    expect(pipe.transform('13800138000')).toBe('13800138000');
  });

  it('should reject invalid phone number', () => {
    const pipe = new ParsePhonePipe();
    expect(() => pipe.transform('12800138000')).toThrow(BadRequestException);
  });

  it('should accept optional phone when not provided', () => {
    const pipe = new ParsePhonePipe({ required: false });
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('should accept international format when enabled', () => {
    const pipe = new ParsePhonePipe({ allowInternational: true });
    expect(pipe.transform('+8613800138000')).toBe('+8613800138000');
  });
});
```

### 6. 与其他管道配合

```typescript
@Post('contact')
async addContact(
  @Body('phone', new ParsePhonePipe()) 
  @IsString()
  phone: string,
  
  @Body('email', new ParseEmailPipe({ required: false })) 
  @IsOptional()
  @IsEmail()
  email?: string,
) {
  // 至少提供一种联系方式
  if (!phone && !email) {
    throw new BadRequestException('请至少提供手机号或邮箱');
  }
  return this.contactService.add({ phone, email });
}
```

## 完整示例

### 研究人员联系信息 DTO

```typescript
// dto/create-researcher.dto.ts
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResearcherDto {
  @ApiProperty({ description: '姓名', example: '张三' })
  @IsString()
  name: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  phone: string;

  @ApiProperty({ description: '邮箱', required: false, example: 'zhangsan@shu.edu.cn' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '备用手机', required: false, example: '13900139000' })
  @IsOptional()
  @IsString()
  backupPhone?: string;
}

// researchers.controller.ts
@Post()
async create(
  @Body('name', new ParseStringPipe()) name: string,
  @Body('phone', new ParsePhonePipe()) phone: string,
  @Body('email', new ParseEmailPipe({ required: false })) email?: string,
  @Body('backupPhone', new ParsePhonePipe({ required: false })) backupPhone?: string,
) {
  return this.researchersService.create({ name, phone, email, backupPhone });
}
```

## 相关管道

| 管道 | 用途 |
|------|------|
| `ParseEmailPipe` | 邮箱格式验证 |
| `ParseStringPipe` | 字符串基础验证 |
| `ParseOptionalStringPipe` | 可选字符串验证 |
| `ParseCoordinatePipe` | 地理坐标验证 |

## 更新日志

- **2026-03-30**: 初始文档创建，包含完整使用示例和最佳实践
