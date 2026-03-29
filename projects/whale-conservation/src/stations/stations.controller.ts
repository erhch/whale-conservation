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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { StationsService, StationsFilter } from './stations.service';
import { Station, StationType, StationStatus } from './entities/station.entity';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';
import { CacheTTL } from '../common/decorators/cache-ttl.decorator';
import { ParseOptionalIntPipe } from '../common/pipes/parse-optional-int.pipe';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Get()
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 分钟缓存
  @ApiOperation({ summary: '获取监测站点列表 (支持分页和筛选)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: '页码 (默认 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: '每页数量 (默认 10, 最大 100)' })
  @ApiQuery({ name: 'type', required: false, enum: StationType, description: '站点类型筛选' })
  @ApiQuery({ name: 'status', required: false, enum: StationStatus, description: '站点状态筛选' })
  async findAll(
    @Query('page', new ParseOptionalIntPipe({ defaultValue: 1, min: 1 })) page: number,
    @Query('limit', new ParseOptionalIntPipe({ defaultValue: 10, min: 1, max: 100 })) limit: number,
    @Query('type') type?: StationType,
    @Query('status') status?: StationStatus,
  ): Promise<any> {
    const filter: StationsFilter = { page, limit };
    if (type) filter.type = type;
    if (status) filter.status = status;
    return this.stationsService.findAll(filter);
  }

  @Get('active')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: '获取活跃站点' })
  async findActive(): Promise<Station[]> {
    return this.stationsService.findActive();
  }

  @Get('search')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: '搜索站点 (按名称/代码/位置模糊搜索)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: '搜索关键词', example: '长江' })
  async search(@Query('q') query: string): Promise<Station[]> {
    return this.stationsService.search(query);
  }

  @Get('stats')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: '获取站点统计信息 (按类型和状态分组)' })
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    return this.stationsService.getStats();
  }

  @Get(':id')
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: '获取单个站点详情' })
  async findOne(@Param('id') id: string): Promise<Station> {
    return this.stationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建新站点' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createStationDto: CreateStationDto): Promise<Station> {
    return this.stationsService.create(createStationDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新站点信息' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateStationDto: UpdateStationDto): Promise<Station> {
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
