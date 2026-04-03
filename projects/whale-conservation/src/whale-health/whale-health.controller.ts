/**
 * 鲸鱼健康记录控制器
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { WhaleHealthService } from './whale-health.service';
import { WhaleHealthRecord } from './entities/whale-health-record.entity';
import { CreateWhaleHealthRecordDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';

@ApiTags('鲸鱼健康记录')
@Controller('whale-health')
export class WhaleHealthController {
  constructor(private readonly healthService: WhaleHealthService) {}

  @Post()
  @ApiOperation({ summary: '创建健康记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateWhaleHealthRecordDto): Promise<WhaleHealthRecord> {
    return this.healthService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取健康记录列表 (支持按鲸鱼 ID 筛选)' })
  @ApiQuery({ name: 'whaleId', required: false, description: '鲸鱼个体 ID' })
  @UseInterceptors(CacheInterceptor)
  async findAll(@Query('whaleId') whaleId?: string): Promise<WhaleHealthRecord[]> {
    return this.healthService.findAll(whaleId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单条健康记录详情' })
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<WhaleHealthRecord> {
    return this.healthService.findOne(id);
  }

  @Post(':id') // Using POST for update as Put might need full body, keeping it simple for now
  @ApiOperation({ summary: '更新健康记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() dto: Partial<CreateWhaleHealthRecordDto>): Promise<WhaleHealthRecord> {
    return this.healthService.update(id, dto);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除健康记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.healthService.remove(id);
  }
}
