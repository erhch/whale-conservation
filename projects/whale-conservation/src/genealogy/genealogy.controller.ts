/**
 * 鲸鱼谱系控制器
 */

import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { GenealogyService } from './genealogy.service';
import { GenealogyRecord, WhalePedigree } from './entities/genealogy-record.entity';
import { CreateGenealogyRecordDto, UpdateGenealogyRecordDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe } from '../common/pipes';

@ApiTags('鲸鱼谱系管理')
@Controller('genealogy')
export class GenealogyController {
  constructor(private readonly service: GenealogyService) {}

  @Post('records')
  @ApiOperation({ summary: '创建谱系关系记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async createRecord(@Body() dto: CreateGenealogyRecordDto): Promise<GenealogyRecord> {
    return this.service.createRecord(dto);
  }

  @Get('records')
  @ApiOperation({ summary: '获取谱系记录列表' })
  @ApiQuery({ name: 'whaleId', required: false })
  @ApiQuery({ name: 'relationshipType', required: false })
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('whaleId') whaleId?: string,
    @Query('relationshipType') relationshipType?: string,
  ): Promise<{ data: GenealogyRecord[]; total: number }> {
    return this.service.findAll(whaleId, relationshipType);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取单条谱系记录' })
  @UseInterceptors(CacheInterceptor)
  async findOneRecord(@Param('id') id: string): Promise<GenealogyRecord> {
    return this.service.findOne(id);
  }

  @Post('records/:id')
  @ApiOperation({ summary: '更新谱系记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateRecord(@Param('id') id: string, @Body() dto: UpdateGenealogyRecordDto): Promise<GenealogyRecord> {
    return this.service.update(id, dto);
  }

  @Post('records/:id/delete')
  @ApiOperation({ summary: '删除谱系记录' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async removeRecord(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }

  @Get('pedigree/:whaleId')
  @ApiOperation({ summary: '获取个体谱系信息' })
  @UseInterceptors(CacheInterceptor)
  async getPedigree(@Param('whaleId') whaleId: string): Promise<WhalePedigree | null> {
    return this.service.getPedigree(whaleId);
  }

  @Post('pedigree/:whaleId')
  @ApiOperation({ summary: '更新个体谱系信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updatePedigree(
    @Param('whaleId') whaleId: string,
    @Body() data: Partial<WhalePedigree>,
  ): Promise<WhalePedigree> {
    return this.service.updatePedigree(whaleId, data);
  }

  @Get('tree/:whaleId')
  @ApiOperation({ summary: '获取家谱树（向上3代）' })
  @ApiQuery({ name: 'depth', required: false, type: Number })
  @UseInterceptors(CacheInterceptor)
  async getFamilyTree(
    @Param('whaleId') whaleId: string,
    @Query('depth', new ParseOptionalIntPipe({ defaultValue: 3 })) depth: number,
  ): Promise<any> {
    return this.service.getFamilyTree(whaleId, depth);
  }

  @Get('descendants/:whaleId')
  @ApiOperation({ summary: '获取所有后代' })
  @UseInterceptors(CacheInterceptor)
  async getDescendants(@Param('whaleId') whaleId: string): Promise<GenealogyRecord[]> {
    return this.service.getDescendants(whaleId);
  }
}
