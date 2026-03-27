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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { SightingsService } from './sightings.service';
import { Sighting } from './entities/sighting.entity';

@ApiTags('sightings')
@Controller('sightings')
export class SightingsController {
  constructor(private sightingsService: SightingsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有观测记录' })
  async findAll(): Promise<Sighting[]> {
    return this.sightingsService.findAll();
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
  async create(@Body() createSightingDto: any): Promise<Sighting> {
    return this.sightingsService.create(createSightingDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新观测记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateSightingDto: any): Promise<Sighting> {
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
