/**
 * Phase 3 统计报表控制器
 * 健康/行为/觅食/谱系综合统计
 */

import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { AdvancedStatsService } from './advanced-stats.service';
import { CacheInterceptor, CacheTTL } from '../common/interceptors';
import { ParseOptionalIntPipe } from '../common/pipes';

@ApiTags('Phase 3 综合报表')
@Controller('stats')
export class AdvancedStatsController {
  constructor(private readonly advancedStats: AdvancedStatsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '综合数据概览 (Dashboard)' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async getDashboard() {
    return this.advancedStats.getDashboard();
  }

  // ---- 健康统计 ----

  @Get('health/overview')
  @ApiOperation({ summary: '健康统计概览' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  async getHealthOverview() {
    return this.advancedStats.getHealthOverview();
  }

  @Get('health/whale/:whaleId')
  @ApiOperation({ summary: '某只鲸鱼的健康摘要' })
  @UseInterceptors(CacheInterceptor)
  async getWhaleHealthSummary(@Param('whaleId') whaleId: string) {
    return this.advancedStats.getWhaleHealthSummary(whaleId);
  }

  // ---- 行为统计 ----

  @Get('behavior/stats')
  @ApiOperation({ summary: '行为分布统计' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async getBehaviorStats(
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 90, min: 1, max: 365 })) days: number,
  ) {
    return this.advancedStats.getBehaviorStats(days);
  }

  @Get('behavior/whale/:whaleId')
  @ApiOperation({ summary: '某只鲸鱼的行为画像' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async getWhaleBehaviorProfile(
    @Param('whaleId') whaleId: string,
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 90, min: 1, max: 365 })) days: number,
  ) {
    return this.advancedStats.getWhaleBehaviorProfile(whaleId, days);
  }

  // ---- 觅食统计 ----

  @Get('feeding/stats')
  @ApiOperation({ summary: '觅食统计分析' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async getFeedingStats(
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 90, min: 1, max: 365 })) days: number,
  ) {
    return this.advancedStats.getFeedingStats(days);
  }

  // ---- 谱系统计 ----

  @Get('genealogy/overview')
  @ApiOperation({ summary: '谱系统计概览' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600)
  async getGenealogyOverview() {
    return this.advancedStats.getGenealogyOverview();
  }

  @Get('genealogy/clans')
  @ApiOperation({ summary: '族群分布统计' })
  @UseInterceptors(CacheInterceptor)
  async getClanDistribution() {
    return this.advancedStats.getClanDistribution();
  }
}
