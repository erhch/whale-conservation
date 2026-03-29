# Whales Module - 鲸鱼个体管理模块

> 管理鲸鱼个体信息的核心模块，支持个体档案、生命状态追踪、观测历史关联

**版本:** 1.2.0  
**最后更新:** 2026-03-29  
**状态:** ✅ 完成

---

## 📋 模块概述

Whales Module 负责管理鲸鱼个体的完整档案信息，包括：

- **个体标识**: 唯一标识符 (如 BCX001)、昵称
- **基本信息**: 物种、性别、估计年龄、体长、体重
- **生命状态**: 存活/死亡/失踪状态追踪
- **特征描述**: 疤痕、鳍形状等识别特征
- **照片管理**: 个体照片 URL
- **观测时间**: 首次/最后观测时间及地点
- **关联数据**: 与该个体相关的所有观测记录

### 核心功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 个体列表查询 | 支持分页、按物种/性别/状态筛选 | ✅ |
| 个体详情查询 | 获取单个个体的完整档案 | ✅ |
| 创建个体记录 | 添加新的鲸鱼个体档案 | ✅ |
| 更新个体信息 | 修改个体档案信息 | ✅ |
| 删除个体记录 | 移除个体档案 (软删除推荐) | ✅ |
| 个体搜索 | 按编号/昵称/备注模糊搜索 | ✅ |
| 观测记录查询 | 获取某只鲸鱼的观测记录 (分页 + 日期筛选) | ✅ |
| 响应缓存 | 列表/详情/搜索接口自动缓存 | ✅ |
| 观测记录关联 | 自动关联该个体的所有观测记录 | ✅ |

---

## 📊 数据模型

### Whale 实体

```typescript
@Entity('whales')
export class Whale {
  id: string;                    // UUID 主键
  identifier: string;            // 唯一标识符 (如：BCX001)
  name?: string;                 // 昵称 (可选)
  speciesId: string;             // 物种 ID (外键)
  species: Species;              // 关联的物种对象
  sex?: Sex;                     // 性别 (M/F/U)
  estimatedAge?: number;         // 估计年龄 (年)
  length?: number;               // 体长 (米)
  weight?: number;               // 体重 (吨)
  lifeStatus: LifeStatus;        // 生命状态 (默认：alive)
  distinctiveFeatures?: string;  // 特征描述
  photoUrl?: string;             // 照片 URL
  firstSightedAt?: Date;         // 首次观测时间
  lastSightedAt?: Date;          // 最后观测时间
  lastSightedLocation?: string;  // 最后观测地点
  sightings: Sighting[];         // 关联的观测记录
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

### 枚举类型

#### Sex - 性别

```typescript
enum Sex {
  MALE = 'M',       // 雄性
  FEMALE = 'F',     // 雌性
  UNKNOWN = 'U',    // 未知
}
```

#### LifeStatus - 生命状态

```typescript
enum LifeStatus {
  ALIVE = 'alive',       // 存活
  DECEASED = 'deceased', // 死亡
  MISSING = 'missing',   // 失踪
}
```

### 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | 自动生成 | - | 主键 ID |
| `identifier` | string | ✅ | - | 唯一标识符，如 BCX001 |
| `name` | string | ❌ | null | 昵称，如"大白" |
| `speciesId` | string | ✅ | - | 物种 ID (外键) |
| `species` | Species | 自动关联 | - | 关联的物种对象 |
| `sex` | Sex 枚举 | ❌ | null | 性别 (M/F/U) |
| `estimatedAge` | number | ❌ | null | 估计年龄 (年) |
| `length` | number | ❌ | null | 体长 (米) |
| `weight` | number | ❌ | null | 体重 (吨) |
| `lifeStatus` | LifeStatus 枚举 | ✅ | `alive` | 生命状态 |
| `distinctiveFeatures` | string | ❌ | null | 特征描述 (疤痕、鳍形状等) |
| `photoUrl` | string | ❌ | null | 照片 URL |
| `firstSightedAt` | Date | ❌ | null | 首次观测时间 |
| `lastSightedAt` | Date | ❌ | null | 最后观测时间 |
| `lastSightedLocation` | string | ❌ | null | 最后观测地点 |
| `sightings` | Sighting[] | 自动关联 | - | 观测记录列表 |

---

## 🔌 API 端点

### 基础信息

- **Base URL:** `/api/v1/whales`
- **认证要求:** 读操作公开，写操作需要 JWT 认证
- **缓存策略:** 列表/详情接口默认缓存 5 分钟

---

### 1. 获取鲸鱼个体列表

**GET** `/api/v1/whales`

获取鲸鱼个体列表，支持分页和筛选。

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | ❌ | 1 | 页码 (最小 1) |
| `limit` | number | ❌ | 10 | 每页数量 (1-100) |
| `speciesId` | string | ❌ | - | 按物种 ID 筛选 |
| `sex` | string | ❌ | - | 按性别筛选 (M/F/U) |
| `active` | boolean | ❌ | true | 是否仅显示存活个体 |

#### 响应示例

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "identifier": "BCX001",
      "name": "大白",
      "speciesId": "sp-001",
      "species": {
        "id": "sp-001",
        "scientificName": "Megaptera novaeangliae",
        "chineseName": "座头鲸"
      },
      "sex": "M",
      "estimatedAge": 8,
      "length": 14.5,
      "weight": 32.0,
      "lifeStatus": "alive",
      "distinctiveFeatures": "左鳍有明显疤痕",
      "photoUrl": "https://example.com/photos/bcx001.jpg",
      "firstSightedAt": "2024-03-15T08:30:00Z",
      "lastSightedAt": "2026-03-20T14:20:00Z",
      "lastSightedLocation": "北海湾观测点 A",
      "createdAt": "2024-03-15T10:00:00Z",
      "updatedAt": "2026-03-20T15:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

#### cURL 示例

```bash
# 获取第一页，每页 10 条
curl -X GET "http://localhost:3000/api/v1/whales?page=1&limit=10"

