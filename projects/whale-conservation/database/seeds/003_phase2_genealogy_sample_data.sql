-- ============================================
-- 鲸创管理系统 - Phase 2 谱系种子数据
-- Seed: 003_phase2_genealogy_sample_data
-- Created: 2026-04-05
-- ============================================

-- ============================================
-- 1. 个体谱系信息种子数据
-- ============================================

-- 假设 whales 表中已有至少3条记录
-- BCX001 (母), BCX002 (父), BCX003 (子)

INSERT INTO whale_pedigree (whale_id, mother_id, father_id, clan, matriline, genetic_profile, mitochondrial_haplotype, microsatellite_profile, photo_id_confidence, last_genetic_sample_date, sample_type)
VALUES 
    -- BCX001: 母鲸，定居族群 A 谱系
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), NULL, NULL, 'resident', 'A-001', 'GP-2026-001', 'mtH-A1', 'MS-001-A1-B2-C3-D4', 0.95, '2026-03-15', 'biopsy'),
    -- BCX002: 公鲸，定居族群 B 谱系
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), NULL, NULL, 'resident', 'B-001', 'GP-2026-002', 'mtH-B1', 'MS-002-A3-B1-C2-D1', 0.88, '2026-03-18', 'skin'),
    -- BCX003: 子鲸，继承母系 A 谱系
    ((SELECT id FROM whales LIMIT 1 OFFSET 2), 
     (SELECT id FROM whales LIMIT 1 OFFSET 0),  -- mother = BCX001
     (SELECT id FROM whales LIMIT 1 OFFSET 1),  -- father = BCX002
     'resident', 'A-001', 'GP-2026-003', 'mtH-A1', 'MS-003-A1-B1-C3-D2', 0.92, '2026-03-20', 'feces');

-- ============================================
-- 2. 谱系关系记录种子数据
-- ============================================

-- BCX001 与 BCX003: 母子关系（基因确认）
INSERT INTO genealogy_records (whale_id, related_whale_id, relationship_type, confidence, established_at, evidence, recorded_by_id, notes)
VALUES 
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM whales LIMIT 1 OFFSET 2), 
     'parent_offspring', 'confirmed', '2026-03-20 10:00:00+08', 
     '基因检测确认：线粒体单倍型匹配 (mtH-A1)，微卫星位点50%吻合', 
     (SELECT id FROM users LIMIT 1), 
     'BCX001 为 BCX003 之母，2025年产仔后持续观察确认'),
    
    -- BCX002 与 BCX003: 父子关系（高度可能）
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), (SELECT id FROM whales LIMIT 1 OFFSET 2), 
     'parent_offspring', 'likely', '2026-03-20 10:00:00+08', 
     '微卫星位点分析：父系位点匹配度75%，待进一步基因确认', 
     (SELECT id FROM users LIMIT 1),
     'BCX002 为 BCX003 之父，交配期行为观测吻合'),

    -- BCX001 与 BCX002: 配偶关系（推测）
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM whales LIMIT 1 OFFSET 1), 
     'mating_pair', 'speculated', '2026-03-20 10:00:00+08', 
     '2025年繁殖季多次观测到两者同行，但无直接交配证据', 
     (SELECT id FROM users LIMIT 1),
     'BCX001 与 BCX002 在2025年11月-12月频繁结伴出现');

-- ============================================
-- 3. 验证数据
-- ============================================

SELECT 'Pedigree Records: ' || COUNT(*) FROM whale_pedigree
UNION ALL
SELECT 'Genealogy Relationships: ' || COUNT(*) FROM genealogy_records;
