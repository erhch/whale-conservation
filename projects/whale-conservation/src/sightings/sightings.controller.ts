/**
 * 观测记录控制器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { SightingsService } from './sightings.service';
import { Sighting } from './entities/sighting.entity';
import { CreateSightingDto, UpdateSightingDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe } from '../common/pipes';

@ApiTags('sightings')
@Controller('sightings')
export class SightingsController {
  constructor(private sightingsService: SightingsService) {}

  @Get()
  @ApiOperation({ summary: '获取观测记录列表 (支持分页和筛选)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码 (默认 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量 (默认 10)', example: 10 })
  @ApiQuery({ name: 'whaleId', required: false, type: String, description: '鲸鱼 ID 筛选' })
  @ApiQuery({ name: 'stationId', required: false, type: String, description: '观测站 ID 筛选' })
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
    @Query('whaleId') whaleId?: string,
    @Query('stationId') stationId?: string,
  ): Promise<{ data: Sighting[]; total: number; page: number; limit: number }> {
    return this.sightingsService.findAll({ page, limit, whaleId, stationId });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个观测记录详情' })
  async findOne(@Param('id') id: string): Promise<Sighting> {
    return this.sightingsService.findOne(id);
  }

  @Get('whale/:whaleId')
  @ApiOperation({ summary: '获取某只鲸鱼的所有观测记录' })
  async findByWhale(@Param('whaleId') whaleId: string): Promise<Sighting[]> {
    return this.sightingsService.findByWhale(whaleId);
  }

  @Post()
  @ApiOperation({ summary: '创建新观测记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createSightingDto: CreateSightingDto): Promise<Sighting> {
    return this.sightingsService.create(createSightingDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新观测记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateSightingDto: UpdateSightingDto,
  ): Promise<Sighting> {
    return this.sightingsService.update(id, updateSightingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除观测记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.sightingsService.remove(id);
  }
}