# 筛选座头鲸 (speciesId=sp-001)
curl -X GET "http://localhost:3000/api/v1/whales?speciesId=sp-001"

# 筛选雄性个体
curl -X GET "http://localhost:3000/api/v1/whales?sex=M"

# 仅显示存活个体 (默认行为)
curl -X GET "http://localhost:3000/api/v1/whales?active=true"

# 显示所有个体 (包括死亡/失踪)
curl -X GET "http://localhost:3000/api/v1/whales?active=false"

# 组合筛选：座头鲸 + 雌性 + 存活
curl -X GET "http://localhost:3000/api/v1/whales?speciesId=sp-001&sex=F&active=true"
```

#### JavaScript 示例

```javascript
// Fetch API
async function getWhales(page = 1, limit = 10, filters = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });
  
  const response = await fetch(`http://localhost:3000/api/v1/whales?${params}`);
  return response.json();
}

// 使用示例
const result = await getWhales(1, 20, { speciesId: 'sp-001', sex: 'F' });
console.log(`共 ${result.total} 条记录，当前第 ${result.page} 页`);
result.data.forEach(whale => {
  console.log(`${whale.identifier} - ${whale.name || '未命名'} (${whale.sex})`);
});
```

```javascript
// Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

async function getWhales(params = {}) {
  const response = await api.get('/whales', { params });
  return response.data;
}

// 使用示例
const { data, total, page, limit } = await getWhales({
  page: 1,
  limit: 20,
  speciesId: 'sp-001',
});
```

---

### 2. 获取单个鲸鱼个体详情

**GET** `/api/v1/whales/:id`

获取指定鲸鱼个体的完整档案信息。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 鲸鱼个体 ID |

#### 响应示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "identifier": "BCX001",
  "name": "大白",
  "speciesId": "sp-001",
  "species": {
    "id": "sp-001",
    "scientificName": "Megaptera novaeangliae",
    "chineseName": "座头鲸",
    "family": "Balaenopteridae",
    "iucnStatus": "LC"
  },
  "sex": "M",
  "estimatedAge": 8,
  "length": 14.5,
  "weight": 32.0,
  "lifeStatus": "alive",
  "distinctiveFeatures": "左鳍有明显疤痕，背鳍形状独特",
  "photoUrl": "https://example.com/photos/bcx001.jpg",
  "firstSightedAt": "2024-03-15T08:30:00Z",
  "lastSightedAt": "2026-03-20T14:20:00Z",
  "lastSightedLocation": "北海湾观测点 A",
  "sightings": [
    {
      "id": "sig-001",
      "observedAt": "2026-03-20T14:20:00Z",
      "location": "北海湾观测点 A",
      "behavior": "觅食"
    },
    {
      "id": "sig-002",
      "observedAt": "2026-03-18T09:15:00Z",
      "location": "北海湾观测点 B",
      "behavior": "社交"
    }
  ],
  "createdAt": "2024-03-15T10:00:00Z",
  "updatedAt": "2026-03-20T15:00:00Z"
}
```

