# ParseUrlPipe 使用指南

> URL 地址验证管道 - 用于网站链接、API 端点、资源地址等场景

版本：v0.1.0  
最后更新：2026-03-31

---

## 📌 概述

`ParseUrlPipe` 是用于验证 URL 地址格式的管道，适用于网站链接、API 端点配置、资源地址、社交媒体链接等需要 URL 验证的场景。

### 核心功能

- ✅ 标准 URL 格式验证（支持协议、域名、端口、路径）
- ✅ 协议白名单验证（默认仅允许 http/https）
- ✅ 可选 IP 地址支持（默认仅允许域名）
- ✅ 支持必填/可选配置
- ✅ 友好的中文错误提示
- ✅ 自动去除首尾空格

---

## 🚀 快速开始

### 基础用法 - 必填 URL

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ParseUrlPipe } from '@/common/pipes';

@Controller('organizations')
export class OrganizationsController {
  @Post()
  create(
    @Body('website', new ParseUrlPipe()) website: string
  ) {
    // website 已验证为有效 URL 格式
    return this.organizationsService.create({ website });
  }
}
```

### 可选 URL 参数

```typescript
@Post('profile')
updateProfile(
  @Body('socialMediaUrl', new ParseUrlPipe({ required: false })) socialMediaUrl?: string
) {
  // 如果未提供，socialMediaUrl 为 undefined
  return this.organizationsService.updateProfile({ socialMediaUrl });
}
```

### 自定义协议支持

```typescript
// 允许 FTP 协议
@Body('ftpUrl', new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] })) ftpUrl: string

// 允许 WebSocket
@Body('wsEndpoint', new ParseUrlPipe({ protocols: ['ws', 'wss'] })) wsEndpoint: string
```

### 允许 IP 地址

```typescript
// 允许 IP 地址作为主机（用于内部 API 端点配置）
@Body('apiEndpoint', new ParseUrlPipe({ allowIp: true })) apiEndpoint: string
```

---

## 📋 实际应用场景

### 场景 1: 合作组织网站登记

```typescript
import { ParseStringPipe, ParseUrlPipe } from '@/common/pipes';

