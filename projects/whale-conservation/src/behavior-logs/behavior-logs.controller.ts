/**
 * 鲸鱼行为日志控制器
 */

import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, ParseBoolPipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { BehaviorLogsService } from './behavior-logs.service';
import { BehaviorLog } from './entities/behavior-log.entity';
import { CreateBehaviorLogDto } from './dto/create-behavior-log.dto';
import { UpdateBehaviorLogDto } from './dto/update-behavior-log.dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe, ParseOptionalBooleanPipe } from '../common/pipes';

@ApiTags('鲸鱼行为日志')
@Controller('behavior-logs')
export class BehaviorLogsController {
  constructor(private readonly service: BehaviorLogsService) {}

  @Post()
  @ApiOperation({ summary: '创建行为日志' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateBehaviorLogDto): Promise<BehaviorLog> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取行为日志列表' })
  @ApiQuery({ name: 'whaleId', required: false })
  @ApiQuery({ name: 'behaviorType', required: false, enum: ['surfacing','diving','breaching','feeding','resting','social','traveling'] })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('whaleId') whaleId?: string,
    @Query('behaviorType') behaviorType?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('verified', new ParseOptionalBooleanPipe({ defaultValue: undefined })) verified?: boolean,
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1 })) page?: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20 })) limit?: number,
  ): Promise<{ data: BehaviorLog[]; total: number }> {
    return this.service.findAll({ whaleId, behaviorType, startDate, endDate, verified, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条行为日志' })
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<BehaviorLog> {
    return this.service.findOne(id);
  }

  @Post(':id')
  @ApiOperation({ summary: '更新行为日志' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() dto: UpdateBehaviorLogDto): Promise<BehaviorLog> {
    return this.service.update(id, dto);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除行为日志' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Get('stats/:whaleId')
  @ApiOperation({ summary: '获取某只鲸鱼的行为统计' })
  @UseInterceptors(CacheInterceptor)
  async getStats(@Param('whaleId') whaleId: string) {
    return this.service.getBehaviorStats(whaleId);
  }
}