#### cURL 示例

```bash
curl -X GET "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000"
```

#### JavaScript 示例

```javascript
async function getWhaleById(id) {
  const response = await fetch(`http://localhost:3000/api/v1/whales/${id}`);
  return response.json();
}

// 使用示例
const whale = await getWhaleById('550e8400-e29b-41d4-a716-446655440000');
console.log(`${whale.identifier} - ${whale.name}`);
console.log(`物种：${whale.species.chineseName}`);
console.log(`观测记录：${whale.sightings.length} 条`);
```

---

### 3. 创建新鲸鱼个体记录

**POST** `/api/v1/whales`

创建新的鲸鱼个体档案。

**认证要求:** ✅ JWT Token (Bearer)  
**权限要求:** `researcher` 或 `admin` 角色

#### 请求体 (CreateWhaleDto)

```json
{
  "identifier": "BCX002",
  "name": "小白",
  "speciesId": "sp-001",
  "sex": "F",
  "estimatedAge": 5,
  "length": 12.3,
  "weight": 28.5,
  "lifeStatus": "alive",
  "distinctiveFeatures": "尾鳍边缘有独特缺口",
  "photoUrl": "https://example.com/photos/bcx002.jpg",
  "firstSightedAt": "2026-03-25T10:00:00Z",
  "lastSightedAt": "2026-03-25T10:00:00Z",
  "lastSightedLocation": "北海湾观测点 C"
}
```

#### 字段验证规则

| 字段 | 验证规则 |
|------|----------|
| `identifier` | 必填，字符串，唯一 |
| `name` | 可选，字符串 |
| `speciesId` | 必填，有效的 UUID |
| `sex` | 可选，枚举值：M/F/U |
| `estimatedAge` | 可选，正整数 |
| `length` | 可选，正数 (米) |
| `weight` | 可选，正数 (吨) |
| `lifeStatus` | 可选，枚举值：alive/deceased/missing (默认：alive) |
| `distinctiveFeatures` | 可选，字符串 |
| `photoUrl` | 可选，有效的 URL |
| `firstSightedAt` | 可选，ISO 8601 日期 |
| `lastSightedAt` | 可选，ISO 8601 日期 |
| `lastSightedLocation` | 可选，字符串 |

#### 响应示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "identifier": "BCX002",
  "name": "小白",
  "speciesId": "sp-001",
  "species": {
    "id": "sp-001",
    "scientificName": "Megaptera novaeangliae",
    "chineseName": "座头鲸"
  },
  "sex": "F",
  "estimatedAge": 5,
  "length": 12.3,
  "weight": 28.5,
  "lifeStatus": "alive",
  "distinctiveFeatures": "尾鳍边缘有独特缺口",
  "photoUrl": "https://example.com/photos/bcx002.jpg",
  "firstSightedAt": "2026-03-25T10:00:00Z",
  "lastSightedAt": "2026-03-25T10:00:00Z",
  "lastSightedLocation": "北海湾观测点 C",
  "createdAt": "2026-03-28T12:00:00Z",
  "updatedAt": "2026-03-28T12:00:00Z"
}
```

#### cURL 示例

```bash
curl -X POST "http://localhost:3000/api/v1/whales" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "identifier": "BCX002",
    "name": "小白",
    "speciesId": "sp-001",
    "sex": "F",
    "estimatedAge": 5,
    "length": 12.3,
    "weight": 28.5,
    "lifeStatus": "alive",
    "distinctiveFeatures": "尾鳍边缘有独特缺口",
    "firstSightedAt": "2026-03-25T10:00:00Z",
    "lastSightedAt": "2026-03-25T10:00:00Z",
    "lastSightedLocation": "北海湾观测点 C"
  }'
```

