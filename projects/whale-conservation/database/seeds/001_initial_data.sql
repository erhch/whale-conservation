-- ============================================
-- 鲸创管理系统 - 初始种子数据
-- Seed: 001_initial_data
-- Created: 2026-03-27
-- 用途：开发/演示环境的基础数据
-- ============================================

-- ============================================
-- 1. 物种数据 (中国海域常见鲸类)
-- ============================================

INSERT INTO species (common_name, scientific_name, iucn_status, population_trend, description) VALUES
-- 须鲸科
('{"zh": "蓝鲸", "en": "Blue Whale"}', 'Balaenoptera musculus', 'EN', 'increasing', '地球上现存最大的动物，体长可达 30 米，重达 180 吨。主要以磷虾为食。'),
('{"zh": "长须鲸", "en": "Fin Whale"}', 'Balaenoptera physalus', 'VU', 'increasing', '世界第二大鲸类，体长可达 26 米。游泳速度快，被称为"海洋灵缇"。'),
('{"zh": "座头鲸", "en": "Humpback Whale"}', 'Megaptera novaeangliae', 'LC', 'increasing', '以其优美的歌声和跃出水面行为闻名。胸鳍极长，可达体长的三分之一。'),
('{"zh": "小须鲸", "en": "Minke Whale"}', 'Balaenoptera acutorostrata', 'LC', 'stable', '体型较小的须鲸，体长 7-10 米。在中国海域较为常见。'),
('{"zh": "布氏鲸", "en": "Bryde''s Whale"}', 'Balaenoptera edeni', 'DD', 'unknown', '热带和亚热带海域的鲸类，体长 11-14 米。头部有三条明显的脊。'),
('{"zh": "塞鲸", "en": "Sei Whale"}', 'Balaenoptera borealis', 'EN', 'increasing', '体型与长须鲸相似但较小，体长 12-16 米。游泳速度极快。'),

-- 齿鲸科
('{"zh": "抹香鲸", "en": "Sperm Whale"}', 'Physeter macrocephalus', 'VU', 'stable', '最大的齿鲸，以大王乌贼为食。头部巨大，含有鲸脑油。'),
('{"zh": "虎鲸", "en": "Orca/Killer Whale"}', 'Orcinus orca', 'DD', 'stable', '海豚科最大的成员，顶级掠食者。具有复杂的社会结构和文化传承。'),
('{"zh": "短肢领航鲸", "en": "Short-finned Pilot Whale"}', 'Globicephala macrorhynchus', 'LC', 'stable', '体长 5-7 米，高度社会化，常群体活动。'),
('{"zh": "伪虎鲸", "en": "False Killer Whale"}', 'Pseudorca crassidens', 'DD', 'unknown', '体长 4-6 米，全身黑色，与虎鲸外形相似但体型较小。'),

-- 海豚科
('{"zh": "中华白海豚", "en": "Indo-Pacific Humpback Dolphin"}', 'Sousa chinensis', 'VU', 'decreasing', '中国国家一级保护动物，成年后呈粉红色。主要分布在东南沿海。'),
('{"zh": "瓶鼻海豚", "en": "Bottlenose Dolphin"}', 'Tursiops truncatus', 'LC', 'stable', '最常见的海豚种类，智商极高，广泛分布于温带和热带海域。'),
('{"zh": "斑海豚", "en": "Spotted Dolphin"}', 'Stenella attenuata', 'LC', 'increasing', '体侧有斑点，体长 2-2.5 米。常与金枪鱼群一起活动。'),

-- 其他
('{"zh": "江豚", "en": "Finless Porpoise"}', 'Neophocaena asiaeorientalis', 'CR', 'decreasing', '长江特有物种，无背鳍，体长 1.5-2 米。极度濒危。');

-- ============================================
-- 2. 测试用户数据
-- ============================================

-- 注意：实际使用时密码应使用 bcrypt 等算法加密
-- 这里使用占位符，实际部署时需替换为真实哈希值

INSERT INTO users (username, email, password_hash, role, organization, is_active) VALUES
('admin', 'admin@whale-conservation.org', '$2b$10$placeholder_admin_hash', 'admin', '鲸创管理中心', true),
('researcher_zhang', 'zhang@whale-conservation.org', '$2b$10$placeholder_researcher_hash', 'researcher', '海洋大学鲸类研究所', true),
('volunteer_li', 'li@whale-conservation.org', '$2b$10$placeholder_volunteer_hash', 'volunteer', '蓝色海洋志愿者协会', true),
('donor_wang', 'wang@whale-conservation.org', '$2b$10$placeholder_donor_hash', 'donor', '个人捐赠者', true);

