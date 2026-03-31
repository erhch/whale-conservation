# Changelog

All notable changes to the Whale Conservation Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
