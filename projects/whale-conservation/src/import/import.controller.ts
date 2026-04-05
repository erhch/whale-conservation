/**
 * 数据导入控制器
 * Phase 3: 批量导入 — CSV 上传解析
 */

import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ImportService } from './import.service';

@ApiTags('数据导入')
@Controller('import')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('health')
  @ApiOperation({ summary: '导入健康记录 (CSV)' })
  @ApiBody({ schema: { type: 'object', properties: { csv: { type: 'string' }, observerId: { type: 'string' } } } })
  async importHealth(@Body() body: { csv: string; observerId?: string }) {
    return this.importService.importHealthRecords(body.csv, body.observerId);
  }

  @Post('behavior')
  @ApiOperation({ summary: '导入行为日志 (CSV)' })
  @ApiBody({ schema: { type: 'object', properties: { csv: { type: 'string' }, observerId: { type: 'string' } } } })
  async importBehavior(@Body() body: { csv: string; observerId?: string }) {
    return this.importService.importBehaviorLogs(body.csv, body.observerId);
  }

  @Post('feeding')
  @ApiOperation({ summary: '导入觅食记录 (CSV)' })
  @ApiBody({ schema: { type: 'object', properties: { csv: { type: 'string' }, observerId: { type: 'string' } } } })
  async importFeeding(@Body() body: { csv: string; observerId?: string }) {
    return this.importService.importFeedingLogs(body.csv, body.observerId);
  }
}
