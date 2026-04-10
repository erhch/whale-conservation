/**
 * 系统健康检查控制器
 * 提供详细的服务状态、数据库连接、内存使用等监控信息
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';

@ApiTags('系统健康检查')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: '服务健康检查' })
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: this.getMemoryUsage(),
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: '详细系统状态（数据库、内存、环境）' })
  async getDetailedHealth() {
    const dbHealth = await this.checkDatabase();
    const memory = this.getMemoryUsage();

    return {
      status: dbHealth.connected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      uptimeFormatted: this.formatUptime(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'production',
      database: dbHealth,
      memory,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: '系统监控指标' })
  async getMetrics() {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: this.formatBytes(memory.rss),
        heapTotal: this.formatBytes(memory.heapTotal),
        heapUsed: this.formatBytes(memory.heapUsed),
        external: this.formatBytes(memory.external),
        arrayBuffers: this.formatBytes(memory.arrayBuffers || 0),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      handles: process.getActiveResourcesInfo().length,
    };
  }

  @Get('version')
  @ApiOperation({ summary: '服务版本信息' })
  getVersion() {
    return {
      name: 'whale-conservation',
      version: '3.0.0',
      build: '4419469',
      commit: '4419469',
      modules: 20,
      endpoints: 91,
      migrations: 5,
    };
  }

  private async checkDatabase(): Promise<{ connected: boolean; latency: number; poolSize: number }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - start;
      const pool = this.dataSource.driver as any;
      return {
        connected: true,
        latency,
        poolSize: pool?.master?.pool?.size || pool?.pool?.size || 1,
      };
    } catch {
      return { connected: false, latency: Date.now() - start, poolSize: 0 };
    }
  }

  private getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
      rss: this.formatBytes(mem.rss),
      heapUsed: this.formatBytes(mem.heapUsed),
      heapTotal: this.formatBytes(mem.heapTotal),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Full health check - used by tests and external monitors
   */
  async check() {
    const dbHealth = await this.checkDatabase();
    const memory = this.getMemoryUsage();
    return {
      status: dbHealth.connected ? 'ok' : 'degraded',
      info: {
        database: { status: dbHealth.connected ? 'up' : 'down' },
        memory_heap: { status: 'up' },
        memory_rss: { status: 'up' },
      },
      error: {},
      details: {
        database: { status: dbHealth.connected ? 'up' : 'down' },
        memory_heap: { status: 'up' },
        memory_rss: { status: 'up' },
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory,
    };
  }

  /**
   * Liveness probe - simple alive check
   */
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - checks database connectivity
   */
  async readiness() {
    const dbHealth = await this.checkDatabase();
    return {
      status: dbHealth.connected ? 'ok' : 'error',
      info: {
        database: { status: dbHealth.connected ? 'up' : 'down' },
      },
      error: dbHealth.connected ? {} : { database: { status: 'down' } },
      details: {
        database: { status: dbHealth.connected ? 'up' : 'down' },
      },
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }
}
