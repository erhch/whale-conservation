-- ============================================
-- 鲸创管理系统 - Phase 5 审计日志
-- Migration: 004_phase5_audit
-- Created: 2026-04-05
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'export')),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_metadata ON audit_logs USING GIN(metadata);

COMMENT ON TABLE audit_logs IS '审计日志表 - 记录所有数据变更操作';
