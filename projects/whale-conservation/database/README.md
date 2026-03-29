# Database - 数据库架构与种子数据

本目录包含鲸创管理系统的数据库迁移脚本和种子数据。

## 📁 目录结构

```
database/
├── migrations/          # 数据库迁移脚本 (DDL)
│   └── 001_initial_schema.sql
├── seeds/               # 种子数据 (DML)
│   └── 001_initial_data.sql
└── README.md            # 本文件
```

## 🗄️ 数据库技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **主数据库** | PostgreSQL 15+ | 关系型数据存储 |
| **空间扩展** | PostGIS 3.x | 地理位置数据存储 (GEOGRAPHY 类型) |
| **时序扩展** | TimescaleDB 2.x | 时间序列数据优化 (环境日志) |
| **UUID 支持** | uuid-ossp | UUID 主键生成 |

## 📋 数据表概览

### 核心业务表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `species` | 鲸鱼物种 | scientific_name, iucn_status, population_trend |
| `whales` | 鲸鱼个体 | identifier, name, species_id, sex, birth_date |
| `sightings` | 观测记录 | whale_id, station_id, observed_at, behavior, group_size |
| `stations` | 监测站点 | name, location (GEOGRAPHY), station_type, status |

### 系统表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户账户 | username, email, role, password_hash |
| `environment_log` | 环境日志 | station_id, recorded_at, water_temperature, ph_level |

### 扩展表 (TimescaleDB)

| 表名 | 说明 |  hypertable |
|------|------|-------------|
| `environment_log` | 环境监测时序数据 | ✅ 按 recorded_at 分区 |

## 🔧 数据库扩展

```sql
-- 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID 主键
CREATE EXTENSION IF NOT EXISTS "postgis";        -- 地理空间数据
CREATE EXTENSION IF NOT EXISTS "timescaledb";    -- 时序数据优化
```

## 📦 迁移脚本

### 001_initial_schema.sql

**文件大小:** ~12KB  
**创建日期:** 2026-03-27

**包含内容:**

1. **基础表结构** (6 张表)
   - species (物种)
   - users (用户)
   - stations (监测站点)
   - whales (鲸鱼个体)
   - sightings (观测记录)
   - environment_log (环境日志)

2. **索引定义**
   - 主键索引 (UUID)
   - 外键索引
   - 业务查询索引 (species_id, station_id, observed_at 等)
   - 空间索引 (GIST on location)

3. **TimescaleDB hypertable**
   - environment_log 按 recorded_at 分区

4. **审计触发器**
   - updated_at 自动更新时间戳

**执行方式:**

```bash
# 通过初始化脚本执行
./scripts/init-db.sh

# 或手动执行
psql -U whale_admin -d whale_conservation -f database/migrations/001_initial_schema.sql
```

## 🌱 种子数据

### 001_initial_data.sql

**文件大小:** ~11KB  
**创建日期:** 2026-03-27

**包含内容:**

1. **物种数据** (5 种鲸鱼)
   - 蓝鲸 (Blue Whale) - EN (濒危)
   - 座头鲸 (Humpback Whale) - LC (无危)
   - 虎鲸 (Orca) - DD (数据不足)
   - 抹香鲸 (Sperm Whale) - VU (易危)
   - 灰鲸 (Gray Whale) - LC (无危)

2. **监测站点** (3 个站点)
   - ST001 - 东海监测站 (固定浮标)
   - ST002 - 南海考察船 (移动船只)
   - ST003 - 黄海浮标站 (固定浮标)

3. **测试用户** (3 个角色)
   - admin / admin@whale.org (管理员)
   - researcher / researcher@whale.org (研究员)
   - volunteer / volunteer@whale.org (志愿者)

4. **鲸鱼个体** (10 只鲸鱼)
   - 包含不同物种、性别、年龄的样本数据

5. **观测记录** (50 条)
   - 模拟真实观测场景
   - 包含行为、群体大小、环境条件等

6. **环境日志** (100 条)
   - 每小时记录一次
   - 水温、盐度、PH 值、溶解氧等

**执行方式:**

```bash
# 通过初始化脚本执行 (推荐)
./scripts/init-db.sh

# 或手动执行 (确保迁移已完成)
psql -U whale_admin -d whale_conservation -f database/seeds/001_initial_data.sql
```

## 🚀 快速开始

### 使用 Docker Compose (推荐)

```bash
# 启动数据库服务
cd docker
docker compose up -d postgres

# 等待数据库就绪
sleep 5

# 运行初始化脚本
cd ..
./scripts/init-db.sh
```

### 手动初始化

```bash
# 1. 创建数据库
createdb -U postgres whale_conservation

# 2. 执行迁移
psql -U postgres -d whale_conservation -f database/migrations/001_initial_schema.sql

# 3. 加载种子数据
psql -U postgres -d whale_conservation -f database/seeds/001_initial_data.sql

# 4. 验证数据
psql -U postgres -d whale_conservation -c "SELECT COUNT(*) FROM species;"
psql -U postgres -d whale_conservation -c "SELECT COUNT(*) FROM whales;"
psql -U postgres -d whale_conservation -c "SELECT COUNT(*) FROM sightings;"
```

## 📊 数据字典

详细字段说明请参考项目根目录的 [`docs/data-dictionary.md`](../docs/data-dictionary.md)

## 🔍 常用查询

### 查看物种列表

```sql
SELECT scientific_name, common_name->>'zh' AS chinese_name, iucn_status
FROM species
ORDER BY scientific_name;
```

### 查看监测站点分布

```sql
SELECT 
    station_type,
    COUNT(*) AS count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count
FROM stations
GROUP BY station_type;
```

### 查看最近观测记录

```sql
SELECT 
    s.observed_at,
    w.identifier AS whale_id,
    w.name AS whale_name,
    sp.common_name->>'zh' AS species,
    s.behavior,
    s.group_size,
    st.name AS station_name
FROM sightings s
JOIN whales w ON s.whale_id = w.id
JOIN species sp ON w.species_id = sp.id
LEFT JOIN stations st ON s.station_id = st.id
ORDER BY s.observed_at DESC
LIMIT 10;
```

### 查看环境数据趋势 (TimescaleDB)

```sql
SELECT 
    time_bucket('1 hour', recorded_at) AS hour,
    AVG(water_temperature) AS avg_temp,
    AVG(ph_level) AS avg_ph
FROM environment_log
WHERE recorded_at > NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;
```

## ⚠️ 注意事项

1. **执行顺序**: 必须先执行迁移脚本，再执行种子数据
2. **数据清理**: 重新执行种子数据前，建议清空现有数据 (TRUNCATE)
3. **生产环境**: 生产环境应使用独立的迁移工具 (如 TypeORM migrations)
4. **备份**: 修改迁移脚本前，务必备份现有数据库

## 📝 新增迁移

当需要修改数据库架构时:

1. 创建新的迁移文件 `database/migrations/002_xxx.sql`
2. 编写增量变更 SQL (ALTER TABLE, CREATE INDEX 等)
3. 更新 `scripts/init-db.sh` 包含新迁移
4. 在团队内同步迁移脚本

## 🔗 相关文档

- [API 设计文档](../docs/api-design.md)
- [数据字典](../docs/data-dictionary.md)
- [快速开始指南](../docs/common-quickstart.md)

---

*最后更新：2026-03-29*
