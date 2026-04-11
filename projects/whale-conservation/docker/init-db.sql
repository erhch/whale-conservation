-- 鲸创管理系统 - 数据库初始化脚本
-- 用于 TypeORM synchronize 失败时手动初始化
-- 生成方式：基于 TypeORM 实体定义

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
DO $$ BEGIN
  CREATE TYPE "user_role_enum" AS ENUM ('admin', 'researcher', 'volunteer', 'viewer');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "iucn_status_enum" AS ENUM ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add DD to existing enum if it already exists without it
DO $$ BEGIN
  ALTER TYPE "iucn_status_enum" ADD VALUE 'DD';
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "sex_enum" AS ENUM ('male', 'female', 'unknown');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "life_status_enum" AS ENUM ('alive', 'dead', 'missing');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "station_status_enum" AS ENUM ('active', 'inactive', 'maintenance');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "health_record_type_enum" AS ENUM ('checkup', 'injury', 'illness', 'treatment', 'necropsy', 'other');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "health_status_enum" AS ENUM ('healthy', 'recovering', 'critical', 'deceased');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "behavior_type_enum" AS ENUM ('breaching', 'spyhopping', 'lobtailing', 'flippering', 'fluking',
    'logging', 'milling', 'traveling', 'feeding', 'resting', 'socializing', 'vocalizing',
    'nursing', 'playing');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "behavior_intensity_enum" AS ENUM ('low', 'medium', 'high');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "feeding_method_enum" AS ENUM ('lunge', 'skim', 'bubble_net', 'bottom', 'snap', 'herding', 'straining', 'suction', 'other');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "appetite_level_enum" AS ENUM ('low', 'medium', 'high', 'very_high');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "relationship_type_enum" AS ENUM ('parent_offspring', 'sibling', 'half_sibling', 'grandparent', 'mating_pair', 'social_bond');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "confidence_level_enum" AS ENUM ('confirmed', 'likely', 'probable', 'speculated');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "clan_type_enum" AS ENUM ('resident', 'transient', 'offshore', 'coastal', 'unknown');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_type_enum" AS ENUM ('health_alert', 'behavior_anomaly', 'system_warning', 'data_quality', 'migration_event', 'general');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_priority_enum" AS ENUM ('low', 'medium', 'high', 'urgent');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_status_enum" AS ENUM ('unread', 'read', 'resolved', 'dismissed');
  EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "username" varchar(50) NOT NULL UNIQUE,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "role" "user_role_enum" NOT NULL DEFAULT 'viewer',
  "nickname" varchar(100),
  "phone" varchar(20),
  "avatarUrl" varchar(500),
  "lastLoginAt" timestamp,
  "lastLoginIp" varchar(45),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_users" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "species" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "scientificName" varchar(200) NOT NULL UNIQUE,
  "commonNameZh" varchar(200) NOT NULL,
  "commonNameEn" varchar(200),
  "description" text,
  "family" varchar(200),
  "averageLength" float,
  "averageWeight" float,
  "iucnStatus" "iucn_status_enum",
  "populationEstimate" int NOT NULL DEFAULT 0,
  "distribution" varchar(500),
  "imageUrl" varchar(500),
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_species" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "stations" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" varchar(200) NOT NULL UNIQUE,
  "code" varchar(50) NOT NULL UNIQUE,
  "latitude" float NOT NULL,
  "longitude" float NOT NULL,
  "altitude" float,
  "status" "station_status_enum" NOT NULL DEFAULT 'active',
  "description" text,
  "contactPerson" varchar(100),
  "contactPhone" varchar(20),
  "establishedAt" date,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_stations" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whales" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "identifier" varchar(100) NOT NULL UNIQUE,
  "name" varchar(200),
  "speciesId" uuid NOT NULL,
  "sex" "sex_enum",
  "estimatedAge" int,
  "length" float,
  "weight" float,
  "lifeStatus" "life_status_enum" NOT NULL DEFAULT 'alive',
  "distinctiveFeatures" text,
  "photoUrl" varchar(500),
  "firstSightedAt" timestamp,
  "lastSightedAt" timestamp,
  "sightingCount" int NOT NULL DEFAULT 0,
  "healthStatus" varchar(50),
  "notes" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_whales" PRIMARY KEY ("id"),
  CONSTRAINT "FK_whales_species" FOREIGN KEY ("speciesId") REFERENCES "species"("id")
);

