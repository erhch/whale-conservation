-- ============================================
-- 鲸创管理系统 - 初始数据库架构
-- Migration: 001_initial_schema
-- Created: 2026-03-27
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- ============================================
-- 1. 基础数据表
-- ============================================

-- 物种表
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_name JSONB NOT NULL,           -- 多语言常用名 {"zh": "蓝鲸", "en": "Blue Whale"}
    scientific_name VARCHAR(200) NOT NULL,
    iucn_status VARCHAR(20),              -- LC, NT, VU, EN, CR, EW, EX
    population_trend VARCHAR(20),         -- increasing, decreasing, stable, unknown
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'volunteer' CHECK (role IN ('admin', 'researcher', 'volunteer', 'donor')),
    organization VARCHAR(200),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 监测站点表
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    station_type VARCHAR(50),             -- buoy, shore, ship, satellite
    status VARCHAR(20) DEFAULT 'active',  -- active, maintenance, offline
    installed_date DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 核心业务表
-- ============================================

-- 鲸鱼个体表
CREATE TABLE whales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),                    -- 个体名称/编号
    species_id UUID NOT NULL REFERENCES species(id),
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown')),
    birth_date DATE,                      -- 估计出生日期
    death_date DATE,
    status VARCHAR(20) DEFAULT 'alive' CHECK (status IN ('alive', 'deceased', 'missing')),
    photo_features JSONB,                 -- 照片识别特征向量
    genetic_data JSONB,                   -- 基因数据
    health_status VARCHAR(50),
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 观测记录表
CREATE TABLE sightings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID REFERENCES whales(id),
    observer_id UUID NOT NULL REFERENCES users(id),
    sighting_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    behavior TEXT,                        -- 行为描述
    group_size INTEGER,                   -- 群体数量
    weather_conditions JSONB,             -- 天气条件 {wind, visibility, sea_state}
    water_temperature NUMERIC,
    photos TEXT[],                        -- 照片 URL 数组
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 迁徙轨迹表
CREATE TABLE migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    route GEOGRAPHY(LINESTRING, 4326),    -- 迁徙路线
    distance_km NUMERIC,
    migration_type VARCHAR(50),           -- seasonal, feeding, breeding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 栖息地表
CREATE TABLE habitats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,  -- 保护区边界
    habitat_type VARCHAR(50),             -- feeding_ground, breeding_ground, migration_route
    protection_level VARCHAR(50),         -- national_reserve, marine_park, protected_area
    area_km2 NUMERIC,
    established_date DATE,
    description TEXT,
    threats JSONB,                        -- 威胁因素
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 环境监测表 (TimescaleDB)
-- ============================================

CREATE TABLE environment_logs (
    time TIMESTAMPTZ NOT NULL,
    station_id UUID NOT NULL REFERENCES stations(id),
    temperature NUMERIC,                  -- 水温 (°C)
    salinity NUMERIC,                     -- 盐度 (PSU)
    ph NUMERIC,                           -- PH 值
    dissolved_oxygen NUMERIC,             -- 溶解氧 (mg/L)
    noise_level NUMERIC,                  -- 噪音水平 (dB)
    current_speed NUMERIC,                -- 流速 (m/s)
    current_direction NUMERIC,            -- 流向 (度)
    wave_height NUMERIC                   -- 波高 (m)
);

-- 转换为 hypertable (TimescaleDB)
SELECT create_hypertable('environment_logs', 'time');

-- ============================================
-- 4. 公众参与表
-- ============================================

-- 捐赠表
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'CNY',
    donation_type VARCHAR(50) CHECK (donation_type IN ('one_time', 'monthly', 'whale_adoption', 'project')),
    payment_status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, refunded
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    project_id UUID,                      -- 指定项目
    whale_id UUID REFERENCES whales(id),  -- 领养鲸鱼
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    receipt_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 领养计划表
CREATE TABLE whale_adoptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id),
    adopter_id UUID NOT NULL REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    certificate_sent BOOLEAN DEFAULT false,
    updates_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 科普文章表
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title JSONB NOT NULL,                 -- 多语言标题
    slug VARCHAR(200) UNIQUE NOT NULL,
    content JSONB NOT NULL,               -- 多语言内容
    author_id UUID REFERENCES users(id),
    category VARCHAR(50),                 -- news, education, research, event
    tags TEXT[],
    featured_image TEXT,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. 系统表
