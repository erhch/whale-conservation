/**
 * 审计日志控制器
 * Phase 5: 审计追踪 — 查询所有写操作记录
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

@ApiTags('Phase 5 审计日志')
@Controller('audit')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '查询审计日志列表' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({
      userId, action, entityType, entityId,
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : undefined,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: '获取某个实体的变更历史' })
  async getEntityHistory(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityType, entityId);
  }

  @Get('user/:userId/summary')
  @ApiOperation({ summary: '获取用户操作统计' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getUserActivity(
    @Query('userId') userId: string,
    @Query('days') days?: number,
  ) {
    return this.auditService.getUserActivitySummary(
      userId,
      days ? parseInt(String(days)) : 30,
    );
  }
}
