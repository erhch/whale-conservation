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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { WhalesService } from './whales.service';
import { Whale } from './entities/whale.entity';
import { CreateWhaleDto, UpdateWhaleDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe, ParseOptionalBooleanPipe } from '../common/pipes';

@ApiTags('鲸鱼个体管理')
@Controller('whales')
export class WhalesController {
  constructor(private whalesService: WhalesService) {}

  @Get()
  @ApiOperation({ summary: '获取鲸鱼个体列表 (支持分页和筛选)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码 (默认 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量 (默认 10)', example: 10 })
  @ApiQuery({ name: 'speciesId', required: false, type: String, description: '物种 ID 筛选' })
  @ApiQuery({ name: 'sex', required: false, enum: ['M', 'F', 'U'], description: '性别筛选' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: '是否仅显示存活个体 (默认 true)' })
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
    @Query('speciesId') speciesId?: string,
    @Query('sex') sex?: string,
    @Query('active', new ParseOptionalBooleanPipe({ defaultValue: true })) active?: boolean,
  ): Promise<{ data: Whale[]; total: number; page: number; limit: number }> {
    return this.whalesService.findAll({ page, limit, speciesId, sex, active });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个鲸鱼个体详情' })
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id') id: string): Promise<Whale> {
    return this.whalesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新鲸鱼个体记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createWhaleDto: CreateWhaleDto): Promise<Whale> {
    return this.whalesService.create(createWhaleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新鲸鱼个体信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateWhaleDto: UpdateWhaleDto): Promise<Whale> {
    return this.whalesService.update(id, updateWhaleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除鲸鱼个体记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.whalesService.remove(id);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索鲸鱼个体 (支持编号/昵称/备注模糊搜索)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: '搜索关键词', example: '大白' })
  @UseInterceptors(CacheInterceptor)
  async search(@Query('q') query: string): Promise<Whale[]> {
    return this.whalesService.search(query);
  }
}
