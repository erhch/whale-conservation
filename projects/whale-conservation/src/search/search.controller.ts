/**
 * 全局搜索控制器
 * Phase 4: 搜索与过滤 — 跨模块全文搜索 + 多条件筛选
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService, SearchParams } from './search.service';

@ApiTags('Phase 4 搜索与过滤')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  @ApiOperation({ summary: '全局搜索（跨所有模块）' })
  @ApiQuery({ name: 'q', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async globalSearch(
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    if (!q) return { query: '', total: 0, results: [] };
    return this.searchService.globalSearch(q, limit ? parseInt(String(limit)) : 20);
  }

  @Get('whales')
  @ApiOperation({ summary: '搜索鲸鱼个体' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'speciesId', required: false })
  @ApiQuery({ name: 'sex', required: false })
  @ApiQuery({ name: 'lifeStatus', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchWhales(@Query() params: SearchParams) {
    return this.searchService.searchWhales(params);
  }

  @Get('health')
  @ApiOperation({ summary: '搜索健康记录' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'healthType', required: false })
  @ApiQuery({ name: 'healthStatus', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async searchHealth(@Query() params: SearchParams) {
    return this.searchService.searchHealth(params);
  }

  @Get('behavior')
  @ApiOperation({ summary: '搜索行为日志' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'behaviorType', required: false })
  @ApiQuery({ name: 'intensity', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  async searchBehavior(@Query() params: SearchParams) {
    return this.searchService.searchBehavior(params);
  }

  @Get('feeding')
  @ApiOperation({ summary: '搜索觅食记录' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'feedingMethod', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  async searchFeeding(@Query() params: SearchParams) {
    return this.searchService.searchFeeding(params);
  }

  @Get('genealogy')
  @ApiOperation({ summary: '搜索谱系记录' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'relationshipType', required: false })
  @ApiQuery({ name: 'confidence', required: false })
  async searchGenealogy(@Query() params: SearchParams) {
    return this.searchService.searchGenealogy(params);
  }
}
