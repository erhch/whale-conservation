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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { SpeciesService, SpeciesFilter } from './species.service';
import { Species } from './entities/species.entity';
import { CreateSpeciesDto, UpdateSpeciesDto } from './dto';
import { CacheInterceptor } from '../common/interceptors';
import { ParseOptionalIntPipe } from '../common/pipes';
import { Public } from '../common/decorators/public.decorator';
import { CacheTTL } from '../common/decorators/cache-ttl.decorator';
import { IUCNStatus } from './entities/species.entity';

@ApiTags('species')
@Controller('species')
export class SpeciesController {
  constructor(private speciesService: SpeciesService) {}

  @Get()
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 分钟缓存
  @ApiOperation({ summary: '获取物种列表 (支持分页和筛选)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: '页码 (默认 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: '每页数量 (默认 10, 最大 100)' })
  @ApiQuery({ name: 'iucnStatus', required: false, enum: IUCNStatus, description: 'IUCN 保护等级筛选' })
  @ApiQuery({ name: 'family', required: false, type: String, description: '科筛选' })
  async findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
    @Query('iucnStatus') iucnStatus?: IUCNStatus,
    @Query('family') family?: string,
  ): Promise<{ data: Species[]; total: number; page: number; limit: number }> {
    const filter: SpeciesFilter = { page, limit };
    if (iucnStatus) filter.iucnStatus = iucnStatus;
    if (family) filter.family = family;
    return this.speciesService.findAll(filter);
  }

  @Get(':id')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: '获取单个物种详情' })
  async findOne(@Param('id') id: string): Promise<Species> {
    return this.speciesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新物种' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createSpeciesDto: CreateSpeciesDto): Promise<Species> {
    return this.speciesService.create(createSpeciesDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新物种信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateSpeciesDto: UpdateSpeciesDto): Promise<Species> {
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