#### JavaScript 示例

```javascript
async function createWhale(whaleData) {
  const response = await fetch('http://localhost:3000/api/v1/whales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
    },
    body: JSON.stringify(whaleData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// 使用示例
const newWhale = await createWhale({
  identifier: 'BCX002',
  name: '小白',
  speciesId: 'sp-001',
  sex: 'F',
  estimatedAge: 5,
  length: 12.3,
  lifeStatus: 'alive',
});

console.log(`创建成功：${newWhale.identifier}`);
```

---

### 4. 更新鲸鱼个体信息

**PUT** `/api/v1/whales/:id`

更新指定鲸鱼个体的档案信息。

**认证要求:** ✅ JWT Token (Bearer)  
**权限要求:** `researcher` 或 `admin` 角色

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 鲸鱼个体 ID |

#### 请求体 (UpdateWhaleDto)

所有字段均为可选 (PATCH 模式)，只更新提供的字段。

```json
{
  "name": "大白 (成年)",
  "lifeStatus": "alive",
  "lastSightedAt": "2026-03-28T09:30:00Z",
  "lastSightedLocation": "北海湾观测点 A",
  "distinctiveFeatures": "左鳍有明显疤痕，新发现背部有藤壶群"
}
```

#### 响应示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "identifier": "BCX001",
  "name": "大白 (成年)",
  "speciesId": "sp-001",
  "species": {
    "id": "sp-001",
    "scientificName": "Megaptera novaeangliae",
    "chineseName": "座头鲸"
  },
  "sex": "M",
  "estimatedAge": 8,
  "length": 14.5,
  "weight": 32.0,
  "lifeStatus": "alive",
  "distinctiveFeatures": "左鳍有明显疤痕，新发现背部有藤壶群",
  "photoUrl": "https://example.com/photos/bcx001.jpg",
  "firstSightedAt": "2024-03-15T08:30:00Z",
  "lastSightedAt": "2026-03-28T09:30:00Z",
  "lastSightedLocation": "北海湾观测点 A",
  "createdAt": "2024-03-15T10:00:00Z",
  "updatedAt": "2026-03-28T12:30:00Z"
}
```

#### cURL 示例

```bash
# 更新最后观测信息
curl -X PUT "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lastSightedAt": "2026-03-28T09:30:00Z",
    "lastSightedLocation": "北海湾观测点 A"
  }'

# 更新生命状态为失踪
curl -X PUT "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lifeStatus": "missing"
  }'
