-- ============================================
-- 鲸创管理系统 - Phase 2 数据架构
-- Migration: 002_phase2_individual_tracking
-- Created: 2026-04-04
-- Modules: whale-health, behavior-logs, feeding-logs
-- ============================================

-- ============================================
-- 1. 鲸鱼健康记录表
-- ============================================

-- 健康记录类型枚举
DO $$ BEGIN
    CREATE TYPE health_record_type AS ENUM (
        'checkup',     -- 常规体检
        'injury',      -- 受伤
        'illness',     -- 疾病
        'treatment',   -- 治疗
        'rescue',      -- 救援
        'autopsy'      -- 尸检
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 健康状态枚举
DO $$ BEGIN
    CREATE TYPE health_status AS ENUM (
        'pending',
        'ongoing',
        'recovered',
        'critical',
        'deceased'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS whale_health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    type health_record_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    vet_name VARCHAR(100),
    status health_status DEFAULT 'pending',
    record_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200),
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_health_whale ON whale_health_records(whale_id);
CREATE INDEX idx_health_type ON whale_health_records(type);
CREATE INDEX idx_health_status ON whale_health_records(status);
CREATE INDEX idx_health_date ON whale_health_records(record_date DESC);

-- ============================================
-- 2. 鲸鱼行为日志表
-- ============================================

-- 行为类型枚举
DO $$ BEGIN
    CREATE TYPE behavior_type AS ENUM (
        'surfacing',            -- 浮出水面
        'diving',               -- 潜水
        'breaching',            -- 跃身击浪
        'lobtailing',           -- 尾鳍拍水
        'flipper_slapping',     -- 胸鳍拍水
        'spy_hopping',          -- 垂直探身
        'feeding',              -- 觅食
        'resting',              -- 休息
        'social',               -- 社交
        'ventral',              -- 腹部展示
        'traveling',            -- 游动
        'mating',               -- 交配
        'care_giving',          -- 照顾幼崽
        'other'                 -- 其他
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 行为强度枚举
DO $$ BEGIN
    CREATE TYPE behavior_intensity AS ENUM (
        'low',
        'moderate',
        'high'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    observer_id UUID NOT NULL REFERENCES users(id),
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    behaviors behavior_type[] DEFAULT '{}',
    intensity behavior_intensity DEFAULT 'moderate',
    duration INTEGER,              -- 持续时间 (秒)
    depth NUMERIC,                 -- 深度 (米)
    speed NUMERIC,                 -- 游速 (km/h)
    direction NUMERIC,             -- 游向 (角度 0-360)
    group_size INTEGER,            -- 同群体个体数
    associated_whales UUID[],      -- 同群体其他鲸鱼 ID
    notes TEXT,
    photo_urls TEXT[],
    video_urls TEXT[],
    water_temp NUMERIC,            -- 水温
    visibility NUMERIC,            -- 能见度 (米)
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_behavior_whale ON behavior_logs(whale_id);
CREATE INDEX idx_behavior_observer ON behavior_logs(observer_id);
CREATE INDEX idx_behavior_date ON behavior_logs(observed_at DESC);
CREATE INDEX idx_behavior_verified ON behavior_logs(is_verified) WHERE is_verified = false;
CREATE INDEX idx_behavior_behaviors ON behavior_logs USING GIN(behaviors);

-- ============================================
-- 3. 鲸鱼觅食记录表
-- ============================================

-- 觅食方式枚举
DO $$ BEGIN
    CREATE TYPE feeding_method AS ENUM (
        'lunge_feeding',      -- 冲击式进食
        'skim_feeding',       -- 滤食性滑行
        'bubble_net',         -- 气泡网捕食
        'bottom_feeding',     -- 底部觅食
        'sideswimming',       -- 侧游捕食
        'tail_lob_feeding',   -- 尾击驱赶
        'cooperative',        -- 合作捕食
        'surface_skimming',   -- 水面滤食
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 食欲评估枚举
DO $$ BEGIN
    CREATE TYPE appetite_level AS ENUM (
        'none',
        'low',
        'moderate',
        'high'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS feeding_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    observer_id UUID NOT NULL REFERENCES users(id),
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    methods feeding_method[] DEFAULT '{}',
    appetite appetite_level DEFAULT 'moderate',
    prey_species VARCHAR(200),
    prey_density VARCHAR(100),
    feeding_duration INTEGER,        -- 进食时长 (分钟)
    feeding_depth NUMERIC,           -- 进食深度 (米)
    group_feeding BOOLEAN,
    associated_whales UUID[],
    water_temp NUMERIC,
    latitude NUMERIC CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC CHECK (longitude BETWEEN -180 AND 180),
    notes TEXT,
    photo_urls TEXT[],
    video_urls TEXT[],
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feeding_whale ON feeding_logs(whale_id);
CREATE INDEX idx_feeding_observer ON feeding_logs(observer_id);
CREATE INDEX idx_feeding_date ON feeding_logs(observed_at DESC);
CREATE INDEX idx_feeding_methods ON feeding_logs USING GIN(methods);

-- ============================================
-- 4. 扩展 whales 表字段 (与 Entity 对齐)
-- ============================================

-- 添加缺失的字段（如果不存在）
DO $$ BEGIN
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS identifier VARCHAR(50) UNIQUE;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS estimated_age INTEGER;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS length NUMERIC;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS weight NUMERIC;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS distinctive_features TEXT;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS photo_url TEXT;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS first_sighted_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS last_sighted_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS last_sighted_location VARCHAR(200);
    ALTER TABLE whales ADD COLUMN IF NOT EXISTS life_status VARCHAR(20) DEFAULT 'alive';
EXCEPTION
    WHEN OTHER THEN null;
END $$;

-- ============================================
-- 5. 添加注释
-- ============================================

COMMENT ON TABLE whale_health_records IS '鲸鱼健康/医疗记录表';
COMMENT ON TABLE behavior_logs IS '鲸鱼行为日志表 - 记录日常行为模式';
COMMENT ON TABLE feeding_logs IS '鲸鱼觅食记录表 - 记录觅食行为和猎物信息';
