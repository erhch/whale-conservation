/**
 * 健康检查控制器
 */

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  /**
   * 基础健康检查
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024), // 200MB
    ]);
  }

  /**
   * 简化版健康检查（用于负载均衡器）
   */
  @Get('live')
  async liveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 就绪检查（包含数据库连接）
   */
  @Get('ready')
  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  /**
   * 版本信息
   */
  @Get('version')
  @ApiOperation({ summary: '获取应用版本信息' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'whale-conservation-api' },
        version: { type: 'string', example: '0.1.0' },
        description: { type: 'string', example: '鲸类保护公益组织管理系统 - 后端 API' },
        nodeVersion: { type: 'string', example: 'v20.11.0' },
        uptime: { type: 'number', example: 3600 },
        timestamp: { type: 'string', example: '2026-03-31T12:00:00.000Z' },
      },
    },
  })
  async version(): Promise<{
    name: string;
    version: string;
    description: string;
    nodeVersion: string;
    uptime: number;
    timestamp: string;
  }> {
    const pkg = require('../package.json');
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
