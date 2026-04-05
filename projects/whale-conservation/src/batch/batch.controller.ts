/**
 * 批量操作控制器
 * Phase 6: 批量管理 — 批量更新状态、批量删除、批量验证
 */

import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { BatchService } from './batch.service';

@ApiTags('Phase 6 批量操作')
@Controller('batch')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('whales/status')
  @ApiOperation({ summary: '批量更新鲸鱼状态' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, lifeStatus: { type: 'string' } } } })
  async updateWhaleStatus(@Body() body: { ids: string[]; lifeStatus: string }) {
    return this.batchService.batchUpdateWhaleStatus(body.ids, body.lifeStatus);
  }

  @Post('whales/delete')
  @ApiOperation({ summary: '批量删除鲸鱼' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
  async deleteWhales(@Body() body: { ids: string[] }) {
    return this.batchService.batchDeleteWhales(body.ids);
  }

  @Post('health/status')
  @ApiOperation({ summary: '批量更新健康记录状态' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, status: { type: 'string' } } } })
  async updateHealthStatus(@Body() body: { ids: string[]; status: string }) {
    return this.batchService.batchUpdateHealthStatus(body.ids, body.status);
  }

  @Post('behavior/verify')
  @ApiOperation({ summary: '批量验证行为日志' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, verified: { type: 'boolean' } } } })
  async verifyBehavior(@Body() body: { ids: string[]; verified?: boolean }) {
    return this.batchService.batchVerifyBehavior(body.ids, body.verified !== false);
  }

  @Post('feeding/verify')
  @ApiOperation({ summary: '批量验证觅食记录' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, verified: { type: 'boolean' } } } })
  async verifyFeeding(@Body() body: { ids: string[]; verified?: boolean }) {
    return this.batchService.batchVerifyFeeding(body.ids, body.verified !== false);
  }

  @Post(':entityType/delete')
  @ApiOperation({ summary: '批量删除（通用）' })
  @ApiBody({ schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } } } } })
  async batchDelete(
    @Param('entityType') entityType: string,
    @Body() body: { ids: string[] },
  ) {
    return this.batchService.batchDelete(entityType, body.ids);
  }
}