```

#### JavaScript 示例

```javascript
async function updateWhale(id, updates) {
  const response = await fetch(`http://localhost:3000/api/v1/whales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// 使用示例 - 更新最后观测信息
const updated = await updateWhale('550e8400-e29b-41d4-a716-446655440000', {
  lastSightedAt: new Date().toISOString(),
  lastSightedLocation: '北海湾观测点 A',
});

console.log(`更新成功，最后观测时间：${updated.lastSightedAt}`);
```

---

### 5. 删除鲸鱼个体记录

**DELETE** `/api/v1/whales/:id`

删除指定鲸鱼个体记录。

**认证要求:** ✅ JWT Token (Bearer)  
**权限要求:** `admin` 角色

> ⚠️ **注意:** 当前实现为硬删除。生产环境建议使用软删除 (添加 `deletedAt` 字段)。

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 鲸鱼个体 ID |

#### 响应

成功删除返回 `200 OK`，无响应体。

#### cURL 示例

```bash
curl -X DELETE "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### JavaScript 示例

```javascript
async function deleteWhale(id) {
  const response = await fetch(`http://localhost:3000/api/v1/whales/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  console.log('删除成功');
}
```

---

### 6. 搜索鲸鱼个体

**GET** `/api/v1/whales/search`

搜索鲸鱼个体，支持按编号、昵称、备注进行模糊搜索。

**认证要求:** ❌ 公开访问  
**缓存策略:** ✅ 5 分钟缓存

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | ✅ | 搜索关键词 |

#### 搜索规则

| 规则 | 说明 |
|------|------|
| 模糊匹配 | 使用 LIKE 查询，支持部分匹配 |
| 搜索字段 | `identifier` (编号)、`name` (昵称)、`notes` (备注) |
| 大小写 | 不区分大小写 (PostgreSQL LIKE 默认行为) |
| 空查询 | 返回空数组 `[]` |
| 排序 | 按创建时间倒序 (最新创建的优先) |

#### 响应示例

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "identifier": "BCX001",
    "name": "大白",
    "speciesId": "sp-001",
    "species": {
      "id": "sp-001",
      "scientificName": "Megaptera novaeangliae",
      "commonNameZh": "座头鲸"
    },
    "sex": "M",
    "estimatedAge": 8,
    "length": 14.5,
    "weight": 32.0,
    "lifeStatus": "alive",
    "distinctiveFeatures": "左鳍有明显疤痕",
    "photoUrl": "https://example.com/photos/bcx001.jpg",
    "firstSightedAt": "2024-03-15T08:30:00Z",
    "lastSightedAt": "2026-03-20T14:20:00Z",
    "lastSightedLocation": "北海湾观测点 A",
    "createdAt": "2024-03-15T10:00:00Z",
    "updatedAt": "2026-03-20T15:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "identifier": "BCX003",
    "name": "大白鲨",
    "speciesId": "sp-002",
    "species": {
      "id": "sp-002",
      "scientificName": "Carcharodon carcharias",
      "commonNameZh": "大白鲨"
    },
    "sex": "F",
    "estimatedAge": 12,
    "length": 5.2,
    "lifeStatus": "alive",
    "createdAt": "2025-06-10T09:00:00Z",
    "updatedAt": "2026-03-15T11:30:00Z"
  }
]
```

#### cURL 示例

```bash
# 搜索编号包含"BCX"的鲸鱼
curl -X GET "http://localhost:3000/api/v1/whales/search?q=BCX"

# 搜索昵称包含"大白"的鲸鱼
curl -X GET "http://localhost:3000/api/v1/whales/search?q=大白"

# 搜索备注包含"疤痕"的鲸鱼
curl -X GET "http://localhost:3000/api/v1/whales/search?q=疤痕"

# 空查询返回空数组
curl -X GET "http://localhost:3000/api/v1/whales/search?q="
```

#### JavaScript 示例

```javascript
// Fetch API
async function searchWhales(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const response = await fetch(`http://localhost:3000/api/v1/whales/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

// 使用示例
const results = await searchWhales('大白');
console.log(`找到 ${results.length} 条匹配记录`);
results.forEach(whale => {
  console.log(`${whale.identifier} - ${whale.name || '未命名'} (${whale.species.commonNameZh})`);
});
```

```javascript
// Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

async function searchWhales(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const response = await api.get('/whales/search', {
    params: { q: query },
  });
  return response.data;
}

// 使用示例
const whales = await searchWhales('BCX');
console.log(`搜索结果：${whales.length} 条`);
```

#### 使用场景

| 场景 | 示例查询 | 说明 |
|------|----------|------|
| 快速查找个体 | `q=BCX001` | 通过编号精确查找 |
| 昵称搜索 | `q=大白` | 查找昵称包含关键词的个体 |
| 特征搜索 | `q=疤痕` | 查找备注中包含特定特征的个体 |
| 模糊匹配 | `q=小白` | 可能匹配"小白"、"小白鲸"等 |

---

### 7. 获取鲸鱼的观测记录

**GET** `/api/v1/whales/:id/sightings`

获取指定鲸鱼个体的观测记录列表，支持分页和日期范围筛选。

**认证要求:** ❌ 公开访问  
**缓存策略:** ✅ 5 分钟缓存

#### 请求参数

**路径参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | UUID | ✅ | 鲸鱼个体 ID |

**查询参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | ❌ | 1 | 页码 (从 1 开始) |
| `limit` | number | ❌ | 10 | 每页数量 (1-100) |
| `startDate` | string (ISO 8601) | ❌ | - | 开始日期 (包含) |
| `endDate` | string (ISO 8601) | ❌ | - | 结束日期 (包含) |

#### 响应格式

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "whaleId": "550e8400-e29b-41d4-a716-446655440000",
      "stationId": "st-001",
      "station": {
        "id": "st-001",
        "code": "ST001",
        "name": "东海监测站",
        "type": "fixed",
        "status": "active"
      },
      "observerId": "usr-001",
      "observer": {
        "id": "usr-001",
        "username": "研究员 A",
        "email": "researcher@example.com"
      },
      "observedAt": "2026-03-20T14:30:00.000Z",
      "latitude": 31.2304,
      "longitude": 121.4737,
      "locationName": "东海海域",
      "behavior": "觅食",
      "groupSize": 3,
      "notes": "观察到母子互动",
      "photoUrls": ["https://example.com/photos/sighting-001.jpg"],
      "weather": "晴朗",
      "seaState": 2,
      "isVerified": true,
      "createdAt": "2026-03-20T15:00:00.000Z",
      "updatedAt": "2026-03-20T15:00:00.000Z"
    }
  ],
  "total": 23,
  "page": 1,
  "limit": 10
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | array | 观测记录列表 |
| `data[].id` | UUID | 观测记录 ID |
| `data[].whaleId` | UUID | 鲸鱼个体 ID |
| `data[].stationId` | UUID | 监测站点 ID (可能为 null) |
| `data[].station` | object | 监测站点详情 (可能为 null) |
| `data[].observerId` | UUID | 观测者 ID |
| `data[].observer` | object | 观测者详情 |
| `data[].observedAt` | string | 观测时间 (ISO 8601) |
| `data[].latitude` | number | 纬度 |
| `data[].longitude` | number | 经度 |
| `data[].locationName` | string | 地点名称 |
| `data[].behavior` | string | 行为描述 |
| `data[].groupSize` | number | 群体数量 |
| `data[].notes` | string | 备注 |
| `data[].photoUrls` | array | 照片 URLs |
| `data[].weather` | string | 天气状况 |
| `data[].seaState` | number | 海况等级 (0-9) |
| `data[].isVerified` | boolean | 是否已验证 |
| `total` | number | 总记录数 |
| `page` | number | 当前页码 |
| `limit` | number | 每页数量 |

#### cURL 示例

```bash
# 获取鲸鱼的全部观测记录 (第 1 页，每页 10 条)
curl -X GET "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000/sightings"

# 获取第 2 页，每页 20 条
curl -X GET "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000/sightings?page=2&limit=20"

# 获取 2026 年 3 月的观测记录
curl -X GET "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000/sightings?startDate=2026-03-01T00:00:00Z&endDate=2026-03-31T23:59:59Z"

# 获取最近 30 天的观测记录
curl -X GET "http://localhost:3000/api/v1/whales/550e8400-e29b-41d4-a716-446655440000/sightings?startDate=$(date -d '30 days ago' -Iseconds)"
```

#### JavaScript 示例

```javascript
// Fetch API
async function getWhaleSightings(whaleId, options = {}) {
  const { page = 1, limit = 10, startDate, endDate } = options;
  
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(
    `http://localhost:3000/api/v1/whales/${whaleId}/sightings?${params}`
  );
  return response.json();
}

