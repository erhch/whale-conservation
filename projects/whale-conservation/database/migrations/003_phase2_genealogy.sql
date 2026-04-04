-- ============================================
-- 鲸创管理系统 - Phase 2 谱系数据架构
-- Migration: 003_phase2_genealogy
-- Created: 2026-04-05
-- ============================================

-- ============================================
-- 1. 谱系关系记录表
-- ============================================

-- 关系类型枚举
DO $$ BEGIN
    CREATE TYPE relationship_type AS ENUM (
        'parent_offspring',    -- 亲子
        'sibling',             -- 兄弟姐妹
        'half_sibling',        -- 同父异母/同母异父
        'grandparent',         -- 祖孙
        'mating_pair',         -- 配偶
        'social_bond'          -- 社交纽带
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 关系置信度枚举
DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM (
        'confirmed',    -- 基因确认
        'likely',       -- 高度可能
        'probable',     -- 可能
        'speculated'    -- 推测
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 族群分类枚举
DO $$ BEGIN
    CREATE TYPE clan_type AS ENUM (
        'resident',     -- 定居族群
        'transient',    -- 临时族群
        'offshore',     -- 远洋族群
        'coastal',      -- 近岸族群
        'unknown'       -- 未知
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS genealogy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    related_whale_id UUID NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    confidence confidence_level DEFAULT 'speculated',
    established_at TIMESTAMP WITH TIME ZONE,
    evidence TEXT,
    recorded_by_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- 防止重复关系（同一对鲸鱼的同种关系只记录一次）
    CONSTRAINT unique_relationship UNIQUE (whale_id, related_whale_id, relationship_type)
);

CREATE INDEX idx_genealogy_whale ON genealogy_records(whale_id);
CREATE INDEX idx_genealogy_related ON genealogy_records(related_whale_id);
CREATE INDEX idx_genealogy_type ON genealogy_records(relationship_type);
CREATE INDEX idx_genealogy_confidence ON genealogy_records(confidence);

-- ============================================
-- 2. 个体谱系信息表
-- ============================================

CREATE TABLE IF NOT EXISTS whale_pedigree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whale_id UUID UNIQUE NOT NULL REFERENCES whales(id) ON DELETE CASCADE,
    mother_id UUID REFERENCES whales(id),
    father_id UUID REFERENCES whales(id),
    clan clan_type,
    matriline VARCHAR(50),
    genetic_profile VARCHAR(100),
    mitochondrial_haplotype VARCHAR(50),
    microsatellite_profile VARCHAR(200),
    photo_id_confidence NUMERIC CHECK (photo_id_confidence BETWEEN 0 AND 1),
    genetic_notes TEXT,
    last_genetic_sample_date DATE,
    sample_type VARCHAR(50),     -- skin, biopsy, feces
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pedigree_mother ON whale_pedigree(mother_id);
CREATE INDEX idx_pedigree_father ON whale_pedigree(father_id);
CREATE INDEX idx_pedigree_clan ON whale_pedigree(clan);
CREATE INDEX idx_pedigree_matriline ON whale_pedigree(matriline);

-- ============================================
-- 3. 添加注释
-- ============================================

COMMENT ON TABLE genealogy_records IS '鲸鱼谱系关系记录表 - 追踪个体间的家族关系';
COMMENT ON TABLE whale_pedigree IS '鲸鱼个体谱系信息表 - 父母关系、族群归属、基因档案';
