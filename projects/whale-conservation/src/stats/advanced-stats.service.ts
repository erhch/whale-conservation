/**
 * Phase 3 统计报表服务
 * 基于 Phase 2 模块数据：健康、行为、觅食、谱系
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog, BehaviorType, BehaviorIntensity } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog, FeedingMethod, AppetiteLevel } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord, RelationshipType, ConfidenceLevel, ClanType } from '../genealogy/entities/genealogy-record.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';

@Injectable()
export class AdvancedStatsService {
  constructor(
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(GenealogyRecord) private genealogyRepo: Repository<GenealogyRecord>,
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
  ) {}

  // ============================================
  // 1. 健康统计报表
  // ============================================

  /** 健康概览 */
  async getHealthOverview(): Promise<any> {
    const total = await this.healthRepo.count();
    const byType = await this.healthRepo
      .createQueryBuilder('h')
      .select('h.type', 'type').addSelect('COUNT(*)', 'count')
      .groupBy('h.type').getRawMany();
    const byStatus = await this.healthRepo
      .createQueryBuilder('h')
      .select('h.status', 'status').addSelect('COUNT(*)', 'count')
      .groupBy('h.status').getRawMany();
    const ongoing = await this.healthRepo.count({ where: { status: 'ongoing' } });
    const critical = await this.healthRepo.count({ where: { status: 'critical' } });
    const recent30 = await this.healthRepo.count({
      where: { recordDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    return {
      total,
      ongoing,
      critical,
      recent30Days: recent30,
      byType: byType.map(r => ({ type: r.type, count: parseInt(r.count) })),
      byStatus: byStatus.map(r => ({ status: r.status, count: parseInt(r.count) })),
    };
  }

  /** 某只鲸鱼的健康摘要 */
  async getWhaleHealthSummary(whaleId: string): Promise<any> {
    const records = await this.healthRepo.find({ where: { whaleId }, order: { recordDate: 'DESC' } });
    const lastCheckup = records.find(r => r.type === 'checkup');
    const activeIssues = records.filter(r => r.status === 'ongoing' || r.status === 'critical');

    return {
      whaleId,
      totalRecords: records.length,
      lastCheckup: lastCheckup ? {
        date: lastCheckup.recordDate,
        title: lastCheckup.title,
        vet: lastCheckup.vetName,
      } : null,
      activeIssues: activeIssues.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        status: r.status,
        date: r.recordDate,
      })),
    };
  }

  // ============================================
  // 2. 行为统计报表
  // ============================================

  /** 行为分布统计 */
  async getBehaviorStats(days: number = 90): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.behaviorRepo
      .createQueryBuilder('b')
      .where('b.observedAt >= :start', { start: startDate })
      .getMany();

    const behaviorCounts: Record<string, number> = {};
    const intensityCounts: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    const uniqueWhales = new Set<string>();

    for (const log of logs) {
      for (const behavior of log.behaviors) {
        behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
      }
      intensityCounts[log.intensity] = (intensityCounts[log.intensity] || 0) + 1;
      if (log.duration) { totalDuration += log.duration; durationCount++; }
      if (log.whaleId) uniqueWhales.add(log.whaleId);
    }

    const total = Object.values(behaviorCounts).reduce((a, b) => a + b, 0);

    return {
      period: { days, startDate, endDate: new Date() },
      totalLogs: logs.length,
      totalBehaviors: total,
      uniqueWhales: uniqueWhales.size,
      behaviorDistribution: Object.entries(behaviorCounts)
        .map(([type, count]) => ({ type, count, percentage: total > 0 ? Math.round(count / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
      intensityDistribution: intensityCounts,
      avgDurationSeconds: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    };
  }

  /** 某只鲸鱼的行为画像 */
  async getWhaleBehaviorProfile(whaleId: string, days: number = 90): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.behaviorRepo
      .createQueryBuilder('b')
      .where('b.whaleId = :id', { id: whaleId })
      .andWhere('b.observedAt >= :start', { start: startDate })
      .orderBy('b.observedAt', 'DESC')
      .getMany();

    const behaviorCounts: Record<string, number> = {};
    const timeOfDay: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const depthStats = logs.filter(l => l.depth).map(l => l.depth as number);

    for (const log of logs) {
      for (const b of log.behaviors) { behaviorCounts[b] = (behaviorCounts[b] || 0) + 1; }
      const hour = log.observedAt.getHours();
      if (hour >= 6 && hour < 12) timeOfDay.morning++;
      else if (hour >= 12 && hour < 18) timeOfDay.afternoon++;
      else if (hour >= 18 && hour < 21) timeOfDay.evening++;
      else timeOfDay.night++;
    }

    return {
      whaleId,
      totalLogs: logs.length,
      topBehaviors: Object.entries(behaviorCounts)
        .map(([t, c]) => ({ type: t, count: c }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      activityTimeDistribution: timeOfDay,
      avgDepth: depthStats.length > 0 ? Math.round(depthStats.reduce((a, b) => a + b, 0) / depthStats.length * 10) / 10 : null,
      maxDepth: depthStats.length > 0 ? Math.max(...depthStats) : null,
    };
  }

  // ============================================
  // 3. 觅食统计报表
  // ============================================

  /** 觅食分析 */
  async getFeedingStats(days: number = 90): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await this.feedingRepo
      .createQueryBuilder('f')
      .where('f.observedAt >= :start', { start: startDate })
      .getMany();

    const methodCounts: Record<string, number> = {};
    const appetiteCounts: Record<string, number> = {};
    const preySpecies: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let groupFeedingCount = 0;

    for (const log of logs) {
      for (const m of log.methods) { methodCounts[m] = (methodCounts[m] || 0) + 1; }
      appetiteCounts[log.appetite] = (appetiteCounts[log.appetite] || 0) + 1;
      if (log.preySpecies) preySpecies[log.preySpecies] = (preySpecies[log.preySpecies] || 0) + 1;
      if (log.feedingDuration) { totalDuration += log.feedingDuration; durationCount++; }
      if (log.groupFeeding) groupFeedingCount++;
    }

    const total = Object.values(methodCounts).reduce((a, b) => a + b, 0);

    return {
      period: { days },
      totalFeedingLogs: logs.length,
      methodDistribution: Object.entries(methodCounts)
        .map(([m, c]) => ({ method: m, count: c, percentage: total > 0 ? Math.round(c / total * 100) : 0 }))
        .sort((a, b) => b.count - a.count),
      appetiteDistribution: appetiteCounts,
      topPreySpecies: Object.entries(preySpecies)
        .map(([s, c]) => ({ species: s, count: c }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      avgFeedingDurationMin: durationCount > 0 ? Math.round(totalDuration / durationCount * 10) / 10 : null,
      groupFeedingRate: logs.length > 0 ? Math.round(groupFeedingCount / logs.length * 100) : 0,
    };
  }

  // ============================================
  // 4. 谱系统计报表
  // ============================================

  /** 谱系概览 */
  async getGenealogyOverview(): Promise<any> {
    const total = await this.genealogyRepo.count();
    const byType = await this.genealogyRepo
      .createQueryBuilder('g')
      .select('g.relationshipType', 'type').addSelect('COUNT(*)', 'count')
      .groupBy('g.relationshipType').getRawMany();
    const byConfidence = await this.genealogyRepo
      .createQueryBuilder('g')
      .select('g.confidence', 'confidence').addSelect('COUNT(*)', 'count')
      .groupBy('g.confidence').getRawMany();

    const confirmed = byConfidence.find(r => r.confidence === 'confirmed');
    const confirmedCount = confirmed ? parseInt(confirmed.count) : 0;

    return {
      total,
      byType: byType.map(r => ({ type: r.type, count: parseInt(r.count) })),
      byConfidence: byConfidence.map(r => ({ confidence: r.confidence, count: parseInt(r.count) })),
      confirmedCount,
      confidenceRate: total > 0 ? Math.round(confirmedCount / total * 100) : 0,
    };
  }

  /** 族群分布统计 */
  async getClanDistribution(): Promise<any> {
    const result = await this.genealogyRepo
      .createQueryBuilder('g')
      .leftJoin('g.whale', 'whale')
      .select('p.clan', 'clan')
      .addSelect('COUNT(DISTINCT whale.id)', 'count')
      .innerJoin('whale.pedigree', 'p')
      .groupBy('p.clan')
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map(r => ({
      clan: r.clan || 'unknown',
      count: parseInt(r.count),
      percentage: total > 0 ? Math.round(parseInt(r.count) / total * 100) : 0,
    }));
  }

  // ============================================
  // 5. 综合报表
  // ============================================

  /** 综合数据概览 (Dashboard) */
  async getDashboard(): Promise<any> {
    const [healthOverview, behaviorStats, feedingStats, genealogyOverview] = await Promise.all([
      this.getHealthOverview(),
      this.getBehaviorStats(30),
      this.getFeedingStats(30),
      this.getGenealogyOverview(),
    ]);

    const totalWhales = await this.whaleRepo.count();
    const totalSightings = await this.sightingRepo.count();

    return {
      population: { totalWhales },
      sightings: { totalSightings },
      health: healthOverview,
      behavior: {
        totalLogs: behaviorStats.totalLogs,
        uniqueWhales: behaviorStats.uniqueWhales,
        topBehavior: behaviorStats.behaviorDistribution[0]?.type || null,
      },
      feeding: {
        totalLogs: feedingStats.totalFeedingLogs,
        topMethod: feedingStats.methodDistribution[0]?.method || null,
        groupFeedingRate: feedingStats.groupFeedingRate,
      },
      genealogy: genealogyOverview,
    };
  }
}
