# 数据库设计文档

## 概述

本系统采用混合数据库架构：
- **PostgreSQL + PostGIS**: 核心业务数据、空间数据
- **MongoDB**: 文档型数据（观测记录、日志）
- **Redis**: 缓存、会话
- **TimescaleDB**: 时序数据（环境传感器数据）

---

## 核心表结构

### 1. 鲸鱼个体表 (`whales`)

```sql
CREATE TABLE whales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),                    -- 个体名称/编号
    species_id UUID REFERENCES species(id), -- 物种
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown')),
    birth_date DATE,                      -- 估计出生日期
    status VARCHAR(20) DEFAULT 'alive',   -- alive, deceased, missing
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 照片识别索引
CREATE INDEX idx_whales_photos ON whales USING gin(photo_features);
```

### 2. 物种表 (`species`)

```sql
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name VARCHAR(200),             -- 常用名（多语言）
    scientific_name VARCHAR(200) NOT NULL, -- 学名
    iucn_status VARCHAR(20),              -- IUCN 保护级别
    population_trend VARCHAR(20),         -- 种群趋势
    description TEXT
);
```

### 3. 观测记录表 (`sightings`)

```sql
CREATE TABLE sightings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whale_id UUID REFERENCES whales(id),  -- 观测到的鲸鱼
    observer_id UUID REFERENCES users(id), -- 观测者
    sighting_time TIMESTAMP NOT NULL,
    location GEOGRAPHY(POINT, 4326),      -- GPS 坐标
    behavior TEXT,                        -- 行为描述
    weather_conditions JSONB,             -- 天气条件
    photos TEXT[],                        -- 照片 URL 数组
    created_at TIMESTAMP DEFAULT NOW()
);

-- 空间索引
CREATE INDEX idx_sightings_location ON sightings USING gist(location);
-- 时间索引
CREATE INDEX idx_sightings_time ON sightings(sighting_time);
```

### 4. 迁徙轨迹表 (`migrations`)

```sql
CREATE TABLE migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whale_id UUID REFERENCES whales(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    route GEOGRAPHY(LINESTRING, 4326),    -- 迁徙路线
    distance_km NUMERIC,                  -- 总距离
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. 栖息地表 (`habitats`)

```sql
CREATE TABLE habitats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200),
    boundary GEOGRAPHY(POLYGON, 4326),    -- 保护区边界
    habitat_type VARCHAR(50),             -- 类型
    protection_level VARCHAR(50),         -- 保护级别
    area_km2 NUMERIC,
    established_date DATE
);
```

### 6. 环境监测表 (`environment_logs`)

```sql
-- 使用 TimescaleDB 扩展
CREATE TABLE environment_logs (
    time TIMESTAMPTZ NOT NULL,
    station_id UUID REFERENCES stations(id),
    temperature NUMERIC,                  -- 水温
    salinity NUMERIC,                     -- 盐度
    ph NUMERIC,                           -- PH 值
    dissolved_oxygen NUMERIC,             -- 溶解氧
    noise_level NUMERIC                   -- 噪音水平
);

-- 转换为 hypertable
SELECT create_hypertable('environment_logs', 'time');
```

### 7. 用户表 (`users`)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'volunteer', -- admin, researcher, volunteer, donor
    organization VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8. 捐赠表 (`donations`)

```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES users(id),
    amount NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    donation_type VARCHAR(50),            -- one_time, monthly, whale_adoption
    payment_status VARCHAR(20),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ER 图

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   species   │───┬───│    whales    │───┬───│  sightings  │
└─────────────┘   │   └──────────────┘   │   └─────────────┘
                  │                      │
                  │   ┌──────────────┐   │   ┌─────────────┐
                  └───│  migrations  │   └───│   users     │
                      └──────────────┘       └─────────────┘
                             │
                      ┌──────────────┐
                      │   habitats   │
                      └──────────────┘
```

---

## 数据字典

详见 `docs/data-dictionary.md`