@Controller('partners')
export class PartnersController {
  @Post()
  registerPartner(
    @Body('name', new ParseStringPipe({ min: 2, max: 100 })) name: string,
    @Body('website', new ParseUrlPipe()) website: string,
    @Body('contactEmail', new ParseEmailPipe()) contactEmail: string,
    @Body('description', new ParseStringPipe({ max: 500, required: false })) description?: string
  ) {
    return this.partnersService.register({ name, website, contactEmail, description });
  }
}
```

**请求示例:**
```json
POST /partners
{
  "name": "海洋保护联盟",
  "website": "https://ocean-conservation.org",
  "contactEmail": "contact@ocean-conservation.org",
  "description": "致力于海洋生态保护的公益组织"
}
```

**有效响应:**
```json
{
  "data": {
    "id": "partner-001",
    "name": "海洋保护联盟",
    "website": "https://ocean-conservation.org",
    "contactEmail": "contact@ocean-conservation.org"
  },
  "message": "合作伙伴注册成功"
}
```

**错误响应 (无效 URL):**
```json
{
  "statusCode": 400,
  "message": "not-a-valid-url 不是有效的 URL 地址格式",
  "error": "Bad Request"
}
```

---

### 场景 2: 研究数据源配置

```typescript
@Post('data-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
addDataSource(
  @Body('name', new ParseStringPipe({ min: 2, max: 50 })) name: string,
  @Body('url', new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] })) url: string,
  @Body('apiEndpoint', new ParseUrlPipe({ required: false, allowIp: true })) apiEndpoint?: string,
  @Body('updateInterval', new ParseIntPipe({ min: 60, max: 86400 })) updateInterval: number
) {
  return this.dataSourcesService.add({ name, url, apiEndpoint, updateInterval });
}
```

**请求示例:**
```json
POST /data-sources
{
  "name": "国家海洋数据中心",
  "url": "https://data.ocean.gov.cn",
  "apiEndpoint": "http://192.168.1.100:8080/api",
  "updateInterval": 3600
}
```

---

### 场景 3: 社交媒体链接管理

```typescript
@Patch('social-links')
@UseGuards(JwtAuthGuard)
updateSocialLinks(
  @CurrentUser() user: User,
  @Body('weibo', new ParseUrlPipe({ required: false })) weibo?: string,
  @Body('wechat', new ParseUrlPipe({ required: false })) wechat?: string,
  @Body('twitter', new ParseUrlPipe({ required: false })) twitter?: string,
  @Body('youtube', new ParseUrlPipe({ required: false })) youtube?: string
) {
  return this.usersService.updateSocialLinks(user.id, { weibo, wechat, twitter, youtube });
}
```

**请求示例:**
```json
PATCH /users/social-links
{
  "weibo": "https://weibo.com/whaleconservation",
  "youtube": "https://youtube.com/@whale-conservation"
}
```

---

### 场景 4: API 网关配置

```typescript
@Post('gateway/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
configureGateway(
  @Body('baseUrl', new ParseUrlPipe({ protocols: ['http', 'https'] })) baseUrl: string,
  @Body('wsUrl', new ParseUrlPipe({ protocols: ['ws', 'wss'] })) wsUrl: string,
  @Body('cdnUrl', new ParseUrlPipe({ required: false })) cdnUrl?: string,
  @Body('timeout', new ParseIntPipe({ min: 1000, max: 30000 })) timeout: number
) {
  return this.gatewayService.configure({ baseUrl, wsUrl, cdnUrl, timeout });
}
```

**请求示例:**
```json
POST /gateway/config
{
  "baseUrl": "https://api.whale-conservation.org",
  "wsUrl": "wss://ws.whale-conservation.org",
  "cdnUrl": "https://cdn.whale-conservation.org",
  "timeout": 10000
}
```

---

### 场景 5: 鲸鱼观测站点配置

```typescript
@Post('stations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESEARCHER, UserRole.ADMIN)
createStation(
  @Body('name', new ParseStringPipe({ min: 2, max: 100 })) name: string,
  @Body('latitude', new ParseFloatPipe({ min: -90, max: 90 })) latitude: number,
  @Body('longitude', new ParseFloatPipe({ min: -180, max: 180 })) longitude: number,
  @Body('liveStreamUrl', new ParseUrlPipe({ required: false })) liveStreamUrl?: string,
  @Body('dataFeedUrl', new ParseUrlPipe({ required: false, allowIp: true })) dataFeedUrl?: string
) {
  return this.stationsService.create({ name, latitude, longitude, liveStreamUrl, dataFeedUrl });
}
```

**请求示例:**
```json
POST /stations
{
  "name": "东海观测站 A-01",
  "latitude": 30.2741,
  "longitude": 122.3256,
  "liveStreamUrl": "https://live.whale-conservation.org/station-a01",
  "dataFeedUrl": "http://10.0.1.50:9000/sensor-data"
}
```

---

## ⚠️ 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `URL 地址是必填项，请提供有效的 URL` | 未提供参数或参数为空 | 确保请求包含有效的 URL 参数 |
| `xxx 不是有效的 URL 地址格式` | URL 格式不正确 | 检查 URL 格式是否符合标准 |
| `不支持的协议：xxx，仅允许 http, https` | 使用了不在白名单中的协议 | 添加所需协议到 `protocols` 选项或更换协议 |

### 支持的 URL 格式

```typescript
// ✅ 有效格式
https://example.com
http://localhost:3000/api
https://sub.domain.org/path/to/resource?query=value#hash
https://user:pass@example.com/secure
http://192.168.1.1:8080/api  // 需要 allowIp: true

// ❌ 无效格式
example.com                  // 缺少协议
://missing-protocol.com      // 协议格式错误
https://                     // 缺少主机
https://invalid domain.com   // 域名包含空格
ftp://example.com            // 协议不在白名单（默认仅 http/https）
```

---

## 🔧 配置选项

### ParseUrlPipe 选项

```typescript
interface ParseUrlOptions {
  /** 是否必填，默认 true */
  required?: boolean;
  /** 允许的协议列表，默认 ['http', 'https'] */
  protocols?: string[];
  /** 是否允许 IP 地址作为主机，默认 false */
  allowIp?: boolean;
}
```

### 使用示例

```typescript
// 必填 URL，仅允许 http/https (默认配置)
@Body('website', new ParseUrlPipe()) website: string

// 可选 URL
@Body('socialLink', new ParseUrlPipe({ required: false })) socialLink?: string

// 允许 FTP 协议
@Body('ftpUrl', new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] })) ftpUrl: string

// 允许 IP 地址（用于内部服务配置）
@Body('internalApi', new ParseUrlPipe({ allowIp: true })) internalApi: string

