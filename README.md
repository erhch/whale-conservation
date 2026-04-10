# 🐋 鲸创管理系统 (Whale Conservation Management System)

> 一套面向野外鲸类科研团队的个体追踪与保护管理平台

**版本:** 4.0.0  
**状态:** 核心 API 已完成 ✅  
**技术栈:** NestJS · PostgreSQL · TypeORM · Swagger  
**许可证:** MIT  
**仓库:** [github.com/erhch/whale-conservation](https://github.com/erhch/whale-conservation)

---

## 📋 项目概述

鲸创管理系统是一个为鲸类野外科研团队设计的开源平台，提供：

- 鲸鱼个体全生命周期档案管理
- 观测数据录入与行为追踪
- 健康监测与医疗记录
- 觅食行为分析与猎物记录
- 谱系关系与家谱树追踪
- 种群统计与趋势分析
- 数据导入/导出 (CSV/JSON)
- 全局搜索与多条件筛选
- 审计日志与批量操作

本项目参考 [Wildbook](https://www.wildme.org/) 和 [Happywhale](https://happywhale.com/) 的设计理念，但采用更轻量的架构，专注核心科研需求。

---

## 📦 模块总览

### Phase 1: 基础架构 (7 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `auth` | `/auth` | JWT + RBAC 认证授权 |
| `species` | `/species` | 物种管理 |
| `whales` | `/whales` | 鲸鱼个体管理 |
| `sightings` | `/sightings` | 观测记录 |
| `stations` | `/stations` | 监测站点 |
| `stats` | `/stats` | 统计分析 (Phase 1) |
| `environment` | `/environment` | 环境数据 |

### Phase 2: 个体追踪 (4 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `whale-health` | `/whale-health` | 健康/医疗记录（6种类型） |
| `behavior-logs` | `/behavior-logs` | 行为日志（14种行为类型） |
| `feeding-logs` | `/feeding-logs` | 觅食记录（9种觅食方式） |
| `genealogy` | `/genealogy` | 谱系管理（家谱树、族群、基因） |

### Phase 3: 数据报表 (3 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `stats` (扩展) | `/stats` | 综合报表 (9个分析API) |
| `export` | `/export` | 数据导出 (CSV/JSON, 5个端点) |
| `import` | `/import` | 数据导入 (CSV, 3个端点) |

### Phase 4: 搜索与过滤 (1 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `search` | `/search` | 全局搜索 + 多条件筛选 (6个端点) |

### Phase 5: 审计与合规 (1 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `audit` | `/audit` | 审计日志 + 自动拦截器 (3个端点) |

### Phase 6: 批量管理 (1 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `batch` | `/batch` | 批量操作 (6个端点) |

### Phase 7: 通知与告警 (1 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `notifications` | `/notifications` | 通知/告警系统 (创建、列表、标记已读) |

### Phase 8: 管理后台 (2 个模块)

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| `admin` | `/admin` | 管理后台 API（用户管理、系统配置） |
| `health` | `/health` | 健康检查 + 详细指标 |

---

## 📊 API 统计

| Phase | 模块数 | API 端点 | 状态 |
|-------|--------|----------|------|
| Phase 1 | 7 | ~30 | ✅ 完成 |
| Phase 2 | 4 | ~20 | ✅ 完成 |
| Phase 3 | 3 | 17 | ✅ 完成 |
| Phase 4 | 1 | 6 | ✅ 完成 |
| Phase 5 | 1 | 3 | ✅ 完成 |
| Phase 6 | 1 | 6 | ✅ 完成 |
| Phase 7 | 1 | ~5 | ✅ 完成 |
| Phase 8 | 2 | ~8 | ✅ 完成 |
| **总计** | **20** | **~95** | **✅** |

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

| 文件 | 说明 | 状态 |
|------|------|------|
| `001_initial_schema.sql` | 初始架构（用户、物种、鲸鱼、观测、环境） | ✅ |
| `002_phase2_individual_tracking.sql` | Phase 2 个体追踪（健康、行为、觅食） | ✅ |
| `003_phase2_genealogy.sql` | Phase 2 谱系管理（关系、家谱、基因） | ✅ |
| `004_phase5_audit.sql` | Phase 5 审计日志 | ✅ |
| `005_phase7_notifications.sql` | Phase 7 通知/告警 | ✅ |

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
        ├── WhalePedigree (谱系信息)
        │     ├── mother → Whale
        │     └── father → Whale
        └── AuditLog (审计日志)

Station (监测站点)
  └── Sighting (观测记录)
       └── Environment (环境数据 - TimescaleDB)
```

---

## 🔍 搜索能力

- **全局搜索**: 跨所有模块的全文搜索
- **鲸鱼搜索**: 按编号/名称/特征 + 物种/性别/状态筛选
- **健康搜索**: 按标题/描述 + 类型/状态/日期范围
- **行为搜索**: 按行为类型 + 强度 + 日期 + 验证状态
- **觅食搜索**: 按觅食方式 + 猎物 + 日期
- **谱系搜索**: 按关系类型 + 置信度

---

## 📤 数据导出/导入

### 导出格式
- CSV (带 BOM，Excel 兼容)
- JSON (结构化)

### 可导出数据
- 健康记录、行为日志、觅食记录、谱系记录、鲸鱼个体档案

### 导入支持
- CSV 批量导入健康/行为/觅食记录
- 逐行错误报告

---

## 🔒 安全特性

- JWT 认证 + RBAC 权限控制
- 审计日志自动记录所有写操作
- 批量操作安全检查（关联数据保护）
- 数据导出权限控制

---

## 🗺️ 后续规划

| Phase | 内容 | 优先级 |
|-------|------|--------|
| Phase 9 | 前端管理后台 (Vue3/React) | 高 |
| Phase 10 | 移动端 App | 中 |
| Phase 11 | 照片识别 / AI 个体匹配 | 中 |
| Phase 12 | API 开放平台 | 低 |

---

## 🤝 贡献

欢迎 Fork 并提交 PR！

---

## 📝 开发者

- 维护者: [erhch](https://github.com/erhch)
