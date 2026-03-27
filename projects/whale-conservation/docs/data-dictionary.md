# 数据字典

> 生物鲸创管理系统 - 完整数据字段定义

版本：v0.1.0  
最后更新：2026-03-27

---

## 1. 核心业务表

### 1.1 物种表 (species)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `550e8400-e29b-41d4-a716-446655440000` |
| common_name | VARCHAR(200) | 是 | 常用名（支持多语言） | `蓝鲸`, `Blue Whale` |
| scientific_name | VARCHAR(200) | 是 | 学名（拉丁文） | `Balaenoptera musculus` |
| iucn_status | VARCHAR(20) | 否 | IUCN 保护级别 | `EN` (濒危), `VU` (易危), `LC` (无危) |
| population_trend | VARCHAR(20) | 否 | 种群趋势 | `increasing`, `decreasing`, `stable` |
| description | TEXT | 否 | 物种描述 | 详细介绍文本 |

**IUCN 状态代码说明：**
- `EX` - 野外灭绝 (Extinct in the Wild)
- `EW` - 野外灭绝 (Extinct in the Wild)
- `CR` - 极危 (Critically Endangered)
- `EN` - 濒危 (Endangered)
- `VU` - 易危 (Vulnerable)
- `NT` - 近危 (Near Threatened)
- `LC` - 无危 (Least Concern)

---

### 1.2 鲸鱼个体表 (whales)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `6ba7b810-9dad-11d1-80b4-00c04fd430c8` |
| name | VARCHAR(100) | 否 | 个体名称/编号 | `蓝-001`, `Echo` |
| species_id | UUID | 是 | 外键 → species.id | `550e8400-e29b-41d4-a716-446655440000` |
| sex | VARCHAR(10) | 否 | 性别 | `male`, `female`, `unknown` |
| birth_date | DATE | 否 | 估计出生日期 | `2020-05-15` |
| status | VARCHAR(20) | 是 | 生命状态 | `alive`, `deceased`, `missing` |
| photo_features | JSONB | 否 | 照片识别特征向量 | `{"dorsal_fin": "...", "fluke_pattern": "..."}` |
| created_at | TIMESTAMP | 是 | 创建时间 | `2026-03-27 10:00:00` |
| updated_at | TIMESTAMP | 是 | 更新时间 | `2026-03-27 14:30:00` |

**状态说明：**
- `alive` - 存活
- `deceased` - 已确认死亡
- `missing` - 失踪（超过 6 个月未观测到）

---

### 1.3 观测记录表 (sightings)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `6ba7b811-9dad-11d1-80b4-00c04fd430c8` |
| whale_id | UUID | 否 | 外键 → whales.id（可群体观测） | `6ba7b810-9dad-11d1-80b4-00c04fd430c8` |
| observer_id | UUID | 是 | 外键 → users.id | `user-uuid` |
| sighting_time | TIMESTAMP | 是 | 观测时间 | `2026-03-27 09:30:00` |
| location | GEOGRAPHY(POINT) | 是 | GPS 坐标 | `POINT(121.4737 31.2304)` |
| behavior | TEXT | 否 | 行为描述 | `觅食`, `跃出水面`, `社交` |
| weather_conditions | JSONB | 否 | 天气条件 | `{"wind": 3, "visibility": "good", "sea_state": 2}` |
| photos | TEXT[] | 否 | 照片 URL 数组 | `["https://...", "https://..."]` |
| notes | TEXT | 否 | 备注 | 其他观察记录 |
| created_at | TIMESTAMP | 是 | 创建时间 | `2026-03-27 10:00:00` |

**海况等级 (sea_state)：**
- 0 - 平静如镜
- 1 - 波纹
- 2 - 小浪
- 3 - 中浪
- 4 - 大浪
- 5+ - 不适合观测

---

### 1.4 迁徙轨迹表 (migrations)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `mig-uuid` |
| whale_id | UUID | 是 | 外键 → whales.id | `whale-uuid` |
| start_time | TIMESTAMP | 是 | 迁徙开始时间 | `2026-01-15 08:00:00` |
| end_time | TIMESTAMP | 否 | 迁徙结束时间 | `2026-03-20 16:00:00` |
| route | GEOGRAPHY(LINESTRING) | 是 | 迁徙路线 | `LINESTRING(...)` |
| distance_km | NUMERIC | 否 | 总距离（公里） | `5420.5` |
| stopover_sites | JSONB | 否 | 停留点列表 | `[{"location": "...", "duration_days": 3}]` |
| created_at | TIMESTAMP | 是 | 创建时间 | `2026-03-27 10:00:00` |

---

