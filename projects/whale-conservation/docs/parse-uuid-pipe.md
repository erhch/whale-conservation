# ParseUUIDPipe - UUID 验证管道

## 概述

`ParseUUIDPipe` 用于验证参数是否为有效的 UUID（Universally Unique Identifier）格式。支持 UUID v1-v5 版本验证，当值为无效 UUID 时抛出 `BadRequestException`。

## 使用场景

- 验证资源 ID（如用户 ID、鲸鱼记录 ID、观测站 ID）
- 确保传入的标识符符合 UUID 标准格式
- 防止 SQL 注入和无效 ID 查询

## 安装与导入

```typescript
import { ParseUUIDPipe } from './common/pipes';
```

## API 参数

### ParseUUIDOptions

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `version` | `1 \| 2 \| 3 \| 4 \| 5` | `undefined` | 指定 UUID 版本，不指定则接受任意版本 |
| `required` | `boolean` | `true` | 是否必填，`false` 时允许 `undefined` 或空值 |

## 使用示例

### 基础用法 - 验证任意版本 UUID

```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ParseUUIDPipe } from './common/pipes';

@Controller('whales')
export class WhalesController {
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    // id 已验证为有效 UUID
    return this.whalesService.findOne(id);
  }
}
```

### 指定 UUID 版本

```typescript
// 仅接受 UUID v4 (随机生成)
@Get(':id')
findOne(
  @Param('id', new ParseUUIDPipe({ version: 4 })) id: string
) {
  return this.whalesService.findOne(id);
}

// 仅接受 UUID v1 (基于时间戳)
@Get(':id')
findOne(
  @Param('id', new ParseUUIDPipe({ version: 1 })) id: string
) {
  return this.whalesService.findOne(id);
}
```

### 可选 UUID 参数

```typescript
// 可选参数 - 允许 undefined
@Get()
findAll(
  @Query('stationId', new ParseUUIDPipe({ required: false })) stationId?: string
) {
  if (stationId) {
    return this.whalesService.findByStation(stationId);
  }
  return this.whalesService.findAll();
}
```

### 在 DTO 中使用

```typescript
import { IsUUID, IsOptional } from 'class-validator';
import { ParseUUIDPipe } from './common/pipes';

export class CreateSightingDto {
  @IsUUID(4)
  whaleId: string;
  
  @IsUUID(4)
  stationId: string;
  
  @IsUUID(4)
  @IsOptional()
  speciesId?: string;
}

// 在控制器中验证
@Post()
create(
  @Body('whaleId', new ParseUUIDPipe({ version: 4 })) whaleId: string,
  @Body('stationId', new ParseUUIDPipe({ version: 4 })) stationId: string,
) {
  return this.sightingsService.create({ whaleId, stationId });
}
```

## 验证规则

### UUID 格式标准

UUID 是 128 位标识符，标准格式为 32 位十六进制数，分为 5 组，由连字符分隔：

```
xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
```

- `M` 表示 UUID 版本（1-5）
- `N` 表示 UUID 变体（8, 9, A, B）

### 各版本 UUID 示例

| 版本 | 说明 | 示例 |
|------|------|------|
| v1 | 基于时间戳和 MAC 地址 | `550e8400-e29b-11d4-a716-446655440000` |
| v2 | 基于时间戳和组 ID（DCE 安全） | `550e8400-e29b-21d4-a716-446655440000` |
| v3 | 基于 MD5 哈希的命名空间 | `550e8400-e29b-31d4-a716-446655440000` |
| v4 | 随机生成 | `550e8400-e29b-41d4-a716-446655440000` |
| v5 | 基于 SHA-1 哈希的命名空间 | `550e8400-e29b-51d4-a716-446655440000` |

## 错误响应

### 必填项缺失

**请求**:
```
GET /api/v1/whales/
```

**响应** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "id 是必填项，请提供有效的 UUID",
  "error": "Bad Request"
}
```

### UUID 格式无效

**请求**:
```
GET /api/v1/whales/invalid-id
```

**响应** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "id 必须是有效的 UUID 格式",
  "error": "Bad Request"
}
```

### 版本不匹配

**请求**:
```
GET /api/v1/whales/550e8400-e29b-11d4-a716-446655440000
```

使用 `ParseUUIDPipe({ version: 4 })` 验证 v1 UUID:

**响应** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "id 必须是有效的 UUID(v4) 格式",
  "error": "Bad Request"
}
```

## 最佳实践

### 1. 统一使用 UUID v4

对于新生成的 ID，推荐使用 UUID v4（随机生成），避免泄露时间戳或 MAC 地址信息：

```typescript
@Post()
create(
  @Body('id', new ParseUUIDPipe({ version: 4 })) id: string,
  @Body('name') name: string,
) {
  return this.whalesService.create({ id, name });
}
```

### 2. 结合 class-validator 使用

在 DTO 中同时使用 `class-validator` 和 `ParseUUIDPipe` 进行双重验证：

```typescript
import { IsUUID } from 'class-validator';

export class WhaleFilterDto {
  @IsUUID(4)
  speciesId: string;
}

// 控制器
@Get()
findAll(
  @Query(new ValidationPipe({ transform: true })) filter: WhaleFilterDto,
  @Query('speciesId', new ParseUUIDPipe({ version: 4 })) speciesId: string,
) {
  // 双重验证确保数据安全
}
```

### 3. 为关联资源使用相同版本

确保关联资源的 UUID 版本一致：

```typescript
@Post('sightings')
createSighting(
  @Body('whaleId', new ParseUUIDPipe({ version: 4 })) whaleId: string,
  @Body('stationId', new ParseUUIDPipe({ version: 4 })) stationId: string,
  @Body('speciesId', new ParseUUIDPipe({ version: 4 })) speciesId: string,
) {
  // 所有 ID 都是 v4，保持一致性
}
```

### 4. 处理可选 UUID

对于可选的 UUID 参数，明确设置 `required: false`：

```typescript
@Get()
findAll(
  @Query('after', new ParseUUIDPipe({ required: false })) after?: string,
  @Query('limit', new ParseIntPipe()) limit: number = 10,
) {
  // after 可选，用于分页
}
```

## 与其他管道组合

### 与 ParseOptionalStringPipe 组合

```typescript
@Query('searchId', new ParseOptionalStringPipe({ transform: (v) => v.toLowerCase() }))
searchId?: string;

// 然后手动验证 UUID
if (searchId && !UUID_REGEX.any.test(searchId)) {
  throw new BadRequestException('searchId 必须是有效的 UUID 格式');
}
```

### 与 ParseArrayPipe 组合

验证 UUID 数组：

```typescript
@Query('ids', new ParseArrayPipe({ 
  items: String, 
  separator: ',',
  validate: (item) => UUID_REGEX.any.test(item)
}))
ids: string[];
```

## 性能考虑

- UUID 验证使用正则表达式，性能开销极小
- 单次验证时间 < 0.01ms
- 适合高并发场景

## 安全注意事项

1. **防止枚举攻击**: UUID v4 的随机性使得枚举困难
2. **避免信息泄露**: 不使用 v1 UUID（包含 MAC 地址和时间戳）
3. **输入清理**: 管道会自动 trim 输入，防止空白字符注入

## 相关文档

- [ParseEmailPipe](./parse-email-pipe.md) - 邮箱验证管道
- [ParsePhonePipe](./parse-phone-pipe.md) - 手机号验证管道
- [ParseCoordinatePipe](./parse-coordinate-pipe.md) - 坐标验证管道
- [Common Pipes 快速入门](./common-quickstart.md)
