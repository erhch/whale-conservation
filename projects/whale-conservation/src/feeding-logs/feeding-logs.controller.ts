/**
 * 鲸鱼觅食记录控制器
 */

import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FeedingLogsService } from './feeding-logs.service';
import { FeedingLog } from './entities/feeding-log.entity';
import { CreateFeedingLogDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe } from '../common/pipes';

@ApiTags('鲸鱼觅食记录')
@Controller('feeding-logs')
export class FeedingLogsController {
  constructor(private readonly service: FeedingLogsService) {}

  @Post()
  @ApiOperation({ summary: '创建觅食记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateFeedingLogDto): Promise<FeedingLog> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取觅食记录列表' })
  @ApiQuery({ name: 'whaleId', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('whaleId') whaleId?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1 })) page?: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 20 })) limit?: number,
  ): Promise<{ data: FeedingLog[]; total: number }> {
    return this.service.findAll({ whaleId, method, startDate, endDate, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条觅食记录' })
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<FeedingLog> {
    return this.service.findOne(id);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除觅食记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