CREATE TABLE IF NOT EXISTS "sightings" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whaleId" uuid NOT NULL,
  "stationId" uuid,
  "observerId" uuid,
  "sightedAt" timestamp NOT NULL DEFAULT now(),
  "latitude" float,
  "longitude" float,
  "groupSize" int,
  "notes" text,
  "photoUrls" text,
  "weather" varchar(100),
  "seaState" int,
  "waterTemp" float,
  "behavior" varchar(100),
  "isVerified" boolean NOT NULL DEFAULT false,
  "verifiedBy" uuid,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_sightings" PRIMARY KEY ("id"),
  CONSTRAINT "FK_sightings_whale" FOREIGN KEY ("whaleId") REFERENCES "whales"("id"),
  CONSTRAINT "FK_sightings_station" FOREIGN KEY ("stationId") REFERENCES "stations"("id"),
  CONSTRAINT "FK_sightings_observer" FOREIGN KEY ("observerId") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "whale_health_records" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whaleId" uuid NOT NULL,
  "type" "health_record_type_enum" NOT NULL,
  "status" "health_status_enum" NOT NULL DEFAULT 'healthy',
  "title" varchar(200) NOT NULL,
  "description" text,
  "diagnosis" text,
  "treatment" text,
  "medication" varchar(200),
  "veterinarian" varchar(100),
  "location" varchar(200),
  "recordedAt" timestamp NOT NULL DEFAULT now(),
  "photos" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_whale_health_records" PRIMARY KEY ("id"),
  CONSTRAINT "FK_whale_health_records_whale" FOREIGN KEY ("whaleId") REFERENCES "whales"("id")
);

CREATE TABLE IF NOT EXISTS "behavior_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whaleId" uuid NOT NULL,
  "sightingId" uuid,
  "behaviorType" "behavior_type_enum" NOT NULL,
  "intensity" "behavior_intensity_enum" NOT NULL DEFAULT 'medium',
  "duration" int,
  "depth" float,
  "notes" text,
  "associatedWhales" text,
  "photoUrls" text,
  "videoUrls" text,
  "groupSize" int,
  "isVerified" boolean NOT NULL DEFAULT false,
  "recordedAt" timestamp NOT NULL DEFAULT now(),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_behavior_logs" PRIMARY KEY ("id"),
  CONSTRAINT "FK_behavior_logs_whale" FOREIGN KEY ("whaleId") REFERENCES "whales"("id"),
  CONSTRAINT "FK_behavior_logs_sighting" FOREIGN KEY ("sightingId") REFERENCES "sightings"("id")
);

CREATE TABLE IF NOT EXISTS "feeding_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whaleId" uuid NOT NULL,
  "sightingId" uuid,
  "feedingMethod" "feeding_method_enum" NOT NULL,
  "appetiteLevel" "appetite_level_enum" NOT NULL DEFAULT 'medium',
  "preyType" varchar(100),
  "preyCount" int,
  "duration" int,
  "depth" float,
  "waterTemp" float,
  "latitude" float,
  "longitude" float,
  "notes" text,
  "associatedWhales" text,
  "groupFeeding" boolean,
  "photoUrls" text,
  "videoUrls" text,
  "isVerified" boolean NOT NULL DEFAULT false,
  "recordedAt" timestamp NOT NULL DEFAULT now(),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_feeding_logs" PRIMARY KEY ("id"),
  CONSTRAINT "FK_feeding_logs_whale" FOREIGN KEY ("whaleId") REFERENCES "whales"("id"),
  CONSTRAINT "FK_feeding_logs_sighting" FOREIGN KEY ("sightingId") REFERENCES "sightings"("id")
);

