/**
 * 通知/告警控制器
 * Phase 7: 通知系统 — 告警查询、管理、扫描
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { NotificationService } from './notification.service';
import { Notification, NotificationType, NotificationPriority, NotificationStatus } from './entities/notification.entity';

@ApiTags('Phase 7 通知与告警')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '查询通知列表' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'priority', required: false, enum: NotificationPriority })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('status') status?: NotificationStatus,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findAll({
      type, priority, status, userId,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });
  }

  @Get('overview')
  @ApiOperation({ summary: '通知统计概览' })
  async getOverview() {
    return this.notificationService.getOverview();
  }

  @Get('unread/count')
  @ApiOperation({ summary: '未读通知数量' })
  @ApiQuery({ name: 'userId', required: false })
  async getUnreadCount(@Query('userId') userId?: string) {
    return { count: await this.notificationService.getUnreadCount(userId) };
  }

  @Post('scan')
  @ApiOperation({ summary: '手动扫描并生成告警' })
  async scanAndGenerate() {
    return this.notificationService.scanAndGenerate();
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记通知已读' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: '标记通知已解决' })
  async markAsResolved(
    @Param('id') id: string,
    @Body() body: { resolvedBy: string },
  ) {
    return this.notificationService.markAsResolved(id, body.resolvedBy);
  }

  @Post('read-all')
  @ApiOperation({ summary: '批量标记已读' })
  async markManyAsRead(@Body() body: { ids: string[] }) {
    const count = await this.notificationService.markManyAsRead(body.ids);
    return { marked: count };
  }
}
