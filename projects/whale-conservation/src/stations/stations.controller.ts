/**
 * 监测站点控制器
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { StationsService } from './stations.service';
import { Station } from './entities/station.entity';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有监测站点' })
  async findAll(): Promise<Station[]> {
    return this.stationsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: '获取活跃站点' })
  async findActive(): Promise<Station[]> {
    return this.stationsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个站点详情' })
  async findOne(@Param('id') id: string): Promise<Station> {
    return this.stationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新站点' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createStationDto: any): Promise<Station> {
    return this.stationsService.create(createStationDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新站点信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateStationDto: any): Promise<Station> {
    return this.stationsService.update(id, updateStationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除站点' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.stationsService.remove(id);
  }
}
