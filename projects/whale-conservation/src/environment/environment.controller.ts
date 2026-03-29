/**
 * 环境日志控制器
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  ParseOptionalIntPipe,
  ParseISO8601Pipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EnvironmentService } from './environment.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@ApiTags('Environment - 环境日志')
@Controller('api/v1/environment')
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  /**
   * 创建环境日志记录
   */
  @Post()
  @ApiOperation({ summary: '创建环境日志记录' })
  async create(@Body() createEnvironmentDto: CreateEnvironmentDto) {
    return this.environmentService.create(createEnvironmentDto);
  }

  /**
   * 获取站点的环境数据列表
   */
  @Get('station/:stationId')
  @ApiOperation({ summary: '获取站点的环境数据列表' })
  @ApiParam({ name: 'stationId', description: '站点 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量', example: 10 })
  async findByStation(
    @Param('stationId', new ParseUUIDPipe()) stationId: string,
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
  ) {
    return this.environmentService.findByStation(stationId, page, limit);
  }

  /**
   * 获取单个环境记录
   */
  @Get(':id')
  @ApiOperation({ summary: '获取单个环境记录' })
  @ApiParam({ name: 'id', description: '环境记录 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.environmentService.findOne(id);
  }

  /**
   * 获取站点最近的环境数据
   */
  @Get('station/:stationId/recent')
  @ApiOperation({ summary: '获取站点最近的环境数据' })
  @ApiParam({ name: 'stationId', description: '站点 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '返回数量', example: 10 })
  async findRecent(
    @Param('stationId', new ParseUUIDPipe()) stationId: string,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
  ) {
    return this.environmentService.findRecent(stationId, limit);
  }

  /**
   * 删除环境记录
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除环境记录' })
  @ApiParam({ name: 'id', description: '环境记录 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.environmentService.remove(id);
    return { message: '环境记录已删除' };
  }
}