-- ============================================
-- 3. 监测站点数据 (中国沿海)
-- ============================================

INSERT INTO stations (name, location, station_type, status, installed_date, metadata) VALUES
('南海北部监测站', ST_GeogFromText('POINT(113.2806 22.1167)'), 'buoy', 'active', '2025-06-15', '{"depth_m": 50, "equipment": ["hydrophone", "temperature_sensor", "camera"]}'),
('东海舟山监测站', ST_GeogFromText('POINT(122.1067 30.0667)'), 'shore', 'active', '2025-03-20', '{"depth_m": 30, "equipment": ["hydrophone", "radar"]}'),
('黄海青岛监测站', ST_GeogFromText('POINT(120.3826 36.0671)'), 'ship', 'active', '2025-09-10', '{"depth_m": 40, "equipment": ["hydrophone", "sonar", "camera"]}'),
('渤海湾监测站', ST_GeogFromText('POINT(118.5000 38.5000)'), 'buoy', 'maintenance', '2024-12-01', '{"depth_m": 25, "equipment": ["hydrophone"], "maintenance_note": "设备升级中"}'),
('台湾海峡监测站', ST_GeogFromText('POINT(119.5000 24.5000)'), 'satellite', 'active', '2026-01-15', '{"depth_m": 80, "equipment": ["satellite_tag_receiver", "hydrophone"]}'),
('北部湾监测站', ST_GeogFromText('POINT(108.5000 20.0000)'), 'shore', 'active', '2025-08-01', '{"depth_m": 35, "equipment": ["hydrophone", "camera", "weather_station"]}');

-- ============================================
-- 4. 鲸鱼个体示例数据
-- ============================================

-- 获取蓝鲸的 species_id
DO $$
DECLARE
    blue_whale_id UUID;
    humpback_whale_id UUID;
    chinese_white_dolphin_id UUID;
BEGIN
    SELECT id INTO blue_whale_id FROM species WHERE scientific_name = 'Balaenoptera musculus';
    SELECT id INTO humpback_whale_id FROM species WHERE scientific_name = 'Megaptera novaeangliae';
    SELECT id INTO chinese_white_dolphin_id FROM species WHERE scientific_name = 'Sousa chinensis';

    -- 蓝鲸个体
    INSERT INTO whales (name, species_id, sex, birth_date, status, health_status, photo_features) VALUES
    ('蓝 -001 "深蓝"', blue_whale_id, 'male', '2018-05-20', 'alive', '健康', '{"dorsal_fin": "unique_pattern_001", "body_length_m": 24.5, "weight_tons": 120}'),
    ('蓝 -002 "海洋之心"', blue_whale_id, 'female', '2020-03-15', 'alive', '健康 - 怀孕', '{"dorsal_fin": "unique_pattern_002", "body_length_m": 22.0, "weight_tons": 100}'),
    ('蓝 -003', blue_whale_id, 'unknown', '2022-07-10', 'alive', '健康', '{"dorsal_fin": "unique_pattern_003", "body_length_m": 18.0, "weight_tons": 80}');

    -- 座头鲸个体
    INSERT INTO whales (name, species_id, sex, birth_date, status, health_status, photo_features) VALUES
    ('座 -001 "歌手"', humpback_whale_id, 'male', '2019-02-28', 'alive', '健康', '{"dorsal_fin": "serrated_001", "fluke_pattern": "unique_001", "body_length_m": 14.0}'),
    ('座 -002 "舞者"', humpback_whale_id, 'female', '2021-06-12', 'alive', '健康', '{"dorsal_fin": "serrated_002", "fluke_pattern": "unique_002", "body_length_m": 13.5}'),
    ('座 -003', humpback_whale_id, 'male', '2017-04-05', 'deceased', '死亡 - 船击', '{"dorsal_fin": "serrated_003", "fluke_pattern": "unique_003", "body_length_m": 15.0, "death_date": "2025-11-20"}');

    -- 中华白海豚个体
    INSERT INTO whales (name, species_id, sex, birth_date, status, health_status, photo_features) VALUES
    ('白 -001 "粉红"', chinese_white_dolphin_id, 'female', '2020-08-15', 'alive', '健康', '{"spot_pattern": "dense", "body_length_m": 2.3, "color": "pink"}'),
    ('白 -002 "小白"', chinese_white_dolphin_id, 'male', '2022-04-20', 'alive', '健康', '{"spot_pattern": "medium", "body_length_m": 2.1, "color": "light_pink"}'),
    ('白 -003', chinese_white_dolphin_id, 'unknown', '2023-09-10', 'missing', '未知', '{"spot_pattern": "sparse", "body_length_m": 1.8, "color": "gray", "last_seen": "2025-06-15"}');
