/**
 * 数据导出控制器
 * Phase 3: 报表导出 — CSV/JSON 格式
 */

import { Controller, Get, Query, Res, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';

import { ExportService } from './export.service';

@ApiTags('数据导出')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private setCsvResponse(res: Response, filename: string) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  private setJsonResponse(res: Response, filename: string) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  @Get('health')
  @ApiOperation({ summary: '导出健康记录 (CSV/JSON)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  @ApiQuery({ name: 'whaleId', required: false })
  async exportHealth(
    @Res() res: Response,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query('whaleId') whaleId?: string,
  ) {
    const data = await this.exportService.exportHealthRecords(format, whaleId);
    if (format === 'json') {
      this.setJsonResponse(res, 'health_records.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      this.setCsvResponse(res, 'health_records.csv');
      res.send(data);
    }
  }

  @Get('behavior')
  @ApiOperation({ summary: '导出行为日志 (CSV/JSON)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  @ApiQuery({ name: 'whaleId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async exportBehavior(
    @Res() res: Response,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query('whaleId') whaleId?: string,
    @Query('days') days?: number,
  ) {
    const data = await this.exportService.exportBehaviorLogs(format, whaleId, days ? parseInt(String(days)) : undefined);
    if (format === 'json') {
      this.setJsonResponse(res, 'behavior_logs.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      this.setCsvResponse(res, 'behavior_logs.csv');
      res.send(data);
    }
  }

  @Get('feeding')
  @ApiOperation({ summary: '导出觅食记录 (CSV/JSON)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  @ApiQuery({ name: 'whaleId', required: false })
  async exportFeeding(
    @Res() res: Response,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Query('whaleId') whaleId?: string,
  ) {
    const data = await this.exportService.exportFeedingLogs(format, whaleId);
    if (format === 'json') {
      this.setJsonResponse(res, 'feeding_logs.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      this.setCsvResponse(res, 'feeding_logs.csv');
      res.send(data);
    }
  }

  @Get('genealogy')
  @ApiOperation({ summary: '导出谱系记录 (CSV/JSON)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  async exportGenealogy(
    @Res() res: Response,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    const data = await this.exportService.exportGenealogyRecords(format);
    if (format === 'json') {
      this.setJsonResponse(res, 'genealogy_records.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      this.setCsvResponse(res, 'genealogy_records.csv');
      res.send(data);
    }
  }

  @Get('whales')
  @ApiOperation({ summary: '导出鲸鱼个体档案 (CSV/JSON)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'] })
  async exportWhales(
    @Res() res: Response,
    @Query('format') format: 'csv' | 'json' = 'csv',
  ) {
    const data = await this.exportService.exportWhaleProfiles(format);
    if (format === 'json') {
      this.setJsonResponse(res, 'whale_profiles.json');
      res.send(JSON.stringify(data, null, 2));
    } else {
      this.setCsvResponse(res, 'whale_profiles.csv');
      res.send(data);
    }
  }
}
