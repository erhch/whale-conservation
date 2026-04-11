/**
 * 观测记录服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sighting } from './entities/sighting.entity';
import { CreateSightingDto, UpdateSightingDto } from './dto';

@Injectable()
export class SightingsService {
  constructor(
    @InjectRepository(Sighting)
    private sightingRepository: Repository<Sighting>,
  ) {}

  async findAll(options?: { page?: number; limit?: number; whaleId?: string; stationId?: string }): Promise<{ data: Sighting[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    
    const queryBuilder = this.sightingRepository.createQueryBuilder('sighting')
      .leftJoinAndSelect('sighting.whale', 'whale')
      .leftJoinAndSelect('sighting.station', 'station')
      .leftJoinAndSelect('sighting.observer', 'observer')
      .orderBy('sighting.sightedAt', 'DESC');

    if (options?.whaleId) {
      queryBuilder.andWhere('sighting.whaleId = :whaleId', { whaleId: options.whaleId });
    }
    if (options?.stationId) {
      queryBuilder.andWhere('sighting.stationId = :stationId', { stationId: options.stationId });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Sighting> {
    const sighting = await this.sightingRepository.findOne({
      where: { id },
      relations: ['whale', 'station', 'observer'],
    });
    if (!sighting) {
      throw new NotFoundException('观测记录不存在');
    }
    return sighting;
  }

  async create(createSightingDto: CreateSightingDto): Promise<Sighting> {
    const sighting = this.sightingRepository.create(createSightingDto);
    return this.sightingRepository.save(sighting);
  }

  async update(id: string, updateSightingDto: UpdateSightingDto): Promise<Sighting> {
    const sighting = await this.findOne(id);
    Object.assign(sighting, updateSightingDto);
    return this.sightingRepository.save(sighting);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.sightingRepository.delete(id);
  }

  async findByWhale(whaleId: string): Promise<Sighting[]> {
    return this.sightingRepository.find({
      where: { whaleId },
      relations: ['station', 'observer'],
      order: { sightedAt: 'DESC' },
    });
  }

  /**
   * 获取观测统计信息
   * @param options 统计选项
   * @returns 统计数据
   */
  async getStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
    whaleId?: string;
    stationId?: string;
  }): Promise<{
    total: number;
    verifiedCount: number;
    uniqueWhales: number;
    avgGroupSize: number;
    topLocations: Array<{ locationName: string; count: number }>;
    recentTrend: Array<{ date: string; count: number }>;
  }> {
    const queryBuilder = this.sightingRepository.createQueryBuilder('sighting');

    // 日期范围筛选
    if (options?.startDate) {
      queryBuilder.andWhere('sighting.sightedAt >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      queryBuilder.andWhere('sighting.sightedAt <= :endDate', { endDate: options.endDate });
    }
    if (options?.whaleId) {
      queryBuilder.andWhere('sighting.whaleId = :whaleId', { whaleId: options.whaleId });
    }
    if (options?.stationId) {
      queryBuilder.andWhere('sighting.stationId = :stationId', { stationId: options.stationId });
    }

    // 总记录数
    const total = await queryBuilder.getCount();

    // 已验证记录数
    const verifiedCount = await queryBuilder
      .clone()
      .andWhere('sighting.isVerified = :verified', { verified: true })
      .getCount();

    // 唯一鲸鱼数量
    const uniqueWhalesResult = await queryBuilder
      .clone()
      .select('COUNT(DISTINCT sighting.whaleId)', 'count')
      .where('sighting.whaleId IS NOT NULL')
      .getRawOne();
    const uniqueWhales = parseInt(uniqueWhalesResult?.count || '0', 10);

    // 平均群体数量
    const avgGroupSizeResult = await queryBuilder
      .clone()
      .select('AVG(sighting.groupSize)', 'avg')
      .where('sighting.groupSize IS NOT NULL')
      .getRawOne();
    const avgGroupSize = parseFloat(avgGroupSizeResult?.avg || '0');

    // 热门观测地点 TOP 5
    const topLocations = await queryBuilder
      .clone()
      .select('sighting.locationName', 'locationName')
      .addSelect('COUNT(*)', 'count')
      .where('sighting.locationName IS NOT NULL')
      .groupBy('sighting.locationName')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // 近 7 天观测趋势
    const recentTrend = await queryBuilder
      .clone()
      .select("DATE_TRUNC('day', sighting.sightedAt)::date", 'date')
      .addSelect('COUNT(*)', 'count')
      .andWhere("sighting.sightedAt >= NOW() - INTERVAL '7 days'")
      .groupBy("DATE_TRUNC('day', sighting.sightedAt)::date")
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      total,
      verifiedCount,
      uniqueWhales,
      avgGroupSize: Math.round(avgGroupSize * 100) / 100,
      topLocations: topLocations.map((r) => ({
        locationName: r.locationName,
        count: parseInt(r.count, 10),
      })),
      recentTrend: recentTrend.map((r) => ({
        date: r.date,
        count: parseInt(r.count, 10),
      })),
    };
  }

  /**
   * 搜索观测记录 (按地点/行为/备注模糊搜索)
   * @param query 搜索关键词
   * @returns 观测记录列表
   */
  async search(query: string): Promise<Sighting[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    return this.sightingRepository
      .createQueryBuilder('sighting')
      .leftJoinAndSelect('sighting.whale', 'whale')
      .leftJoinAndSelect('sighting.station', 'station')
      .leftJoinAndSelect('sighting.observer', 'observer')
      .where(
        '(sighting.locationName LIKE :term OR sighting.behavior LIKE :term OR sighting.notes LIKE :term)',
        { term: searchTerm },
      )
      .orderBy('sighting.sightedAt', 'DESC')
      .getMany();
  }

  /**
   * 获取最近观测记录
   * @param limit 返回数量 (默认 10，最大 100)
   * @param offset 偏移量 (默认 0)
   * @returns 最近观测记录列表 (含分页元数据)
   */
  async getRecent(limit: number = 10, offset: number = 0): Promise<{
    data: Array<{
      id: string;
      sightedAt: Date;
      location: string;
      behavior: string | null;
      groupSize: number | null;
      whale: {
        id: string;
        identifier: string;
        name: string | null;
        species: string | null;
        scientificName: string | null;
      } | null;
      station: {
        code: string;
        name: string;
      } | null;
    }>;
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const [results, total] = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('sighting.id', 'id')
      .addSelect('sighting.sightedAt', 'sightedAt')
      .addSelect('sighting.locationName', 'location')
      .addSelect('sighting.behavior', 'behavior')
      .addSelect('sighting.groupSize', 'groupSize')
      .addSelect('whale.id', 'whaleId')
      .addSelect('whale.identifier', 'whaleIdentifier')
      .addSelect('whale.name', 'whaleName')
      .addSelect('species.commonNameZh', 'speciesName')
      .addSelect('species.scientificName', 'scientificName')
      .addSelect('station.code', 'stationCode')
      .addSelect('station.name', 'stationName')
      .innerJoin('sighting.whale', 'whale')
      .innerJoin('whale.species', 'species')
      .leftJoin('sighting.station', 'station')
      .orderBy('sighting.sightedAt', 'DESC')
      .limit(safeLimit)
      .offset(safeOffset)
      .getManyAndCount();

    const data = results.map((item: any) => ({
      id: item.id,
      sightedAt: item.sightedAt,
      location: item.location,
      behavior: item.behavior,
      groupSize: item.groupSize ? parseInt(item.groupSize, 10) : null,
      whale: item.whaleId
        ? {
            id: item.whaleId,
            identifier: item.whaleIdentifier,
            name: item.whaleName,
            species: item.speciesName,
            scientificName: item.scientificName,
          }
        : null,
      station: item.stationCode
        ? {
            code: item.stationCode,
            name: item.stationName,
          }
        : null,
    }));

    return {
      data,
      pagination: {
        limit: safeLimit,
        offset: safeOffset,
        total,
        hasMore: safeOffset + safeLimit < total,
      },
    };
  }

  /**
   * 导出观测记录为 CSV 格式
   * @param options 导出选项
   * @returns CSV 字符串
   */
  async exportToCSV(options?: {
    startDate?: Date;
    endDate?: Date;
    whaleId?: string;
    stationId?: string;
    limit?: number;
  }): Promise<string> {
    const queryBuilder = this.sightingRepository.createQueryBuilder('sighting')
      .leftJoinAndSelect('sighting.whale', 'whale')
      .leftJoinAndSelect('sighting.station', 'station')
      .leftJoinAndSelect('sighting.observer', 'observer')
      .orderBy('sighting.sightedAt', 'DESC');

    // 筛选条件
    if (options?.startDate) {
      queryBuilder.andWhere('sighting.sightedAt >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      queryBuilder.andWhere('sighting.sightedAt <= :endDate', { endDate: options.endDate });
    }
    if (options?.whaleId) {
      queryBuilder.andWhere('sighting.whaleId = :whaleId', { whaleId: options.whaleId });
    }
    if (options?.stationId) {
      queryBuilder.andWhere('sighting.stationId = :stationId', { stationId: options.stationId });
    }

    // 限制导出数量 (默认最大 1000 条)
    const limit = Math.min(options?.limit || 1000, 1000);
    queryBuilder.take(limit);

    const sightings = await queryBuilder.getMany();

    // CSV 头部
    const headers = [
      'ID',
      '观测时间',
      '鲸鱼编号',
      '鲸鱼昵称',
      '物种名称',
      '站点名称',
      '观测者',
      '纬度',
      '经度',
      '地点名称',
      '行为',
      '群体数量',
      '天气',
      '海况等级',
      '备注',
      '照片数量',
      '是否验证',
      '创建时间',
    ];

    // CSV 行数据
    const rows = sightings.map((s) => [
      s.id,
      s.sightedAt.toISOString(),
      s.whale?.identifier || '',
      s.whale?.name || '',
      s.whale?.species?.commonNameZh || '',
      s.station?.name || '',
      s.observer?.nickname || s.observer?.username || '',
      s.latitude.toString(),
      s.longitude.toString(),
      s.locationName || '',
      s.behavior || '',
      s.groupSize?.toString() || '',
      s.weather || '',
      s.seaState?.toString() || '',
      s.notes || '',
      s.photoUrls?.length.toString() || '0',
      s.isVerified ? '是' : '否',
      s.createdAt.toISOString(),
    ]);

    // 构建 CSV 内容
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      csvRows.push(
        row
          .map((cell) => {
            // 处理包含逗号、引号或换行的字段
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(','),
      );
    }

    return csvRows.join('\n');
  }
}
