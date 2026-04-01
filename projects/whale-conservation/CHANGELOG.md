# Changelog

All notable changes to the Whale Conservation Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### Interceptors
- **CacheInterceptor Tests** - 缓存拦截器完整单元测试 (36 个测试用例), 覆盖:
  - GET 请求缓存命中/未命中场景
  - 非 GET 请求 (POST/PUT/DELETE/PATCH/HEAD/OPTIONS) 跳过缓存
  - 自定义缓存键 (@CacheKey 装饰器)
  - 自定义缓存时间 (@CacheTTL 装饰器)
  - 缓存过期逻辑验证
  - clearCache/clearAllCache/getCacheStats 方法测试
  - 空响应/数组/复杂嵌套对象处理
  - 特殊字符 URL 缓存键处理
  - 实际场景测试 (鲸鱼列表 API/统计数据 API/POST 创建请求)
- 测试文件：`src/common/interceptors/cache.interceptor.spec.ts`
- 测试状态：✅ 36 tests passed

#### Common Pipes
- `ParseJSONPipe` - JSON string parsing with optional validation support
- **ParseJSONPipe Tests** - Comprehensive unit tests (40 test cases) covering:
  - Basic JSON parsing (objects, arrays, primitives, nested structures)
  - Unicode and special character handling
  - Null/undefined/empty value handling
  - Invalid JSON rejection
  - Custom error messages
  - Custom validation functions
  - Real-world scenarios (filters, sorting, whale sighting data)
  - Edge cases and performance tests
- **ParsePhonePipe Tests** - 手机号验证管道单元测试 (50+ 测试用例), 覆盖:
  - 标准 11 位手机号格式验证
  - 所有有效号段测试 (13x-19x)
  - 必填/可选模式行为
  - 国际格式 (+86) 支持
  - 自动格式化 (空格/连字符去除)
  - 无效格式拒绝
  - 错误消息清晰度
  - 边界情况和性能测试
  - 实际使用场景覆盖

#### Guards
- **JwtAuthGuard Tests** - JWT 认证守卫单元测试，覆盖：
  - `@Public()` 装饰器公开路由验证
  - 受保护路由的 JWT 认证委托
  - 管理员路由保护
  - 已认证/未认证用户访问场景
  - 健康检查端点公开访问
- **RolesGuard Tests** - RBAC 角色守卫单元测试，覆盖：
  - 无角色要求/空角色数组场景
  - 未认证用户拒绝访问
  - 单角色/多角色 (OR 逻辑) 验证
  - ADMIN/RESEARCHER/VOLUNTEER 角色场景
  - 边缘情况处理 (用户对象缺少 role 属性)
- **Guards 文档更新** - 添加测试覆盖章节到 `docs/guards.md`

#### Documentation
- **Stats API 文档完善** - `docs/stats-api.md` 从 5 个端点扩展至 19 个端点，新增:
  - 鲸鱼生命状态分布 (`/whales/status`)
  - 鲸鱼性别分布 (`/whales/sex`)
  - 物种出现频率 (`/species/frequency`)
  - 热门观测地点排行 (`/locations/top`)
  - 周度/月度/季度/年度观测统计
  - 活跃鲸鱼个体排行 (`/whales/active`)
  - 最近观测记录 (`/sightings/recent`，支持分页)
  - 物种详细统计 (`/species/:speciesId`)
  - 观测行为分布 (`/sightings/behaviors`)
  - 鲸鱼迁徙轨迹分析 (`/whales/:whaleId/migration`)
  - 种群增长趋势预测 (`/population/growth-trend`)
- 每个端点包含请求示例、响应示例和完整字段说明
- **ParsePhonePipe 文档更新** - `docs/parse-phone-pipe.md` 添加完整单元测试覆盖章节:
  - 测试分类说明 (标准格式、必填/可选、国际格式、边界情况、错误消息)
  - 50+ 测试用例覆盖详情
  - 测试示例代码
  - 测试运行命令
  - 测试覆盖率目标表格

#### Tests
- **Decorators 单元测试** - 装饰器模块完整测试覆盖 (24 个测试用例):
  - `@Public()` 装饰器测试 (5 cases) - 元数据设置、类/方法级别应用、组合使用
  - `@Roles()` 装饰器测试 (9 cases) - 单/多角色设置、值验证、边界情况
  - `@CurrentUser()` 装饰器测试 (10 cases) - 参数提取、类型支持、控制器集成
