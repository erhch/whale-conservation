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

  /**
   * 热门观测地点排行
   * 返回观测记录数量最多的前 N 个地点
   */
  async getTopLocations(limit: number = 10) {
    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('station.id', 'id')
      .addSelect('station.code', 'code')
      .addSelect('station.name', 'name')
      .addSelect('station.type', 'type')
      .addSelect('station.location', 'location')
      .addSelect('COUNT(sighting.id)', 'count')
      .innerJoin('sighting.station', 'station')
      .groupBy('station.id')
      .addGroupBy('station.code')
      .addGroupBy('station.name')
      .addGroupBy('station.type')
      .addGroupBy('station.location')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    const totalSightings = result.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    return result.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      location: item.location,
      count: parseInt(item.count, 10),
      percentage: totalSightings > 0 ? Math.round((parseInt(item.count, 10) / totalSightings) * 100) : 0,
    }));
  }

  /**
   * 周度统计
   * 按周统计观测记录数量
   */
  async getWeeklyStats(weeks: number = 12) {
    const startDate = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select("DATE_TRUNC('week', sighting.observedAt)", 'week')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('week', sighting.observedAt)")
      .orderBy("DATE_TRUNC('week', sighting.observedAt)", 'ASC')
      .getRawMany();

    return result.map((item) => ({
      week: item.week,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 月度统计
   * 按月份统计观测记录数量
   */
  async getMonthlyStats(months: number = 12) {
    const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select("DATE_TRUNC('month', sighting.observedAt)", 'month')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('month', sighting.observedAt)")
      .orderBy("DATE_TRUNC('month', sighting.observedAt)", 'ASC')
      .getRawMany();

    return result.map((item) => ({
      month: item.month,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 季度统计
   * 按季度统计观测记录数量
   */
  async getQuarterlyStats(quarters: number = 8) {
    const startDate = new Date(Date.now() - quarters * 90 * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select("DATE_TRUNC('quarter', sighting.observedAt)", 'quarter')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('quarter', sighting.observedAt)")
      .orderBy("DATE_TRUNC('quarter', sighting.observedAt)", 'ASC')
      .getRawMany();

    return result.map((item) => ({
      quarter: item.quarter,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 年度统计
   * 按年度统计观测记录数量
   */
  async getYearlyStats(years: number = 10) {
    const startDate = new Date(Date.now() - years * 365 * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select("DATE_TRUNC('year', sighting.observedAt)", 'year')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('year', sighting.observedAt)")
      .orderBy("DATE_TRUNC('year', sighting.observedAt)", 'ASC')
      .getRawMany();

    return result.map((item) => ({
      year: item.year,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 活跃鲸鱼个体排行
   * 返回观测记录数量最多的前 N 只鲸鱼
   */
  async getActiveWhales(limit: number = 10, days: number = 90) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('whale.id', 'id')
      .addSelect('whale.identifier', 'identifier')
      .addSelect('whale.name', 'name')
      .addSelect('species.commonNameZh', 'species')
      .addSelect('whale.lastSightedLocation', 'lastLocation')
      .addSelect('MAX(sighting.observedAt)', 'lastSightedAt')
      .addSelect('COUNT(sighting.id)', 'count')
      .innerJoin('sighting.whale', 'whale')
      .innerJoin('whale.species', 'species')
      .where('sighting.observedAt >= :startDate', { startDate })
      .groupBy('whale.id')
      .addGroupBy('whale.identifier')
      .addGroupBy('whale.name')
      .addGroupBy('species.commonNameZh')
      .addGroupBy('whale.lastSightedLocation')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      identifier: item.identifier,
      name: item.name,
      species: item.species,
      lastLocation: item.lastLocation,
      lastSightedAt: item.lastSightedAt,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 最近观测记录
   * 返回最新的观测记录列表 (支持分页)
   */
  async getRecentSightings(limit: number = 10, offset: number = 0) {
    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('sighting.id', 'id')
      .addSelect('sighting.observedAt', 'observedAt')
      .addSelect('sighting.location', 'location')
      .addSelect('sighting.behavior', 'behavior')
      .addSelect('sighting.groupSize', 'groupSize')
      .addSelect('whale.id', 'whaleId')
      .addSelect('whale.identifier', 'whaleIdentifier')
      .addSelect('whale.name', 'whaleName')
      .addSelect('species.commonNameZh', 'species')
      .addSelect('species.scientificName', 'scientificName')
      .addSelect('station.code', 'stationCode')
      .addSelect('station.name', 'stationName')
      .innerJoin('sighting.whale', 'whale')
      .innerJoin('whale.species', 'species')
      .leftJoin('sighting.station', 'station')
      .orderBy('sighting.observedAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getRawMany();

    return result.map((item) => ({
      id: item.id,
      observedAt: item.observedAt,
      location: item.location,
      behavior: item.behavior,
      groupSize: item.groupSize ? parseInt(item.groupSize, 10) : null,
      whale: {
        id: item.whaleId,
        identifier: item.whaleIdentifier,
        name: item.whaleName,
        species: item.species,
        scientificName: item.scientificName,
      },
      station: item.stationCode
        ? {
            code: item.stationCode,
            name: item.stationName,
          }
        : null,
    }));
  }

  /**
   * 获取最近观测记录总数 (用于分页)
   */
  async getRecentSightingsTotal() {
    return await this.sightingRepository.count();
  }

  /**
   * 获取指定物种的详细统计
   * @param speciesId 物种 ID
   */
  async getSpeciesStats(speciesId: string) {
    // 获取物种基本信息
    const species = await this.speciesRepository.findOne({
      where: { id: speciesId, isActive: true },
      select: ['id', 'scientificName', 'commonNameZh', 'commonNameEn', 'iucnStatus'],
    });

    if (!species) {
      throw new Error(`Species with id ${speciesId} not found`);
    }

    // 获取该物种的鲸鱼个体总数
    const totalWhales = await this.whaleRepository.count({
      where: { speciesId },
    });

    // 获取存活个体数
    const aliveWhales = await this.whaleRepository.count({
      where: { speciesId, lifeStatus: 'alive' },
    });

    // 获取性别分布
    const sexDistribution = await this.whaleRepository
      .createQueryBuilder('whale')
      .select('whale.sex', 'sex')
      .addSelect('COUNT(whale.id)', 'count')
      .where('whale.speciesId = :speciesId', { speciesId })
      .groupBy('whale.sex')
      .getRawMany();

    // 获取观测记录总数
    const totalSightings = await this.sightingRepository
      .createQueryBuilder('sighting')
      .innerJoin('sighting.whale', 'whale')
      .where('whale.speciesId = :speciesId', { speciesId })
      .getCount();

    // 获取最近 30 天观测记录数
    const recentSightings = await this.sightingRepository
      .createQueryBuilder('sighting')
      .innerJoin('sighting.whale', 'whale')
      .where('whale.speciesId = :speciesId', { speciesId })
      .andWhere('sighting.observedAt >= :startDate', {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    // 获取平均群体大小
    const avgGroupSize = await this.sightingRepository
      .createQueryBuilder('sighting')
      .innerJoin('sighting.whale', 'whale')
      .select('AVG(sighting.groupSize)', 'avg')
      .where('whale.speciesId = :speciesId', { speciesId })
      .andWhere('sighting.groupSize IS NOT NULL')
      .getRawOne();

    // 获取热门观测地点 (Top 5)
    const topLocations = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('sighting.locationName', 'location')
      .addSelect('COUNT(sighting.id)', 'count')
      .innerJoin('sighting.whale', 'whale')
      .where('whale.speciesId = :speciesId', { speciesId })
      .andWhere('sighting.locationName IS NOT NULL')
      .groupBy('sighting.locationName')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // 格式化性别分布
    const sexBreakdown: Record<string, number> = {};
    let totalSexCount = 0;
    sexDistribution.forEach((item) => {
      const sex = item.sex || 'unknown';
      const count = parseInt(item.count, 10);
      sexBreakdown[sex] = count;
      totalSexCount += count;
    });

    return {
      species: {
        id: species.id,
        scientificName: species.scientificName,
        commonNameZh: species.commonNameZh,
        commonNameEn: species.commonNameEn,
        iucnStatus: species.iucnStatus,
      },
      population: {
        total: totalWhales,
        alive: aliveWhales,
        survivalRate: totalWhales > 0 ? Math.round((aliveWhales / totalWhales) * 100) : 0,
      },
      sexDistribution: {
        breakdown: sexBreakdown,
        total: totalSexCount,
      },
      sightings: {
        total: totalSightings,
        recent30Days: recentSightings,
        avgGroupSize: avgGroupSize?.avg ? Math.round(parseFloat(avgGroupSize.avg) * 10) / 10 : null,
      },
      topLocations: topLocations.map((item, index) => ({
        rank: index + 1,
        location: item.location,
        count: parseInt(item.count, 10),
      })),
    };
  }

  /**
   * 观测行为分布统计
   * 统计各种行为 (feeding/breaching/socializing 等) 的出现频率
   */
  async getBehaviorDistribution() {
    const result = await this.sightingRepository
      .createQueryBuilder('sighting')
      .select('sighting.behavior', 'behavior')
      .addSelect('COUNT(sighting.id)', 'count')
      .where('sighting.behavior IS NOT NULL')
      .groupBy('sighting.behavior')
      .orderBy('count', 'DESC')
      .getRawMany();

    const totalSightings = result.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

    return result.map((item) => ({
      behavior: item.behavior,
      count: parseInt(item.count, 10),
      percentage: totalSightings > 0 ? Math.round((parseInt(item.count, 10) / totalSightings) * 100) : 0,
    }));
  }
}