// 使用示例
const result = await getWhaleSightings('550e8400-e29b-41d4-a716-446655440000', {
  page: 1,
  limit: 20,
  startDate: '2026-03-01T00:00:00Z',
});

console.log(`共 ${result.total} 条观测记录`);
result.data.forEach(sighting => {
  console.log(`${sighting.observedAt} - ${sighting.locationName}: ${sighting.behavior}`);
});
```

#### 使用场景

| 场景 | 说明 |
|------|------|
| 个体观测历史 | 查看某只鲸鱼的完整观测记录 |
| 时间范围分析 | 分析特定时间段内的观测活动 |
| 迁徙轨迹追踪 | 结合观测时间和地点构建迁徙路径 |
| 行为研究 | 统计某只鲸鱼的行为模式 |
| 数据导出 | 分页获取全部观测记录用于导出 |

#### 注意事项

| 事项 | 说明 |
|------|------|
| 鲸鱼不存在 | 返回 404 Not Found |
| 无观测记录 | 返回 `data: []`, `total: 0` |
| 日期格式 | 使用 ISO 8601 格式 (如：2026-03-29T00:00:00Z) |
| 排序 | 按观测时间倒序 (最新观测优先) |
| 关联数据 | 自动包含 station 和 observer 详情 |

---

## 🔄 缓存策略

### 缓存配置

| 端点 | 缓存 | TTL | 说明 |
|------|------|-----|------|
| `GET /whales` | ✅ | 300s | 列表查询缓存 5 分钟 |
| `GET /whales/:id` | ✅ | 300s | 详情查询缓存 5 分钟 |
| `GET /whales/search` | ✅ | 300s | 搜索查询缓存 5 分钟 |
| `GET /whales/:id/sightings` | ✅ | 300s | 观测记录查询缓存 5 分钟 |
| `POST /whales` | ❌ | - | 创建操作不缓存 |
| `PUT /whales/:id` | ❌ | - | 更新操作不缓存 |
| `DELETE /whales/:id` | ❌ | - | 删除操作不缓存 |

### 缓存键

- **列表缓存:** `cache:/api/v1/whales?page=1&limit=10&...`
- **详情缓存:** `cache:/api/v1/whales/{id}`

### 缓存失效

当执行写操作时，自动清除相关缓存：

```typescript
// 创建个体 - 清除列表缓存
async create(createWhaleDto: CreateWhaleDto) {
  const result = await this.prisma.whale.create({ data: createWhaleDto });
  this.cacheInterceptor.clearCache('cache:/api/v1/whales');
  return result;
}

