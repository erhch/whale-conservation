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

  @Get('stations')
  @ApiOperation({ summary: '获取监测站点统计' })
  async getStationStats() {
    return this.statsService.getStationStats();
  }

  @Get('whales/status')
  @ApiOperation({ summary: '获取鲸鱼个体生命状态分布' })
  async getWhaleStatusBreakdown() {
    return this.statsService.getWhaleStatusBreakdown();
  }

  @Get('whales/sex')
  @ApiOperation({ summary: '获取鲸鱼个体性别分布' })
  async getWhaleSexDistribution() {
    return this.statsService.getWhaleSexDistribution();
  }

  @Get('species/frequency')
  @ApiOperation({ summary: '获取物种出现频率统计' })
  async getSpeciesFrequency() {
    return this.statsService.getSpeciesFrequency();
  }

  @Get('locations/top')
  @ApiOperation({ summary: '获取热门观测地点排行' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '返回前 N 个地点，默认 10 个，最大 100 个',
    example: 10,
  })
  async getTopLocations(
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
    limit: number,
  ) {
    return this.statsService.getTopLocations(limit);
  }
}
