/**
 * 统计分析控制器
 */

import { Controller, Get, Query, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { StatsService } from './stats.service';
import { ParseOptionalIntPipe } from '@/common/pipes';
import { CacheInterceptor, CacheTTL } from '@/common/interceptors';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取总体统计概览' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 缓存 5 分钟
  async getOverview() {
    return this.statsService.getOverview();
  }

  @Get('species/distribution')
  @ApiOperation({ summary: '获取物种分布统计' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 缓存 10 分钟
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 缓存 10 分钟
  async getWhaleStatusBreakdown() {
    return this.statsService.getWhaleStatusBreakdown();
  }

  @Get('whales/sex')
  @ApiOperation({ summary: '获取鲸鱼个体性别分布' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600) // 缓存 10 分钟
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

  @Get('sightings/weekly')
  @ApiOperation({ summary: '获取周度观测统计' })
  @ApiQuery({
    name: 'weeks',
    required: false,
    type: Number,
    description: '统计周数，默认 12 周，最大 52 周',
    example: 12,
  })
  async getWeeklyStats(
    @Query('weeks', new ParseOptionalIntPipe({ defaultValue: 12, min: 1, max: 52 }))
    weeks: number,
  ) {
    return this.statsService.getWeeklyStats(weeks);
  }

  @Get('sightings/monthly')
  @ApiOperation({ summary: '获取月度观测统计' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: '统计月数，默认 12 个月，最大 60 个月',
    example: 12,
  })
  async getMonthlyStats(
    @Query('months', new ParseOptionalIntPipe({ defaultValue: 12, min: 1, max: 60 }))
    months: number,
  ) {
    return this.statsService.getMonthlyStats(months);
  }

  @Get('sightings/quarterly')
  @ApiOperation({ summary: '获取季度观测统计' })
  @ApiQuery({
    name: 'quarters',
    required: false,
    type: Number,
    description: '统计季度数，默认 8 个季度，最大 40 个季度',
    example: 8,
  })
  async getQuarterlyStats(
    @Query('quarters', new ParseOptionalIntPipe({ defaultValue: 8, min: 1, max: 40 }))
    quarters: number,
  ) {
    return this.statsService.getQuarterlyStats(quarters);
  }

  @Get('sightings/yearly')
  @ApiOperation({ summary: '获取年度观测统计' })
  @ApiQuery({
    name: 'years',
    required: false,
    type: Number,
    description: '统计年数，默认 10 年，最大 50 年',
    example: 10,
  })
  async getYearlyStats(
    @Query('years', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 50 }))
    years: number,
  ) {
    return this.statsService.getYearlyStats(years);
  }

  @Get('whales/active')
  @ApiOperation({ summary: '获取活跃鲸鱼个体排行' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '返回前 N 只鲸鱼，默认 10 只，最大 100 只',
    example: 10,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: '统计天数，默认 90 天，最大 365 天',
    example: 90,
  })
  async getActiveWhales(
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
    limit: number,
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 90, min: 1, max: 365 }))
    days: number,
  ) {
    return this.statsService.getActiveWhales(limit, days);
  }

  @Get('sightings/recent')
  @ApiOperation({ summary: '获取最近观测记录' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量，默认 10 条，最大 100 条',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: '偏移量 (用于分页)，默认 0',
    example: 0,
  })
  async getRecentSightings(
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 }))
    limit: number,
    @Query('offset', new ParseOptionalIntPipe({ defaultValue: 0, min: 0 }))
    offset: number,
  ) {
    const [data, total] = await Promise.all([
      this.statsService.getRecentSightings(limit, offset),
      this.statsService.getRecentSightingsTotal(),
    ]);

    return {
      data,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  @Get('species/:speciesId')
  @ApiOperation({ summary: '获取指定物种的详细统计' })
  async getSpeciesStats(@Param('speciesId') speciesId: string) {
    return this.statsService.getSpeciesStats(speciesId);
  }

  @Get('sightings/behaviors')
  @ApiOperation({ summary: '获取观测行为分布统计' })
  async getBehaviorDistribution() {
    return this.statsService.getBehaviorDistribution();
  }

  @Get('whales/:whaleId/migration')
  @ApiOperation({ summary: '获取鲸鱼迁徙轨迹分析' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: '回溯天数，默认 365 天，最大 730 天',
    example: 365,
  })
  async getWhaleMigration(
    @Param('whaleId') whaleId: string,
    @Query('days', new ParseOptionalIntPipe({ defaultValue: 365, min: 1, max: 730 }))
    days: number,
  ) {
    return this.statsService.getWhaleMigration(whaleId, days);
  }

  @Get('population/growth-trend')
  @ApiOperation({ summary: '获取种群增长趋势预测' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: '统计月数，默认 12 个月，最大 60 个月',
    example: 12,
  })
  @ApiQuery({
    name: 'forecastMonths',
    required: false,
    type: Number,
    description: '预测月数，默认 3 个月，最大 12 个月',
    example: 3,
  })
  async getPopulationGrowthTrend(
    @Query('months', new ParseOptionalIntPipe({ defaultValue: 12, min: 1, max: 60 }))
    months: number,
    @Query('forecastMonths', new ParseOptionalIntPipe({ defaultValue: 3, min: 1, max: 12 }))
    forecastMonths: number,
  ) {
    return this.statsService.getPopulationGrowthTrend(months, forecastMonths);
  }
}