END $$;

-- ============================================
-- 5. 观测记录示例
-- ============================================

DO $$
DECLARE
    whale_001_id UUID;
    researcher_id UUID;
    station_id UUID;
BEGIN
    SELECT id INTO whale_001_id FROM whales WHERE name LIKE '蓝 -001%';
    SELECT id INTO researcher_id FROM users WHERE role = 'researcher' LIMIT 1;
    SELECT id INTO station_id FROM stations WHERE name = '南海北部监测站';

    INSERT INTO sightings (whale_id, observer_id, sighting_time, location, behavior, weather_conditions, notes) VALUES
    (whale_001_id, researcher_id, '2026-03-25 09:30:00', ST_GeogFromText('POINT(113.5 22.3)'), '觅食，缓慢游动', '{"wind": 2, "visibility": "excellent", "sea_state": 1, "temperature_c": 24}', '观察到 3 次浮出水面呼吸，伴有明显喷水'),
    (whale_001_id, researcher_id, '2026-03-26 14:15:00', ST_GeogFromText('POINT(113.6 22.4)'), '休息，几乎静止', '{"wind": 1, "visibility": "good", "sea_state": 0, "temperature_c": 25}', '个体在水面下约 5 米处静止，持续约 30 分钟');
END $$;

-- ============================================
-- 6. 栖息地示例数据
-- ============================================

INSERT INTO habitats (name, habitat_type, location, area_km2, protection_level, description) VALUES
('南海北部鲸类保护区', 'feeding_ground', ST_GeogFromText('POLYGON((113.0 22.0, 114.5 22.0, 114.5 23.0, 113.0 23.0, 113.0 22.0))'), 15000, 'national', '重要的蓝鲸和座头鲸觅食区，磷虾资源丰富'),
('东海舟山渔场外围', 'migration_route', ST_GeogFromText('POLYGON((121.5 29.5, 123.0 29.5, 123.0 31.0, 121.5 31.0, 121.5 29.5))'), 22000, 'provincial', '多种鲸类的季节性迁徙通道'),
('珠江口中华白海豚保护区', 'breeding_ground', ST_GeogFromText('POLYGON((113.5 22.0, 114.0 22.0, 114.0 22.5, 113.5 22.5, 113.5 22.0))'), 8000, 'national', '中华白海豚重要繁殖区，国家一级保护区'),
('台湾海峡迁徙走廊', 'migration_route', ST_GeogFromText('POLYGON((118.0 23.0, 120.5 23.0, 120.5 26.0, 118.0 26.0, 118.0 23.0))'), 45000, 'cross_strait', '连接南海和东海的重要迁徙通道');

-- ============================================
-- 7. 威胁因素示例数据
-- ============================================

DO $$
DECLARE
    habitat_id UUID;
BEGIN
    SELECT id INTO habitat_id FROM habitats WHERE name = '南海北部鲸类保护区';

    INSERT INTO threats (habitat_id, threat_type, severity, description, source, mitigation_status) VALUES
    (habitat_id, 'shipping', 'high', '繁忙的国际航运线路，船只撞击风险高', 'AIS 船舶追踪数据', 'monitoring'),
    (habitat_id, 'fishing', 'medium', '商业捕捞活动，存在渔网缠绕风险', '渔业管理部门', 'regulation'),
    (habitat_id, 'pollution', 'medium', '海洋塑料污染和化学污染物', '环境监测报告', 'cleanup_ongoing'),
    (habitat_id, 'noise', 'high', '航运噪音和水下施工噪音干扰', '声学监测', 'research_needed');
END $$;

-- ============================================
-- 数据插入完成
-- ============================================

-- 验证数据
SELECT '物种数据' as category, COUNT(*) as count FROM species
UNION ALL
SELECT '用户数据', COUNT(*) FROM users
UNION ALL
SELECT '监测站点', COUNT(*) FROM stations
UNION ALL
SELECT '鲸鱼个体', COUNT(*) FROM whales
UNION ALL
SELECT '观测记录', COUNT(*) FROM sightings
UNION ALL
SELECT '栖息地', COUNT(*) FROM habitats
UNION ALL
SELECT '威胁因素', COUNT(*) FROM threats;
