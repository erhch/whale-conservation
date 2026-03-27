/**
 * 鲸鱼个体控制器
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

import { WhalesService } from './whales.service';
import { Whale } from './entities/whale.entity';

@ApiTags('whales')
@Controller('whales')
export class WhalesController {
  constructor(private whalesService: WhalesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有鲸鱼个体列表' })
  async findAll(): Promise<Whale[]> {
    return this.whalesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个鲸鱼个体详情' })
  async findOne(@Param('id') id: string): Promise<Whale> {
    return this.whalesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新鲸鱼个体记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createWhaleDto: any): Promise<Whale> {
    return this.whalesService.create(createWhaleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新鲸鱼个体信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateWhaleDto: any): Promise<Whale> {
    return this.whalesService.update(id, updateWhaleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除鲸鱼个体记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.whalesService.remove(id);
  }
}