### 1.5 栖息地表 (habitats)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `habitat-uuid` |
| name | VARCHAR(200) | 是 | 栖息地名称 | `南海北部保护区` |
| boundary | GEOGRAPHY(POLYGON) | 是 | 保护区边界 | `POLYGON(...)` |
| habitat_type | VARCHAR(50) | 是 | 栖息地类型 | `breeding`, `feeding`, `migration_corridor` |
| protection_level | VARCHAR(50) | 否 | 保护级别 | `national`, `provincial`, `international` |
| area_km2 | NUMERIC | 否 | 面积（平方公里） | `12500.0` |
| established_date | DATE | 否 | 设立日期 | `2015-06-08` |
| managing_org | VARCHAR(200) | 否 | 管理机构 | `中国渔政` |
| restrictions | TEXT | 否 | 限制说明 | 禁航区、禁渔区等说明 |

**栖息地类型：**
- `breeding` - 繁殖区
- `feeding` - 觅食区
- `migration_corridor` - 迁徙通道
- `nursery` - 育幼区

---

## 2. 环境监测表

### 2.1 监测站点表 (stations)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `station-uuid` |
| name | VARCHAR(200) | 是 | 站点名称 | `南海浮标站-01` |
| location | GEOGRAPHY(POINT) | 是 | 站点坐标 | `POINT(115.0 18.0)` |
| station_type | VARCHAR(50) | 是 | 站点类型 | `buoy`, `shore`, `ship`, `satellite` |
| depth_m | NUMERIC | 否 | 水深（米） | `150.5` |
| installed_date | DATE | 否 | 安装日期 | `2025-01-10` |
| status | VARCHAR(20) | 是 | 运行状态 | `active`, `maintenance`, `offline` |

---

### 2.2 环境日志表 (environment_logs) - TimescaleDB

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| time | TIMESTAMPTZ | 是 | 时间戳（分区键） | `2026-03-27 10:00:00+08` |
| station_id | UUID | 是 | 外键 → stations.id | `station-uuid` |
| temperature | NUMERIC | 否 | 水温（°C） | `22.5` |
| salinity | NUMERIC | 否 | 盐度（PSU） | `34.8` |
| ph | NUMERIC | 否 | PH 值 | `8.1` |
| dissolved_oxygen | NUMERIC | 否 | 溶解氧（mg/L） | `6.5` |
| noise_level | NUMERIC | 否 | 噪音水平（dB） | `95.2` |
| current_speed | NUMERIC | 否 | 流速（m/s） | `0.8` |
| current_direction | NUMERIC | 否 | 流向（度） | `135` |

**采样频率：** 每 10 分钟一次

---

## 3. 用户与权限表

### 3.1 用户表 (users)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `user-uuid` |
| username | VARCHAR(50) | 是 | 用户名（唯一） | `researcher_zhang` |
| email | VARCHAR(255) | 是 | 邮箱（唯一） | `zhang@example.org` |
| password_hash | VARCHAR(255) | 是 | 密码哈希 | `bcrypt:...` |
| role | VARCHAR(20) | 是 | 角色 | `admin`, `researcher`, `volunteer`, `donor` |
| organization | VARCHAR(200) | 否 | 所属机构 | `XX 大学海洋学院` |
| phone | VARCHAR(20) | 否 | 联系电话 | `+86-138-0000-0000` |
| created_at | TIMESTAMP | 是 | 注册时间 | `2026-01-15 10:00:00` |
| last_login | TIMESTAMP | 否 | 最后登录 | `2026-03-27 09:00:00` |

**角色权限说明：**
- `admin` - 系统管理员，全部权限
- `researcher` - 研究人员，可录入/编辑观测数据
- `volunteer` - 志愿者，可提交观测记录（需审核）
- `donor` - 捐赠者，仅查看公开数据和捐赠记录

---

### 3.2 角色权限表 (roles)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `role-uuid` |
| role_name | VARCHAR(50) | 是 | 角色名称 | `researcher` |
| permissions | JSONB | 是 | 权限列表 | `["sightings:create", "sightings:edit", ...]` |
| description | TEXT | 否 | 角色描述 | 详细说明 |

---

## 4. 捐赠与财务表

### 4.1 捐赠表 (donations)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `donation-uuid` |
| donor_id | UUID | 是 | 外键 → users.id | `donor-uuid` |
| amount | NUMERIC | 是 | 捐赠金额 | `500.00` |
| currency | VARCHAR(3) | 是 | 货币类型 | `CNY`, `USD`, `EUR` |
| donation_type | VARCHAR(50) | 是 | 捐赠类型 | `one_time`, `monthly`, `whale_adoption` |
| payment_status | VARCHAR(20) | 是 | 支付状态 | `pending`, `completed`, `failed`, `refunded` |
| transaction_id | VARCHAR(100) | 否 | 支付平台交易号 | `wx_...`, `ali_...` |
| payment_method | VARCHAR(50) | 否 | 支付方式 | `wechat`, `alipay`, `credit_card` |
| adopted_whale_id | UUID | 否 | 领养鲸鱼 ID（如适用） | `whale-uuid` |
| message | TEXT | 否 | 捐赠留言 | `希望鲸鱼们平安健康` |
| created_at | TIMESTAMP | 是 | 捐赠时间 | `2026-03-27 12:00:00` |

