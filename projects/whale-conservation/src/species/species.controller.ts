/**
 * 物种控制器
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

import { SpeciesService } from './species.service';
import { Species } from './entities/species.entity';

@ApiTags('species')
@Controller('species')
export class SpeciesController {
  constructor(private speciesService: SpeciesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有物种列表' })
  async findAll(): Promise<Species[]> {
    return this.speciesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个物种详情' })
  async findOne(@Param('id') id: string): Promise<Species> {
    return this.speciesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新物种' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createSpeciesDto: any): Promise<Species> {
    return this.speciesService.create(createSpeciesDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新物种信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateSpeciesDto: any): Promise<Species> {
    return this.speciesService.update(id, updateSpeciesDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除物种 (软删除)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string): Promise<void> {
    return this.speciesService.remove(id);
  }
}
