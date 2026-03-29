# Species Module - 物种管理模块

## 概述

物种管理模块负责鲸类物种信息的 CRUD 操作，支持分页查询、按 IUCN 保护等级和科属筛选。所有查询接口默认公开访问并启用 5 分钟缓存，写入操作需要 JWT 认证。

## 核心功能

| 功能 | 端点 | 认证 | 缓存 |
|------|------|------|------|
| 获取物种列表 | `GET /api/v1/species` | ❌ 公开 | ✅ 5 分钟 |
| 获取单个物种 | `GET /api/v1/species/:id` | ❌ 公开 | ✅ 5 分钟 |
| 搜索物种 | `GET /api/v1/species/search?q=关键词` | ❌ 公开 | ✅ 5 分钟 |
| 创建物种 | `POST /api/v1/species` | ✅ JWT | ❌ |
| 更新物种 | `PUT /api/v1/species/:id` | ✅ JWT | ❌ |
| 删除物种 | `DELETE /api/v1/species/:id` | ✅ JWT | ❌ |

## 数据模型

### Species 实体字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | 自动生成 | 主键 |
| `scientificName` | string | ✅ | 学名 (唯一) |
| `commonNameZh` | string | ✅ | 中文名 |
| `commonNameEn` | string | - | 英文名 |
| `description` | text | - | 描述 |
| `family` | string | - | 科属 |
| `averageLength` | number | - | 平均体长 (米) |
| `averageWeight` | number | - | 平均体重 (吨) |
| `iucnStatus` | enum | - | IUCN 保护等级 |
| `populationEstimate` | number | - | 种群数量估计 |
| `distribution` | string | - | 分布区域 |
| `imageUrl` | string | - | 图片 URL |
| `isActive` | boolean | 默认 true | 是否激活 (软删除) |
| `createdAt` | Date | 自动生成 | 创建时间 |
| `updatedAt` | Date | 自动生成 | 更新时间 |

### IUCN 保护等级枚举

| 值 | 说明 |
|----|------|
| `LC` | Least Concern - 无危 |
| `NT` | Near Threatened - 近危 |
| `VU` | Vulnerable - 易危 |
| `EN` | Endangered - 濒危 |
| `CR` | Critically Endangered - 极危 |
| `EW` | Extinct in the Wild - 野外灭绝 |
| `EX` | Extinct - 灭绝 |

## API 使用示例

### 获取物种列表 (公开)

```bash
# 基础查询 - 第 1 页，每页 10 条
curl -X GET "http://localhost:3000/api/v1/species"

# 分页查询 - 第 2 页，每页 20 条
curl -X GET "http://localhost:3000/api/v1/species?page=2&limit=20"

# 按 IUCN 等级筛选 - 濒危物种
curl -X GET "http://localhost:3000/api/v1/species?iucnStatus=EN"

# 按科属筛选 - 须鲸科
curl -X GET "http://localhost:3000/api/v1/species?family=Balaenopteridae"

# 组合筛选
curl -X GET "http://localhost:3000/api/v1/species?iucnStatus=VU&family=Delphinidae&page=1&limit=10"
```

**响应格式:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "scientificName": "Balaenoptera musculus",
      "commonNameZh": "蓝鲸",
      "commonNameEn": "Blue Whale",
      "family": "Balaenopteridae",
      "averageLength": 24,
      "averageWeight": 150,
      "iucnStatus": "EN",
      "populationEstimate": 25000,
      "distribution": "全球各大洋",
      "isActive": true,
      "createdAt": "2024-01-15T08:30:00.000Z",
      "updatedAt": "2024-01-15T08:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

### 搜索物种 (公开)

```bash
# 按中文名搜索
curl -X GET "http://localhost:3000/api/v1/species/search?q=蓝鲸"

# 按学名搜索
curl -X GET "http://localhost:3000/api/v1/species/search?q=Balaenoptera"

# 按科属搜索
curl -X GET "http://localhost:3000/api/v1/species/search?q=须鲸科"

# 按英文名搜索
curl -X GET "http://localhost:3000/api/v1/species/search?q=Blue Whale"
```

**响应格式:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "scientificName": "Balaenoptera musculus",
    "commonNameZh": "蓝鲸",
    "commonNameEn": "Blue Whale",
    "family": "Balaenopteridae",
    "averageLength": 24,
    "averageWeight": 150,
    "iucnStatus": "EN",
    "populationEstimate": 25000,
    "distribution": "全球各大洋",
    "isActive": true,
    "createdAt": "2024-01-15T08:30:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z"
  }
]
```

### 获取单个物种详情 (公开)

```bash
curl -X GET "http://localhost:3000/api/v1/species/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**响应:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "scientificName": "Balaenoptera musculus",
  "commonNameZh": "蓝鲸",
  "commonNameEn": "Blue Whale",
  "description": "蓝鲸是地球上已知最大的动物...",
  "family": "Balaenopteridae",
  "averageLength": 24,
  "averageWeight": 150,
  "iucnStatus": "EN",
  "populationEstimate": 25000,
  "distribution": "全球各大洋",
  "imageUrl": "https://example.com/images/blue-whale.jpg",
  "isActive": true,
  "createdAt": "2024-01-15T08:30:00.000Z",
  "updatedAt": "2024-01-15T08:30:00.000Z"
}
```

### 创建新物种 (需要认证)

```bash
curl -X POST "http://localhost:3000/api/v1/species" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "scientificName": "Orcinus orca",
    "commonNameZh": "虎鲸",
    "commonNameEn": "Killer Whale",
    "family": "Delphinidae",
    "averageLength": 9,
    "averageWeight": 6,
    "iucnStatus": "NT",
    "populationEstimate": 50000,
    "distribution": "全球各大洋，从极地到热带海域"
  }'