**捐赠类型说明：**
- `one_time` - 一次性捐赠
- `monthly` - 月度定期捐赠
- `whale_adoption` - 鲸鱼领养计划（年度）

---

### 4.2 捐赠项目表 (donation_projects)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `project-uuid` |
| name | VARCHAR(200) | 是 | 项目名称 | `蓝鲸保护基金` |
| description | TEXT | 是 | 项目描述 | 详细说明 |
| goal_amount | NUMERIC | 否 | 目标金额 | `1000000.00` |
| raised_amount | NUMERIC | 否 | 已筹集金额 | `350000.00` |
| start_date | DATE | 是 | 开始日期 | `2026-01-01` |
| end_date | DATE | 否 | 结束日期 | `2026-12-31` |
| status | VARCHAR(20) | 是 | 项目状态 | `active`, `completed`, `suspended` |

---

## 5. 教育与内容表

### 5.1 科普文章表 (articles)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `article-uuid` |
| title | VARCHAR(500) | 是 | 标题 | `蓝鲸：海洋中的巨人` |
| slug | VARCHAR(200) | 是 | URL 别名 | `blue-whale-ocean-giant` |
| content | TEXT | 是 | 正文内容 | Markdown 格式 |
| excerpt | TEXT | 否 | 摘要 | 简短介绍 |
| cover_image | VARCHAR(500) | 否 | 封面图 URL | `https://...` |
| author_id | UUID | 是 | 外键 → users.id | `author-uuid` |
| category | VARCHAR(50) | 是 | 分类 | `species`, `conservation`, `news` |
| tags | TEXT[] | 否 | 标签 | `["蓝鲸", "保护", "科普"]` |
| published | BOOLEAN | 是 | 是否发布 | `true`, `false` |
| published_at | TIMESTAMP | 否 | 发布时间 | `2026-03-20 10:00:00` |
| view_count | INTEGER | 否 | 阅读量 | `1520` |

---

### 5.2 领养计划表 (whale_adoptions)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `adoption-uuid` |
| whale_id | UUID | 是 | 外键 → whales.id | `whale-uuid` |
| adopter_id | UUID | 是 | 外键 → users.id | `adopter-uuid` |
| start_date | DATE | 是 | 领养开始日期 | `2026-01-01` |
| end_date | DATE | 是 | 领养结束日期 | `2026-12-31` |
| donation_amount | NUMERIC | 是 | 领养捐赠金额 | `365.00` |
| certificate_sent | BOOLEAN | 是 | 证书是否寄出 | `true` |
| updates_sent_count | INTEGER | 否 | 已发送更新次数 | `3` |
| status | VARCHAR(20) | 是 | 状态 | `active`, `expired`, `cancelled` |

---

## 6. 系统表

### 6.1 操作日志表 (audit_logs)

| 字段名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| id | UUID | 是 | 主键 | `log-uuid` |
| user_id | UUID | 否 | 操作用户 | `user-uuid` |
| action | VARCHAR(100) | 是 | 操作类型 | `CREATE`, `UPDATE`, `DELETE` |
| entity_type | VARCHAR(50) | 是 | 实体类型 | `whale`, `sighting`, `user` |
| entity_id | UUID | 否 | 实体 ID | `entity-uuid` |
| changes | JSONB | 否 | 变更内容 | `{"field": {"old": "...", "new": "..."}}` |
| ip_address | VARCHAR(50) | 否 | IP 地址 | `192.168.1.100` |
| created_at | TIMESTAMP | 是 | 操作时间 | `2026-03-27 10:00:00` |

---

## 索引策略

### 空间索引
- 所有 GEOGRAPHY 类型字段使用 GiST 索引
- 用于空间查询（范围内、距离计算等）

### 时间索引
- 所有 TIMESTAMP 类型字段建立 B-Tree 索引
- TimescaleDB 表按时间自动分区

### 全文检索
- 文章标题、内容使用 GIN 索引支持全文搜索
- 鲸鱼名称支持模糊匹配

---

## 数据保留策略

| 数据类型 | 保留期限 | 归档策略 |
|----------|----------|----------|
| 观测记录 | 永久 | - |
| 环境日志 | 10 年 | 1 年后转冷存储 |
| 操作日志 | 5 年 | - |
| 会话数据 | 30 天 | 自动清理 |
| 临时文件 | 7 天 | 自动清理 |

---

<div align="center">
  <sub>生物鲸创管理系统 © 2026</sub>
</div>