// 更新个体 - 清除详情 + 列表缓存
async update(id: string, updateWhaleDto: UpdateWhaleDto) {
  const result = await this.prisma.whale.update({ where: { id }, data: updateWhaleDto });
  this.cacheInterceptor.clearCache(`cache:/api/v1/whales/${id}`);
  this.cacheInterceptor.clearCache('cache:/api/v1/whales');
  return result;
}

// 删除个体 - 清除详情 + 列表缓存
async remove(id: string) {
  await this.prisma.whale.delete({ where: { id } });
  this.cacheInterceptor.clearCache(`cache:/api/v1/whales/${id}`);
  this.cacheInterceptor.clearCache('cache:/api/v1/whales');
}
```

---

## 🔐 认证与授权

### 端点权限矩阵

| 端点 | 方法 | 认证 | 最低角色 |
|------|------|------|----------|
| `/whales` | GET | ❌ 公开 | - |
| `/whales/:id` | GET | ❌ 公开 | - |
| `/whales` | POST | ✅ JWT | `researcher` |
| `/whales/:id` | PUT | ✅ JWT | `researcher` |
| `/whales/:id` | DELETE | ✅ JWT | `admin` |

### 角色定义

| 角色 | 说明 | 权限范围 |
|------|------|----------|
| `volunteer` | 志愿者 | 只读访问 |
| `researcher` | 研究员 | 读写个体数据 |
| `admin` | 管理员 | 全部权限 (包括删除) |

### 使用示例

```typescript
// 公开接口 - 无需认证
@Get()
@Public()
findAll() {
  return this.whalesService.findAll();
}

// 需要认证 - 研究员及以上
@Post()
@UseGuards(AuthGuard('jwt'))
@Roles('researcher', 'admin')
create(@Body() createWhaleDto: CreateWhaleDto) {
  return this.whalesService.create(createWhaleDto);
}

// 需要管理员权限
@Delete(':id')
@UseGuards(AuthGuard('jwt'))
@Roles('admin')
remove(@Param('id') id: string) {
  return this.whalesService.remove(id);
}
```

---

## ⚠️ 错误处理

### 常见错误

| HTTP 状态码 | 错误类型 | 说明 | 解决方案 |
|-------------|----------|------|----------|
| `400` | Bad Request | 请求参数无效 | 检查请求体字段格式 |
| `401` | Unauthorized | 未认证或 Token 过期 | 重新登录获取新 Token |
| `403` | Forbidden | 权限不足 | 使用更高权限的账号 |
| `404` | Not Found | 个体不存在 | 检查 ID 是否正确 |
| `409` | Conflict | identifier 重复 | 使用唯一的标识符 |
| `422` | Unprocessable Entity | 数据验证失败 | 检查字段验证规则 |
| `500` | Internal Server Error | 服务器错误 | 联系管理员 |

### 错误响应示例

```json
{
  "statusCode": 404,
  "message": "鲸鱼个体不存在",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 409,
  "message": "标识符 'BCX001' 已存在",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 422,
  "message": [
    {
      "field": "identifier",
      "message": "标识符不能为空"
    },
    {
      "field": "length",
      "message": "体长必须为正数"
    }
  ],
  "error": "Unprocessable Entity"
}
```

---

## 📝 最佳实践

### 1. 标识符命名规范

```typescript
// 推荐：使用有意义的编码
BCX001  // BC = 北海湾，X = 座头鲸，001 = 序号
YJW042  // YJ = 阳江，W = 蓝鲸，042 = 序号