// 组合配置
@Body('wsEndpoint', new ParseUrlPipe({ 
  protocols: ['ws', 'wss'], 
  allowIp: true 
})) wsEndpoint: string
```

---

## 📝 最佳实践

### ✅ 推荐做法

1. **明确协议白名单** - 根据业务需求明确指定允许的协议，不要盲目允许所有协议
2. **谨慎使用 allowIp** - 仅在内网配置、开发环境等必要场景允许 IP 地址
3. **合理使用必填选项** - 核心功能 URL 使用必填，辅助功能 URL 使用可选
4. **配合其他验证管道使用** - 与 ParseStringPipe 等配合使用，确保数据完整性
5. **在 DTO 中明确标注可选** - 使用 `?` 标注可选字段，与 `required: false` 保持一致

### ❌ 避免的做法

1. **不要允许所有协议** - 避免使用 `protocols: ['*']` 或空数组，可能引入安全风险
2. **不要在前端重复验证** - 信任后端的 ParseUrlPipe，前端验证仅用于用户体验
3. **不要忽略协议安全** - 生产环境建议仅允许 https，避免 http 明文传输
4. **不要滥用 IP 地址允许** - 公网服务应使用域名，IP 地址仅用于内部配置

---

## 🧪 测试示例

```typescript
import { ParseUrlPipe } from '@/common/pipes';
import { BadRequestException } from '@nestjs/common';

describe('ParseUrlPipe', () => {
  const defaultPipe = new ParseUrlPipe();
  const optionalPipe = new ParseUrlPipe({ required: false });
  const ftpPipe = new ParseUrlPipe({ protocols: ['http', 'https', 'ftp'] });
  const ipPipe = new ParseUrlPipe({ allowIp: true });

  describe('默认配置验证', () => {
    it('should validate valid http/https URLs', () => {
      expect(defaultPipe.transform('https://example.com')).toBe('https://example.com');
      expect(defaultPipe.transform('http://localhost:3000/api')).toBe('http://localhost:3000/api');
      expect(defaultPipe.transform('  https://example.com/path  ')).toBe('https://example.com/path');
    });

    it('should reject invalid URLs', () => {
      expect(() => defaultPipe.transform('not-a-url'))
        .toThrow(BadRequestException);
      expect(() => defaultPipe.transform('example.com'))
        .toThrow(BadRequestException);
      expect(() => defaultPipe.transform('https://'))
        .toThrow(BadRequestException);
    });

    it('should reject unsupported protocols', () => {
      expect(() => defaultPipe.transform('ftp://example.com'))
        .toThrow(BadRequestException);
      expect(() => defaultPipe.transform('ws://localhost:8080'))
        .toThrow(BadRequestException);
    });

    it('should reject IP addresses by default', () => {
      expect(() => defaultPipe.transform('http://192.168.1.1:8080'))
        .toThrow(BadRequestException);
    });
  });

  describe('可选 URL 验证', () => {
    it('should accept undefined', () => {
      expect(optionalPipe.transform(undefined)).toBeUndefined();
      expect(optionalPipe.transform(null)).toBeUndefined();
      expect(optionalPipe.transform('')).toBeUndefined();
    });

    it('should validate when provided', () => {
      expect(optionalPipe.transform('https://example.com')).toBe('https://example.com');
    });
  });

  describe('自定义协议验证', () => {
    it('should accept FTP URLs', () => {
      expect(ftpPipe.transform('ftp://files.example.com/data.zip'))
        .toBe('ftp://files.example.com/data.zip');
    });
  });

  describe('IP 地址验证', () => {
    it('should accept IP addresses when allowed', () => {
      expect(ipPipe.transform('http://192.168.1.1:8080/api'))
        .toBe('http://192.168.1.1:8080/api');
      expect(ipPipe.transform('https://10.0.0.1/secure'))
        .toBe('https://10.0.0.1/secure');
    });
  });
});
```

---

## 🔗 相关管道

| 管道 | 用途 |
|------|------|
| `ParseEmailPipe` | 邮箱地址验证 |
| `ParseStringPipe` | 字符串验证（长度、格式等） |
| `ParseOptionalStringPipe` | 可选字符串验证 |
| `ParseArrayPipe` | 数组验证（批量 URL 处理场景） |

---

## 📚 相关文档

- [API Design](./api-design.md) - API 设计规范
- [API Examples](./api-examples.md) - API 使用示例
- [Common Quickstart](./common-quickstart.md) - 公共模块快速入门
- [ParseEmailPipe](./parse-email-pipe.md) - 邮箱地址验证管道
- [ParseStringPipe](./parse-string-pipe.md) - 字符串验证管道（待创建）

---

**🐋 有效的链接，连接更广阔的海洋保护网络！**