-- ============================================

-- 操作日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,         -- CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type VARCHAR(50),              -- whale, sighting, user, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

-- 空间索引
CREATE INDEX idx_sightings_location ON sightings USING gist(location);
CREATE INDEX idx_whales_last_seen ON whales(last_seen) WHERE status = 'alive';
CREATE INDEX idx_stations_location ON stations USING gist(location);
CREATE INDEX idx_habitats_boundary ON habitats USING gist(boundary);

-- 时间索引
CREATE INDEX idx_sightings_time ON sightings(sighting_time DESC);
CREATE INDEX idx_migrations_time ON migrations(start_time DESC);
CREATE INDEX idx_donations_created ON donations(created_at DESC);
CREATE INDEX idx_articles_published ON articles(published_at DESC) WHERE is_published = true;

-- 业务索引
CREATE INDEX idx_whales_species ON whales(species_id);
CREATE INDEX idx_whales_status ON whales(status);
CREATE INDEX idx_sightings_whale ON sightings(whale_id);
CREATE INDEX idx_sightings_observer ON sightings(observer_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_adoptions_whale ON whale_adoptions(whale_id);
CREATE INDEX idx_adoptions_adopter ON whale_adoptions(adopter_id);

-- 全文搜索索引
CREATE INDEX idx_articles_title_search ON articles USING gin(to_tsvector('simple', title));
CREATE INDEX idx_users_email_search ON users USING gin(to_tsvector('simple', email));

-- ============================================
-- 触发器 - 自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_species_updated_at BEFORE UPDATE ON species
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whales_updated_at BEFORE UPDATE ON whales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habitats_updated_at BEFORE UPDATE ON habitats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 视图
-- ============================================

-- 活跃鲸鱼概览
CREATE VIEW active_whales_summary AS
SELECT 
    w.id,
    w.name,
    s.common_name->>'zh' as species_name,
    w.sex,
    w.status,
    w.last_seen,
    age(CURRENT_DATE, w.birth_date) as estimated_age
FROM whales w
JOIN species s ON w.species_id = s.id
WHERE w.status = 'alive';

-- 最近观测记录
CREATE VIEW recent_sightings AS
SELECT 
    s.id,
    w.name as whale_name,
    s.sighting_time,
    s.location,
    s.behavior,
    u.username as observer
FROM sightings s
LEFT JOIN whales w ON s.whale_id = w.id
JOIN users u ON s.observer_id = u.id
ORDER BY s.sighting_time DESC
LIMIT 100;

-- 捐赠统计
CREATE VIEW donation_stats AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as donation_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM donations
WHERE payment_status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================
-- 初始数据
-- ============================================

-- 插入常见鲸鱼物种
INSERT INTO species (common_name, scientific_name, iucn_status, population_trend, description) VALUES
('{"zh": "蓝鲸", "en": "Blue Whale"}', 'Balaenoptera musculus', 'EN', 'increasing', '地球上现存最大的动物'),
('{"zh": "座头鲸", "en": "Humpback Whale"}', 'Megaptera novaeangliae', 'LC', 'increasing', '以其复杂的歌声和跃出水面行为闻名'),
('{"zh": "虎鲸", "en": "Orca"}', 'Orcinus orca', 'DD', 'stable', '海豚科中体型最大的物种'),
('{"zh": "抹香鲸", "en": "Sperm Whale"}', 'Physeter macrocephalus', 'VU', 'unknown', '最大的齿鲸，以深海潜水能力著称'),
('{"zh": "灰鲸", "en": "Gray Whale"}', 'Eschrichtius robustus', 'LC', 'increasing', '以其长距离迁徙闻名');

-- ============================================
-- Migration Complete
-- ============================================
