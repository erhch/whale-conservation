/**
 * 统计分析控制器
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取总体统计概览' })
  async getOverview() {
    return this.statsService.getOverview();
  }

  @Get('species/distribution')
  @ApiOperation({ summary: '获取物种分布统计' })
  async getSpeciesDistribution() {
    return this.statsService.getSpeciesDistribution();
  }

  @Get('sightings/trend')
  @ApiOperation({ summary: '获取观测趋势' })
  async getSightingsTrend(@Query('days') days: number = 30) {
    return this.statsService.getSightingsTrend(days);
  }
}
