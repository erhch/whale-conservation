/**
 * 统计分析控制器
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { StatsService } from './stats.service';
import { ParseOptionalIntPipe } from '@/common/pipes';

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
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: '统计天数，默认 30 天，最大 365 天',
    example: 30,
  })
  async getSightingsTrend(
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 30, min: 1, max: 365 }))
    days: number,
  ) {
    return this.statsService.getSightingsTrend(days);
  }
}
