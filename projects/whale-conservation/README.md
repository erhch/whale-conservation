# 🐋 生物鲸创管理系统

> 鲸类保护公益组织管理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

## 📖 项目简介

生物鲸创管理系统是一个为鲸类保护公益组织设计的综合管理平台，类似于 WWF（世界自然基金会）的专业管理系统。系统旨在帮助保护组织高效管理鲸鱼种群数据、栖息地监测、研究数据、志愿者网络和公众教育活动。

## 🎯 核心目标

- 🐋 **种群保护**：追踪鲸鱼个体和种群动态
- 🗺️ **栖息地监测**：保护海洋生态环境
- 📊 **科学研究**：支持鲸类生物学研究
- 👥 **社区参与**：连接志愿者和捐赠者
- 📱 **公众教育**：提高保护意识

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     生物鲸创管理系统                        │
├─────────────────────────────────────────────────────────────┤
│  📱 前端层                                                   │
│  Web App (Vue3/React) │ 移动端 │ 管理后台                   │
├─────────────────────────────────────────────────────────────┤
│  🔌 API 网关                                                 │
│  RESTful API │ GraphQL │ WebSocket (实时数据)               │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ 服务层                                                   │
│  ├─ 种群管理   ├─ 栖息地监测   ├─ 研究数据                  │
│  ├─ 志愿者管理 ├─ 捐赠系统     ├─ 教育中心                  │
│  └─ 数据分析   ├─ 报告生成     └─ 权限管理                  │
├─────────────────────────────────────────────────────────────┤
│  💾 数据层                                                   │
│  PostgreSQL (关系数据) │ MongoDB (文档) │ Redis (缓存)       │
│  MinIO/S3 (图片/视频) │ TimescaleDB (时序数据)              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 核心模块

### 1. 鲸鱼种群数据库 🐋
- 个体识别（照片识别、基因/DNA 数据）
- 迁徙轨迹追踪（GPS/卫星标签数据）
- 种群数量统计与趋势分析
- 健康状态评估

### 2. 栖息地监测 🗺️
- 海洋环境数据采集（水温、盐度、PH 值）
- 人类活动影响评估（航运、捕捞、油气开采）
- 保护区划界与管理
- 生态风险评估

### 3. 研究数据管理 📊
- 观测记录标准化录入
- 学术论文与文献库
- 合作机构数据共享
- 统计分析工具集成

### 4. 志愿者/捐赠者管理 👥
- 会员注册与档案管理
- 捐赠追踪与财务报告
- 活动组织与报名
- 志愿者时长统计

### 5. 公众教育中心 📱
- 科普内容管理（文章、视频、互动内容）
- "领养一只鲸"计划
- 社交媒体集成
- 在线问答与直播

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|----------|
| **前端** | Vue 3 / React, TypeScript, TailwindCSS, Mapbox GL |
| **后端** | Node.js (NestJS) / Python (FastAPI) |
| **数据库** | PostgreSQL, MongoDB, Redis, TimescaleDB |
| **存储** | MinIO / AWS S3 |
| **GIS** | PostGIS, GeoServer, Mapbox |
| **部署** | Docker, Kubernetes, GitHub Actions |
| **监控** | Prometheus, Grafana, ELK Stack |

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- Node.js 20+ (后端开发)
- npm 或 pnpm

### 一键启动开发环境

```bash
# 克隆项目
git clone https://github.com/erhch/whale-conservation.git
cd whale-conservation

# 启动所有服务 (PostgreSQL, Redis, MinIO, Adminer)
./scripts/start-dev.sh
```

启动后可访问：
- **Adminer (数据库管理)**: http://localhost:8080
- **MinIO Console (对象存储)**: http://localhost:9001
- **PostgreSQL**: localhost:5432

### 手动启动 Docker 服务

```bash
cd docker
docker compose up -d
```

### 初始化数据库

```bash
# 运行数据库初始化和种子数据
./scripts/init-db.sh
```

### 启动后端 API

```bash
# 进入后端目录
cd src

# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 启动开发服务器
npm run start:dev
```

启动后可访问：
- **API 端点**: http://localhost:3000/api/v1
- **Swagger 文档**: http://localhost:3000/api/docs

### 查看服务日志

```bash
cd docker
docker compose logs -f
```

### 停止服务

```bash
cd docker
docker compose down
```

## 📅 开发路线图

### Phase 1 - 基础架构 (2026 Q2) ✅
- [x] 项目脚手架搭建
- [x] 数据库设计与建模
- [x] 数据字典文档
- [x] 数据库迁移脚本
- [x] API 设计文档
- [x] 数据库初始化脚本
- [x] Docker 开发环境配置
- [x] NestJS 后端脚手架
- [x] 用户认证模块 (JWT + RBAC)
- [x] 基础 CRUD API (Species, Whales, Sightings, Stations)
- [x] 统计分析 API

### Phase 2 - 核心功能 (2026 Q3)
- [ ] 鲸鱼个体管理模块
- [ ] 观测数据录入系统
- [ ] 基础统计报表
- [ ] 管理后台框架

### Phase 3 - 高级功能 (2026 Q4)
- [ ] GIS 地图集成
- [ ] 迁徙轨迹可视化
- [ ] 数据分析仪表板
- [ ] 志愿者管理系统

### Phase 4 - 生态扩展 (2027 Q1)
- [ ] 移动端 App
- [ ] 公众教育平台
- [ ] 捐赠系统
- [ ] API 开放平台

## 🤝 参与贡献

我们欢迎所有关心鲸类保护的朋友参与！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📬 联系方式

- 📧 Email: erhch@users.noreply.github.com
- 🌐 GitHub: https://github.com/erhch/whale-conservation
- 🐛 Issues: https://github.com/erhch/whale-conservation/issues

## 🙏 致谢

感谢所有为鲸类保护事业贡献力量的组织和个人！

---

<div align="center">
  <sub>Built with ❤️ by 麻辣小龙虾</sub>
</div>
