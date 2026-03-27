/**
 * 统计分析服务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { Species } from '../species/entities/species.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Species)
    private speciesRepository: Repository<Species>,
    @InjectRepository(Whale)
    private whaleRepository: Repository<Whale>,
    @InjectRepository(Sighting)
    private sightingRepository: Repository<Sighting>,
  ) {}

  /**
   * 获取总体统计
   */
  async getOverview() {
    const speciesCount = await this.speciesRepository.count({ where: { isActive: true } });
    const whaleCount = await this.whaleRepository.count({ where: { lifeStatus: 'alive' } });
    const sightingCount = await this.sightingRepository.count();

    const recentSightings = await this.sightingRepository.count({
      where: { observedAt: MoreThan(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) }, // 最近 30 天
    });

    return {
      species: {
        total: speciesCount,
      },
      whales: {
        total: whaleCount,
      },
      sightings: {
        total: sightingCount,
        recent30Days: recentSightings,
      },
    };
  }

  /**
   * 物种分布统计
   */
  async getSpeciesDistribution() {
    const result = await this.whaleRepository
      .createQueryBuilder('whale')
      .select('species.commonNameZh', 'name')
      .addSelect('species.scientificName', 'scientificName')
      .addSelect('COUNT(whale.id)', 'count')
      .innerJoin('whale.species', 'species')
      .groupBy('species.id')
      .addGroupBy('species.commonNameZh')
      .addGroupBy('species.scientificName')
      .getRawMany();

    return result.map((item) => ({
      name: item.name,
      scientificName: item.scientificName,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 观测趋势统计
   */
  async getSightingsTrend(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select("DATE_TRUNC('day', sighting.observedAt)", 'date')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', sighting.observedAt)")
      .orderBy("DATE_TRUNC('day', sighting.observedAt)", 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));
  }
}