```

### 更新物种信息 (需要认证)

```bash
curl -X PUT "http://localhost:3000/api/v1/species/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "populationEstimate": 26000,
    "description": "更新后的描述信息..."
  }'
```

### 删除物种 (软删除，需要认证)

```bash
curl -X DELETE "http://localhost:3000/api/v1/species/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## JavaScript/TypeScript 示例

### Fetch API

```typescript
// 获取物种列表
async function getSpeciesList(page = 1, limit = 10, iucnStatus?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (iucnStatus) params.append('iucnStatus', iucnStatus);
  
  const response = await fetch(`/api/v1/species?${params}`);
  return response.json();
}

// 创建物种
async function createSpecies(token: string, speciesData: any) {
  const response = await fetch('/api/v1/species', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(speciesData),
  });
  return response.json();
}
```

### Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

// 获取物种列表
const speciesList = await api.get('/species', {
  params: { page: 1, limit: 10, iucnStatus: 'EN' },
});

// 创建物种 (自动添加 Token)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const newSpecies = await api.post('/species', {
  scientificName: 'Orcinus orca',
  commonNameZh: '虎鲸',
  family: 'Delphinidae',
});
```

## 缓存说明

### 缓存策略

| 端点 | 缓存时间 | 缓存键 |
|------|----------|--------|
| `GET /species` | 5 分钟 | `cache:/api/v1/species?...` |
| `GET /species/:id` | 5 分钟 | `cache:/api/v1/species/:id` |

### 缓存失效

当创建、更新或删除物种时，相关缓存会自动清除：

- **创建物种**: 清除列表缓存 `cache:/api/v1/species`
- **更新物种**: 清除详情缓存 `cache:/api/v1/species/:id` + 列表缓存
- **删除物种**: 清除详情缓存 `cache:/api/v1/species/:id` + 列表缓存

### 手动清除缓存 (开发者)

```typescript
// 在 Service 中注入 CacheInterceptor
constructor(
  @InjectRepository(Species)
  private speciesRepository: Repository<Species>,
  private cacheInterceptor: CacheInterceptor,
) {}

// 清除特定缓存
this.cacheInterceptor.clearCache('cache:/api/v1/species');

// 清除所有缓存
this.cacheInterceptor.clearAllCache();
```

## 错误处理

| HTTP 状态码 | 说明 | 响应示例 |
|------------|------|----------|
| `200` | 成功 | `{ data: [...], total: 45, page: 1, limit: 10 }` |
| `201` | 创建成功 | `{ id: "...", scientificName: "..." }` |
| `400` | 请求参数错误 | `{ message: "Invalid iucnStatus", error: "Bad Request" }` |
| `401` | 未授权 (需要 JWT) | `{ message: "Unauthorized" }` |
| `404` | 物种不存在 | `{ message: "物种不存在", error: "Not Found" }` |
| `403` | 权限不足 | `{ message: "Forbidden" }` |

## 最佳实践

### 1. 公开数据缓存

物种数据变化频率低，适合缓存：

```typescript
// ✅ 推荐：列表接口启用缓存
@Get()
@Public()
@UseInterceptors(CacheInterceptor)
@CacheTTL(300)
async findAll() { ... }
```

### 2. 软删除

使用 `isActive` 字段标记删除状态，保留数据完整性：

```typescript
// Service 中的软删除实现
async remove(id: string): Promise<void> {
  const species = await this.findOne(id);
  species.isActive = false;
  await this.speciesRepository.save(species);
}
```

### 3. 分页参数验证

使用 `ParseOptionalIntPipe` 确保参数安全：

```typescript
@Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 }))
@Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
```

### 4. 唯一性约束

学名 (`scientificName`) 设置唯一索引，防止重复：

```typescript
@Column({ unique: true })
scientificName: string;
```

## 与 Whales 模块的关系

Species 与 Whales 是一对多关系：

```typescript
// Species 实体
@OneToMany(() => Whale, (whale) => whale.species)
whales: Whale[];

// Whale 实体
@ManyToOne(() => Species, (species) => species.whales)
@JoinColumn()
species: Species;
```

查询鲸鱼个体时可以关联物种信息：

```typescript
// 获取某物种的所有鲸鱼个体
GET /api/v1/whales?speciesId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## 待扩展功能

- [ ] 物种图片上传功能
- [ ] 物种迁徙路线记录
- [ ] 物种间关系图谱
- [ ] 物种保护历史记录
- [ ] 批量导入/导出 (CSV/Excel)
- [ ] 物种数据变更日志

## 相关文件

| 文件 | 说明 |
|------|------|
| `species.controller.ts` | 控制器 - API 端点定义 |
| `species.service.ts` | 服务层 - 业务逻辑 |
| `species.module.ts` | 模块定义 |
| `entities/species.entity.ts` | TypeORM 实体定义 |
| `dto/index.ts` | DTO 定义 (CreateSpeciesDto, UpdateSpeciesDto) |

---

**最后更新:** 2026-03-29  
**模块状态:** ✅ 完成 (分页 + 筛选 + 缓存 + 搜索)