// 避免：无意义的随机字符串
abc123
```

### 2. 生命状态更新时机

```typescript
// 观测到新个体时
await updateWhale(id, {
  lifeStatus: LifeStatus.ALIVE,
  lastSightedAt: new Date(),
  lastSightedLocation: location,
});

// 发现死亡个体时
await updateWhale(id, {
  lifeStatus: LifeStatus.DECEASED,
  lastSightedAt: discoveryDate,
  distinctiveFeatures: existingFeatures + '; 死亡原因：...',
});

// 长期未观测到 (如 6 个月)
await updateWhale(id, {
  lifeStatus: LifeStatus.MISSING,
});
```

### 3. 特征描述格式

```typescript
// 结构化描述，便于搜索和分析
distinctiveFeatures: [
  '左鳍 V 形缺口',
  '背部藤壶群呈三角形分布',
  '尾鳍边缘不规则锯齿状',
  '右侧腹部有船桨疤痕 (约 20cm)',
].join('; ');
```

### 4. 照片管理

```typescript
// 推荐：使用对象存储 + CDN
photoUrl: 'https://cdn.whale-conservation.org/photos/bcx001_20260328.jpg'

// 命名规范：{identifier}_{YYYYMMDD}_{sequence}.jpg
// 示例：bcx001_20260328_01.jpg (第一张照片)
//       bcx001_20260328_02.jpg (第二张照片)
```

---

## 🔗 与其他模块的关系

### 依赖模块

| 模块 | 关系 | 说明 |
|------|------|------|
| **Species** | 多对一 | 每个鲸鱼个体属于一个物种 |
| **Sightings** | 一对多 | 每个个体可有多条观测记录 |

### 数据流向

```
Species (物种)
    ↓ (一对多)
Whales (个体)
    ↓ (一对多)
Sightings (观测记录)
```

### 联合查询示例

```typescript
// 获取某个物种的所有个体及其观测记录
const whales = await this.whalesService.findAll({
  speciesId: 'sp-001',
  active: true,
});

// 每个 whale 对象包含：
// - whale.species: 物种信息
// - whale.sightings: 观测记录列表
```

---

## 🚀 待扩展功能

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 个体搜索 | ✅ 已完成 | 按编号/昵称/备注模糊搜索 |
| 照片上传 | 🔴 高 | 支持直接上传图片，自动存储到对象存储 |
| 迁徙轨迹 | 🟡 中 | 基于观测记录生成迁徙路径可视化 |
| 亲缘关系 | 🟡 中 | 记录母子关系、家族谱系 |
| 健康档案 | 🟢 低 | 伤病记录、治疗历史 |
| 基因数据 | 🟢 低 | DNA 样本信息、基因分析结果 |
| 批量导入 | 🟢 低 | 支持 Excel/CSV 批量导入个体数据 |
| 软删除 | 🟢 低 | 添加 deletedAt 字段，支持数据恢复 |

---

## 📚 相关文档

- [Species Module](../species/README.md) - 物种管理模块
- [Sightings Module](../sightings/README.md) - 观测记录模块
- [Auth Module](../auth/README.md) - 认证与授权
- [Common Module](../common/README.md) - 通用工具模块
- [API 使用示例](../../docs/api-examples.md) - 完整 API 调用示例

---

**模块维护者:** 鲸创项目开发团队  
**问题反馈:** https://github.com/erhch/whale-conservation/issues
