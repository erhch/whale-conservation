/**
 * 鲸鱼个体服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Whale, LifeStatus } from './entities/whale.entity';
import { CreateWhaleDto, UpdateWhaleDto } from './dto';
import { Sighting } from '../sightings/entities/sighting.entity';

interface FindWhalesOptions {
  page: number;
  limit: number;
  speciesId?: string;
  sex?: string;
  active?: boolean;
}

interface FindSightingsOptions {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class WhalesService {
  constructor(
    @InjectRepository(Whale)
    private whaleRepository: Repository<Whale>,
  ) {}

  async findAll(options: FindWhalesOptions): Promise<{ data: Whale[]; total: number; page: number; limit: number }> {
    const { page, limit, speciesId, sex, active } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 物种筛选
    if (speciesId) {
      where.speciesId = speciesId;
    }

    // 性别筛选
    if (sex) {
      where.sex = sex;
    }

    // 生命状态筛选 (active=true 仅显示存活个体)
    if (active !== undefined && active === true) {
      where.lifeStatus = LifeStatus.ALIVE;
    }

    const [data, total] = await this.whaleRepository.findAndCount({
      where,
      relations: ['species'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Whale> {
    const whale = await this.whaleRepository.findOne({
      where: { id },
      relations: ['species', 'sightings'],
    });
    if (!whale) {
      throw new NotFoundException('鲸鱼个体不存在');
    }
    return whale;
  }

  async create(createWhaleDto: CreateWhaleDto): Promise<Whale> {
    const whale = this.whaleRepository.create(createWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async update(id: string, updateWhaleDto: UpdateWhaleDto): Promise<Whale> {
    const whale = await this.findOne(id);
    Object.assign(whale, updateWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.whaleRepository.delete(id);
  }

  /**
   * 搜索鲸鱼个体 - 支持按编号、昵称、备注模糊搜索
   */
  async search(query: string): Promise<Whale[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    return this.whaleRepository
      .createQueryBuilder('whale')
      .leftJoinAndSelect('whale.species', 'species')
      .where('whale.identifier LIKE :term', { term: searchTerm })
      .orWhere('whale.name LIKE :term', { term: searchTerm })
      .orWhere('whale.notes LIKE :term', { term: searchTerm })
      .orderBy('whale.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 获取某只鲸鱼的观测记录 (支持分页和日期范围筛选)
   */
  async findSightings(
    whaleId: string,
    options: FindSightingsOptions,
  ): Promise<{ data: Sighting[]; total: number; page: number; limit: number }> {
    const { page, limit, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    // 验证鲸鱼是否存在
    const whale = await this.whaleRepository.findOne({ where: { id: whaleId } });
    if (!whale) {
      throw new NotFoundException('鲸鱼个体不存在');
    }

    const queryBuilder = this.whaleRepository
      .createQueryBuilder('whale')
      .leftJoinAndSelect('whale.sightings', 'sighting')
      .leftJoinAndSelect('sighting.station', 'station')
      .leftJoinAndSelect('sighting.observer', 'observer')
      .where('whale.id = :whaleId', { whaleId })
      .orderBy('sighting.observedAt', 'DESC')
      .skip(skip)
      .take(limit);

    // 日期范围筛选
    if (startDate) {
      queryBuilder.andWhere('sighting.observedAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('sighting.observedAt <= :endDate', { endDate });
    }

    const result = await queryBuilder.getManyAndCount();
    const sightings = result[0].length > 0 ? result[0][0].sightings : [];
    const total = result[1];

    return { data: sightings, total, page, limit };
  }

  /**
   * 获取鲸鱼迁徙轨迹 (基于观测记录的时间和位置序列)
   * @param whaleId 鲸鱼 ID
   * @param days 回溯天数，默认 365 天
   * @returns 迁徙轨迹数据，包含位置点序列和统计信息
   */
  async getMigrations(whaleId: string, days: number = 365): Promise<{
    whaleId: string;
    whaleName: string | null;
    identifier: string;
    species: string | null;
    trackPoints: Array<{
      observedAt: Date;
      location: {
        type: string;
        coordinates: [number, number];
      };
      locationName: string | null;
      stationName: string | null;
      behavior: string | null;
      groupSize: number | null;
    }>;
    summary: {
      totalPoints: number;
      dateRange: {
        start: Date | null;
        end: Date | null;
      };
      boundingBox: {
        minLat: number | null;
        maxLat: number | null;
        minLng: number | null;
        maxLng: number | null;
      } | null;
      distinctLocations: number;
    };
  }> {
    // 验证鲸鱼是否存在
    const whale = await this.whaleRepository.findOne({
      where: { id: whaleId },
      relations: ['species'],
    });
    if (!whale) {
      throw new NotFoundException('鲸鱼个体不存在');
    }

    // 计算日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 查询观测记录，按时间正序排列 (迁徙轨迹需要从早到晚)
    const sightings = await this.whaleRepository
      .createQueryBuilder('whale')
      .leftJoinAndSelect('whale.sightings', 'sighting')
      .leftJoinAndSelect('sighting.station', 'station')
      .where('whale.id = :whaleId', { whaleId })
      .andWhere('sighting.observedAt >= :startDate', { startDate })
      .andWhere('sighting.observedAt <= :endDate', { endDate })
      .orderBy('sighting.observedAt', 'ASC')
      .getMany();

    // 提取轨迹点
    const trackPoints: Array<{
      observedAt: Date;
      location: { type: string; coordinates: [number, number] };
      locationName: string | null;
      stationName: string | null;
      behavior: string | null;
      groupSize: number | null;
    }> = [];

    let minLat: number | null = null;
    let maxLat: number | null = null;
    let minLng: number | null = null;
    let maxLng: number | null = null;
    const locationSet = new Set<string>();

    if (sightings.length > 0 && sightings[0].sightings) {
      for (const sighting of sightings[0].sightings) {
        if (sighting.latitude != null && sighting.longitude != null) {
          const lat = sighting.latitude;
          const lng = sighting.longitude;

          // 更新边界框
          if (minLat === null || lat < minLat) minLat = lat;
          if (maxLat === null || lat > maxLat) maxLat = lat;
          if (minLng === null || lng < minLng) minLng = lng;
          if (maxLng === null || lng > maxLng) maxLng = lng;

          // 记录不同位置数量 (基于坐标的近似去重)
          const locKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
          locationSet.add(locKey);

          trackPoints.push({
            observedAt: sighting.observedAt,
            location: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            locationName: sighting.locationName || null,
            stationName: sighting.station?.name || null,
            behavior: sighting.behavior || null,
            groupSize: sighting.groupSize || null,
          });
        }
      }
    }

    // 计算日期范围
    const dateRange = {
      start: trackPoints.length > 0 ? trackPoints[0].observedAt : null,
      end: trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].observedAt : null,
    };

    return {
      whaleId,
      whaleName: whale.name,
      identifier: whale.identifier,
      species: whale.species?.commonNameZh || whale.species?.scientificName || null,
      trackPoints,
      summary: {
        totalPoints: trackPoints.length,
        dateRange,
        boundingBox:
          trackPoints.length > 0
            ? { minLat, maxLat, minLng, maxLng }
            : null,
        distinctLocations: locationSet.size,
      },
    };
  }
}
