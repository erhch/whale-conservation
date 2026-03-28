/**
 * 统计分析服务
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { Species } from '../species/entities/species.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { Station } from '../stations/entities/station.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Species)
    private speciesRepository: Repository<Species>,
    @InjectRepository(Whale)
    private whaleRepository: Repository<Whale>,
    @InjectRepository(Sighting)
    private sightingRepository: Repository<Sighting>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  /**
   * 获取总体统计
   */
  async getOverview() {
    const speciesCount = await this.speciesRepository.count({ where: { isActive: true } });
    const whaleCount = await this.whaleRepository.count({ where: { lifeStatus: 'alive' } });
    const sightingCount = await this.sightingRepository.count();
    const stationCount = await this.stationRepository.count({ where: { status: 'active' } });

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
      stations: {
        total: stationCount,
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

  /**
   * 监测站点统计
   */
  async getStationStats() {
    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('station.id', 'id')
      .addSelect('station.code', 'code')
      .addSelect('station.name', 'name')
      .addSelect('station.type', 'type')
      .addSelect('station.status', 'status')
      .addSelect('COUNT(sighting.id)', 'sightingCount')
      .innerJoin('sighting.station', 'station')
      .groupBy('station.id')
      .addGroupBy('station.code')
      .addGroupBy('station.name')
      .addGroupBy('station.type')
      .addGroupBy('station.status')
      .orderBy('sightingCount', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      status: item.status,
      sightingCount: parseInt(item.sightingCount, 10),
    }));
  }

  /**
   * 鲸鱼个体状态分布统计
   */
  async getWhaleStatusBreakdown() {
    const result = await this.whaleRepository
      .createQueryBuilder('whale')
      .select('whale.lifeStatus', 'status')
      .addSelect('COUNT(whale.id)', 'count')
      .groupBy('whale.lifeStatus')
      .getRawMany();

    const breakdown = {
      alive: 0,
      deceased: 0,
      missing: 0,
    };

    result.forEach((item) => {
      if (item.status) {
        breakdown[item.status as keyof typeof breakdown] = parseInt(item.count, 10);
      }
    });

    const total = breakdown.alive + breakdown.deceased + breakdown.missing;

    return {
      total,
      breakdown,
      survivalRate: total > 0 ? Math.round((breakdown.alive / total) * 100) : 0,
    };
  }

  /**
   * 鲸鱼性别分布统计
   */
  async getWhaleSexDistribution() {
    const result = await this.whaleRepository
      .createQueryBuilder('whale')
      .select('whale.sex', 'sex')
      .addSelect('COUNT(whale.id)', 'count')
      .groupBy('whale.sex')
      .getRawMany();

    const distribution = {
      male: 0,
      female: 0,
      unknown: 0,
    };

    result.forEach((item) => {
      if (item.sex === 'M') {
        distribution.male = parseInt(item.count, 10);
      } else if (item.sex === 'F') {
        distribution.female = parseInt(item.count, 10);
      } else {
        distribution.unknown = parseInt(item.count, 10);
      }
    });

    const total = distribution.male + distribution.female + distribution.unknown;

    return {
      total,
      distribution,
      sexRatio: distribution.female > 0 ? (distribution.male / distribution.female).toFixed(2) : 'N/A',
    };
  }

  /**
   * 物种出现频率统计
   * 按观测记录数量统计各物种的出现频率
   */
  async getSpeciesFrequency() {
    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('species.commonNameZh', 'name')
      .addSelect('species.scientificName', 'scientificName')
      .addSelect('COUNT(sighting.id)', 'count')
      .innerJoin('sighting.whale', 'whale')
      .innerJoin('whale.species', 'species')
      .groupBy('species.id')
      .addGroupBy('species.commonNameZh')
      .addGroupBy('species.scientificName')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalSightings = result.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    return result.map((item) => ({
      name: item.name,
      scientificName: item.scientificName,
      count: parseInt(item.count, 10),
      percentage: totalSightings > 0 ? Math.round((parseInt(item.count, 10) / totalSightings) * 100) : 0,
    }));
  }
}