CREATE TABLE IF NOT EXISTS "genealogy_records" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whale_id" uuid NOT NULL,
  "related_whale_id" uuid NOT NULL,
  "relationshipType" "relationship_type_enum" NOT NULL,
  "confidence" "confidence_level_enum" NOT NULL DEFAULT 'speculated',
  "establishedAt" timestamp,
  "evidence" text,
  "recorded_by_id" uuid,
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_genealogy_records" PRIMARY KEY ("id"),
  CONSTRAINT "FK_genealogy_whale" FOREIGN KEY ("whale_id") REFERENCES "whales"("id"),
  CONSTRAINT "FK_genealogy_related" FOREIGN KEY ("related_whale_id") REFERENCES "whales"("id"),
  CONSTRAINT "FK_genealogy_recorder" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "whale_pedigree" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "whale_id" uuid NOT NULL UNIQUE,
  "mother_id" uuid,
  "father_id" uuid,
  "clan" "clan_type_enum",
  "matriline" varchar(100),
  "geneticProfile" varchar(100),
  "mitochondrialHaplotype" varchar(100),
  "microsatelliteProfile" varchar(100),
  "photoIdConfidence" float,
  "geneticNotes" text,
  "lastGeneticSampleDate" timestamp,
  "sampleType" varchar(100),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_whale_pedigree" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_whale_pedigree_whale" UNIQUE ("whale_id"),
  CONSTRAINT "FK_pedigree_whale" FOREIGN KEY ("whale_id") REFERENCES "whales"("id"),
  CONSTRAINT "FK_pedigree_mother" FOREIGN KEY ("mother_id") REFERENCES "whales"("id"),
  CONSTRAINT "FK_pedigree_father" FOREIGN KEY ("father_id") REFERENCES "whales"("id")
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid,
  "action" varchar(50) NOT NULL,
  "entityType" varchar(100) NOT NULL,
  "entityId" varchar(100) NOT NULL,
  "changes" text,
  "ipAddress" varchar(45),
  "userAgent" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "type" "notification_type_enum" NOT NULL,
  "priority" "notification_priority_enum" NOT NULL DEFAULT 'medium',
  "status" "notification_status_enum" NOT NULL DEFAULT 'unread',
  "title" varchar(200) NOT NULL,
  "content" text,
  "entityType" varchar(100),
  "entityId" varchar(100),
  "userId" uuid,
  "resolvedAt" timestamp,
  "resolvedBy" uuid,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "environment_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "stationId" uuid NOT NULL,
  "recordedAt" timestamptz NOT NULL DEFAULT now(),
  "waterTemp" float,
  "salinity" float,
  "ph" float,
  "dissolvedOxygen" float,
  "turbidity" float,
  "windSpeed" float,
  "windDirection" varchar(50),
  "airTemp" float,
  "humidity" float,
  "visibility" float,
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "PK_environment_logs" PRIMARY KEY ("id"),
  CONSTRAINT "FK_env_logs_station" FOREIGN KEY ("stationId") REFERENCES "stations"("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IDX_whales_species" ON "whales"("speciesId");
CREATE INDEX IF NOT EXISTS "IDX_whales_lifeStatus" ON "whales"("lifeStatus");
CREATE INDEX IF NOT EXISTS "IDX_whales_sex" ON "whales"("sex");
CREATE INDEX IF NOT EXISTS "IDX_whales_identifier" ON "whales"("identifier");
CREATE INDEX IF NOT EXISTS "IDX_sightings_whale" ON "sightings"("whaleId");
CREATE INDEX IF NOT EXISTS "IDX_sightings_station" ON "sightings"("stationId");
CREATE INDEX IF NOT EXISTS "IDX_sightings_sightedAt" ON "sightings"("sightedAt");
CREATE INDEX IF NOT EXISTS "IDX_health_records_whale" ON "whale_health_records"("whaleId");
CREATE INDEX IF NOT EXISTS "IDX_behavior_logs_whale" ON "behavior_logs"("whaleId");
CREATE INDEX IF NOT EXISTS "IDX_feeding_logs_whale" ON "feeding_logs"("whaleId");
CREATE INDEX IF NOT EXISTS "IDX_genealogy_whale" ON "genealogy_records"("whale_id");
CREATE INDEX IF NOT EXISTS "IDX_audit_entity" ON "audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IDX_notifications_user" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "IDX_notifications_status" ON "notifications"("status");
CREATE INDEX IF NOT EXISTS "IDX_env_logs_station" ON "environment_logs"("stationId");
CREATE INDEX IF NOT EXISTS "IDX_env_logs_recordedAt" ON "environment_logs"("recordedAt");

-- Seed data: admin user (password: admin123 - should be changed)
INSERT INTO "users" ("id", "username", "email", "password", "role", "nickname", "isActive")
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@whale.org', '$2b$10$dummy_password_hash_change_me', 'admin', '系统管理员', true)
ON CONFLICT ("username") DO NOTHING;

-- Seed data: species
INSERT INTO "species" ("scientificName", "commonNameZh", "commonNameEn", "family", "iucnStatus", "populationEstimate", "distribution") VALUES
  ('Balaenoptera musculus', '蓝鲸', 'Blue Whale', 'Balaenopteridae', 'EN', 10000, '全球海洋'),
  ('Megaptera novaeangliae', '座头鲸', 'Humpback Whale', 'Balaenopteridae', 'LC', 80000, '全球海洋'),
  ('Orcinus orca', '虎鲸', 'Killer Whale', 'Delphinidae', 'DD', 50000, '全球海洋'),
  ('Eschrichtius robustus', '灰鲸', 'Gray Whale', 'Eschrichtiidae', 'LC', 27000, '北太平洋'),
  ('Eubalaena glacialis', '北大西洋露脊鲸', 'North Atlantic Right Whale', 'Balaenidae', 'CR', 366, '北大西洋'),
  ('Balaenoptera physalus', '长须鲸', 'Fin Whale', 'Balaenopteridae', 'VU', 100000, '全球海洋'),
  ('Physeter macrocephalus', '抹香鲸', 'Sperm Whale', 'Physeteridae', 'VU', 300000, '全球海洋'),
  ('Delphinapterus leucas', '白鲸', 'Beluga Whale', 'Monodontidae', 'NT', 150000, '北极及亚北极'),
  ('Monodon monoceros', '一角鲸', 'Narwhal', 'Monodontidae', 'LC', 80000, '北极'),
  ('Balaenoptera acutorostrata', '小须鲸', 'Minke Whale', 'Balaenopteridae', 'LC', 500000, '全球海洋'),
  ('Balaenoptera borealis', '塞鲸', 'Sei Whale', 'Balaenopteridae', 'EN', 50000, '全球海洋'),
  ('Balaena mysticetus', '弓头鲸', 'Bowhead Whale', 'Balaenidae', 'LC', 10000, '北极'),
  ('Kogia breviceps', '小抹香鲸', 'Pygmy Sperm Whale', 'Kogiidae', 'LC', 10000, '热带及温带海洋'),
  ('Ziphius cavirostris', '柯氏喙鲸', 'Cuviers Beaked Whale', 'Ziphiidae', 'LC', 10000, '全球深海'),
  ('Tursiops truncatus', '宽吻海豚', 'Common Bottlenose Dolphin', 'Delphinidae', 'LC', 10000, '全球温带及热带'),
  ('Globicephala melas', '长肢领航鲸', 'Long-finned Pilot Whale', 'Delphinidae', 'DD', 10000, '全球温带及寒带'),
  ('Grampus griseus', '灰海豚', 'Rissos Dolphin', 'Delphinidae', 'LC', 10000, '全球温带及热带'),
  ('Balaenoptera omurai', '角岛鲸', 'Omuras Whale', 'Balaenopteridae', 'DD', 100, '印度洋-太平洋'),
  ('Caperea marginata', '小露脊鲸', 'Pygmy Right Whale', 'Cetotheriidae', 'DD', 100, '南半球温带')
ON CONFLICT DO NOTHING;

-- Seed data: stations
INSERT INTO "stations" ("name", "code", "latitude", "longitude", "status", "description") VALUES
  ('南海观测站', 'NH-001', 18.5, 110.0, 'active', '南海北部鲸类观测站'),
  ('东海观测站', 'DH-001', 28.0, 122.0, 'active', '东海鲸类观测站'),
  ('黄海观测站', 'HH-001', 36.0, 122.0, 'active', '黄海鲸类观测站'),
  ('台湾海峡观测站', 'TW-001', 24.0, 118.0, 'active', '台湾海峡鲸类观测站'),
  ('北部湾观测站', 'BW-001', 20.0, 108.0, 'active', '北部湾鲸类观测站')
ON CONFLICT ("code") DO NOTHING;
