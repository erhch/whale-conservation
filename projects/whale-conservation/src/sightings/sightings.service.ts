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
      .orderBy('sighting.observedAt', 'DESC');

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
      order: { observedAt: 'DESC' },
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
      queryBuilder.andWhere('sighting.observedAt >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      queryBuilder.andWhere('sighting.observedAt <= :endDate', { endDate: options.endDate });
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
      .select("DATE_TRUNC('day', sighting.observedAt)::date", 'date')
      .addSelect('COUNT(*)', 'count')
      .andWhere("sighting.observedAt >= NOW() - INTERVAL '7 days'")
      .groupBy("DATE_TRUNC('day', sighting.observedAt)::date")
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
}
