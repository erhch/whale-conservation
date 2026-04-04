# 🐋 鲸创管理系统 (Whale Conservation Management System)

> 一套面向野外鲸类科研团队的个体追踪与保护管理平台

**版本:** 2.0.0  
**状态:** Phase 2 开发中  
**技术栈:** NestJS · PostgreSQL · TypeORM · Swagger  
**许可证:** MIT

---

## 📋 项目概述

鲸创管理系统是一个为鲸类野外科研团队设计的开源平台，提供：

- 鲸鱼个体全生命周期档案管理
- 观测数据录入与行为追踪
- 健康监测与医疗记录
- 觅食行为分析与猎物记录
- 谱系关系与家谱树追踪
- 种群统计与趋势分析

本项目参考 [Wildbook](https://www.wildme.org/) 和 [Happywhale](https://happywhale.com/) 的设计理念，但采用更轻量的架构，专注核心科研需求。

---

## 📦 Phase 2 模块概览

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `whale-health` | `/whale-health` | 健康/医疗记录（体检、受伤、治疗等） |
| `behavior-logs` | `/behavior-logs` | 行为日志（14种行为类型、强度、参数） |
| `feeding-logs` | `/feeding-logs` | 觅食记录（9种觅食方式、猎物追踪） |
| `genealogy` | `/genealogy` | 谱系管理（家谱树、族群归属、基因档案） |

### 已完成的 Phase 1 模块

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `auth` | `/auth` | JWT + RBAC 认证 |
| `species` | `/species` | 物种管理 |
| `whales` | `/whales` | 鲸鱼个体管理 |
| `sightings` | `/sightings` | 观测记录 |
| `stations` | `/stations` | 监测站点 |
| `stats` | `/stats` | 统计分析 |
| `environment` | `/environment` | 环境数据 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+ (with PostGIS, TimescaleDB)
- Docker (推荐)

### 安装

```bash
cd projects/whale-conservation/src
npm install

# 配置环境变量
cp .env.example .env

# 数据库迁移
npm run migration:run

# 种子数据
npm run seed:run

# 启动
npm run start:dev
```

### API 文档

启动后访问: `http://localhost:3000/api` (Swagger UI)

---

## 🗄️ 数据库架构

迁移文件位于 `database/migrations/`:

| 文件 | 说明 |
|------|------|
| `001_initial_schema.sql` | 初始架构（用户、物种、鲸鱼、观测、环境） |
| `002_phase2_individual_tracking.sql` | Phase 2 个体追踪（健康、行为、觅食） |
| `003_phase2_genealogy.sql` | Phase 2 谱系管理（关系、家谱、基因） |

种子数据位于 `database/seeds/`:

| 文件 | 说明 |
|------|------|
| `001_initial_data.sql` | 初始数据（物种、用户） |
| `002_phase2_sample_data.sql` | Phase 2 示例数据（健康、行为、觅食） |
| `003_phase2_genealogy_sample_data.sql` | Phase 2 谱系示例数据 |

---

## 📊 数据模型关系

```
Species (物种)
  └── Whale (个体)
        ├── Sighting (观测记录)
        ├── HealthRecord (健康记录)
        ├── BehaviorLog (行为日志)
        ├── FeedingLog (觅食记录)
        ├── GenealogyRecord (谱系关系) ←→ Whale (自引用)
        └── WhalePedigree (谱系信息)
              ├── mother → Whale
              └── father → Whale
```

---

## 🤝 贡献

欢迎 Fork 并提交 PR！

---

## 📝 开发者

- 维护者: [erhch](https://github.com/erhch)