- 测试文件：`src/common/decorators/tests/*.spec.ts`
- 测试状态：✅ 24 tests passed

### Planned
- Stats API dashboard integration
- Enhanced reporting features
- Mobile app integration

---

## [0.1.0] - 2026-03-31

### Added

#### Stats Module
- **Stats API** - Comprehensive statistics endpoints for analytics
  - `GET /api/v1/stats/overview` - Overall system statistics
  - `GET /api/v1/stats/species/distribution` - Species distribution data
  - `GET /api/v1/stats/sightings/trend` - Sighting trends over time
  - `GET /api/v1/stats/stations/activity` - Station activity statistics
  - `GET /api/v1/stats/species/ranking` - Species sighting rankings
- Unit tests for StatsController with comprehensive coverage
- Complete API documentation with examples and usage guides

#### Health Module
- **Version Endpoint** - `GET /health/version` for app info and runtime status
- Unit tests for HealthController

#### Common Pipes (Validation & Transformation)
- `ParseArrayPipe` - Array validation with item type support
- `ParseOptionalStringPipe` - Optional string with length validation
- `ParseOptionalBooleanPipe` - Optional boolean with default values
- `ParseBooleanPipe` - Boolean with truthy/falsy value support
- `ParseUUIDPipe` - UUID v1-v5 version validation
- `ParsePhonePipe` - China mobile phone number validation
- `ParseEmailPipe` - Email validation with best practices
- `PaginationPipe` - Pagination parameters with offset calculation
- `ParseDatePipe` - Date validation with range constraints
- `ParseEnumPipe` - Enum validation
- `ParseFloatPipe` - Float validation with precision control
- `ParseIntPipe` - Integer validation with range checks
- `ParseUrlPipe` - URL validation
- `ParseStringPipe` - String validation with regex patterns and case conversion
- `ParseISO8601Pipe` - ISO 8601 date/time validation
- `ParseOptionalIntPipe` - Optional integer with min/max constraints
- `ParseOptionalFloatPipe` - Optional float with precision control
- `ParseOptionalDatePipe` - Optional date with default values
- `ParseOptionalBooleanPipe` - Optional boolean with defaults

#### Documentation
- **CONTRIBUTING.md** - Comprehensive contribution guide
- **Guards Documentation** - JWT authentication and RBAC role-based access control
- **Decorators Documentation** - `@Public`, `@Roles`, `@CurrentUser` usage examples
- **Exception Filters** - Error handling with response format standards
- **Interceptors** - Request/response transformation documentation
- **Scripts README** - `init-db.sh` and `start-dev.sh` usage guides

#### Scripts
- `init-db.sh` - Database initialization with Prisma migrations
- `start-dev.sh` - Development environment startup with hot-reload

### Technical Details

**Version:** 0.1.0  
**Release Date:** 2026-03-31  
**Branch:** main  

**Key Features:**
- RESTful API with NestJS framework
- JWT-based authentication
- Role-based access control (RBAC)
- Comprehensive input validation pipes
- Health check endpoints
- Statistics and analytics API
- PostgreSQL database with TypeORM
- Docker support for deployment

---

## [0.0.1] - 2026-03-30

### Added
- Initial project setup
- Core module structure (species, whales, sightings, stations)
- Database schema design
- Basic CRUD operations
- Development environment configuration

---

## Version History Summary

| Version | Date | Type | Highlights |
|---------|------|------|------------|
| 0.1.0 | 2026-03-31 | Minor | Stats API, Health endpoint, 20+ validation pipes, comprehensive docs |
| 0.0.1 | 2026-03-30 | Initial | Project scaffolding, core modules, database setup |

---

## Future Roadmap

### v0.2.0 (Planned)
- [ ] User management module
- [ ] Advanced search and filtering
- [ ] Export functionality (CSV, Excel, PDF)
- [ ] Real-time WebSocket updates
- [ ] Image upload and processing

### v0.3.0 (Planned)
- [ ] Reporting dashboard
- [ ] Data visualization charts
- [ ] Email notifications
- [ ] API rate limiting
- [ ] Audit logging

### v1.0.0 (Target)
- [ ] Production-ready deployment
- [ ] Complete test coverage (>90%)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User documentation

---

*Last updated: 2026-03-31*
