-- ============================================
-- 鲸创管理系统 - Phase 7 通知与告警
-- Migration: 005_phase7_notifications
-- Created: 2026-04-06
-- ============================================

-- 通知类型枚举
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'health_critical',       -- 健康危急
        'health_overdue',        -- 体检超期
        'behavior_anomaly',      -- 行为异常
        'sighting_unverified',   -- 未验证观测
        'whale_missing',         -- 鲸鱼失踪
        'breaching_pattern',     -- 异常行为模式
        'system'                 -- 系统通知
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 通知优先级枚举
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 通知状态枚举
DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM (
        'pending',
        'read',
        'resolved',
        'dismissed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    status notification_status DEFAULT 'pending',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    user_id UUID,
    created_by VARCHAR(100),
    metadata JSONB,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_priority ON notifications(priority);
CREATE INDEX idx_notif_status ON notifications(status);
CREATE INDEX idx_notif_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_date ON notifications(created_at DESC);

-- 复合索引：防止重复告警（实体+类型+待处理）
CREATE UNIQUE INDEX idx_notif_unique_active 
    ON notifications(entity_type, entity_id, type) 
    WHERE status = 'pending';

COMMENT ON TABLE notifications IS '通知/告警表 - 关键事件自动告警系统';
