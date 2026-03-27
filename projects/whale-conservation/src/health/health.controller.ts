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
}
