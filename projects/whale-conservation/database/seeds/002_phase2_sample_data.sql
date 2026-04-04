-- ============================================
-- 鲸创管理系统 - Phase 2 种子数据
-- Seed: 002_phase2_sample_data
-- Created: 2026-04-04
-- ============================================

-- 注意: 以下数据假设已存在 whales 和 users 表的种子数据
-- 需要根据实际 UUID 替换

-- ============================================
-- 1. 鲸鱼健康记录种子数据
-- ============================================

INSERT INTO whale_health_records (whale_id, type, title, description, vet_name, status, record_date, location)
VALUES 
    -- 假设 whale_id 从 001_initial_data 中的物种/鲸鱼数据获取
    -- 以下为示例，实际运行时需替换为真实 UUID
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), 'checkup', '2026年Q1常规体检', '各项指标正常，体重略有增加', 'Dr.王海洋', 'recovered', '2026-03-15 09:00:00+08', '南海观测区A'),
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), 'injury', '尾部擦伤', '与礁石摩擦导致表皮擦伤，已清洁处理', 'Dr.王海洋', 'ongoing', '2026-03-20 14:30:00+08', '南海观测区B'),
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), 'treatment', '寄生虫治疗', '体表寄生虫清理，使用安全剂量药物', 'Dr.林深蓝', 'recovered', '2026-03-10 10:00:00+08', '东海观测区C');

-- ============================================
-- 2. 鲸鱼行为日志种子数据
-- ============================================

INSERT INTO behavior_logs (whale_id, observer_id, observed_at, behaviors, intensity, duration, depth, speed, direction, group_size, notes, water_temp)
VALUES 
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-01 06:30:00+08', 
     ARRAY['surfacing', 'diving']::behavior_type[], 'moderate', 3600, 45, 8.5, 120, 3, 
     '清晨观测，规律性浮潜行为，无明显异常', 22.5),
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-01 10:15:00+08', 
     ARRAY['breaching', 'lobtailing']::behavior_type[], 'high', 120, 0, 0, 0, 1, 
     '跃身击浪2次，尾鳍拍水3次，表现活跃', 23.1),
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-01 14:00:00+08', 
     ARRAY['feeding', 'social']::behavior_type[], 'moderate', 1800, 30, 5.2, 45, 5, 
     '与4头其他鲸鱼群体觅食，磷虾群密集', 23.8),
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), '2026-04-02 07:00:00+08', 
     ARRAY['resting']::behavior_type[], 'low', 7200, 15, 1.0, 0, 2, 
     '长时间休息状态，游速极慢，与幼鲸同行', 21.9),
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), '2026-04-02 15:30:00+08', 
     ARRAY['care_giving', 'social']::behavior_type[], 'moderate', 2400, 20, 3.5, 90, 2, 
     '母鲸照看幼鲸，教幼鲸浮出水面呼吸', 22.7);

-- ============================================
-- 3. 鲸鱼觅食记录种子数据
-- ============================================

INSERT INTO feeding_logs (whale_id, observer_id, observed_at, methods, appetite, prey_species, prey_density, feeding_duration, feeding_depth, group_feeding, notes, water_temp, latitude, longitude)
VALUES 
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-01 14:00:00+08', 
     ARRAY['lunge_feeding', 'bubble_net']::feeding_method[], 'high', '南极磷虾 (Euphausia superba)', '高密度', 
     45, 35, true, '使用气泡网围捕磷虾群，连续冲击式进食12次', 23.8, 22.3, 114.5),
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-02 08:30:00+08', 
     ARRAY['skim_feeding']::feeding_method[], 'moderate', '磷虾 (Euphausia pacifica)', '中等密度', 
     30, 5, false, '水面滤食，缓慢游动张口过滤', 22.1, 22.3, 114.5),
    ((SELECT id FROM whales LIMIT 1 OFFSET 1), (SELECT id FROM users LIMIT 1), '2026-04-02 11:00:00+08', 
     ARRAY['bottom_feeding']::feeding_method[], 'low', '底栖甲壳类', '低密度', 
     20, 80, false, '底部觅食行为较少见，可能因浅层猎物不足', 21.5, 22.4, 114.6),
    ((SELECT id FROM whales LIMIT 1 OFFSET 0), (SELECT id FROM users LIMIT 1), '2026-04-03 06:45:00+08', 
     ARRAY['cooperative', 'lunge_feeding']::feeding_method[], 'high', '沙丁鱼 (Sardina pilchardus)', '高密度', 
     60, 25, true, '3头鲸鱼合作驱赶鱼群后冲击进食，效率极高', 22.8, 22.2, 114.4);

-- ============================================
-- 4. 验证数据
-- ============================================

SELECT 'Health Records: ' || COUNT(*) FROM whale_health_records
UNION ALL
SELECT 'Behavior Logs: ' || COUNT(*) FROM behavior_logs
UNION ALL
SELECT 'Feeding Logs: ' || COUNT(*) FROM feeding_logs;
