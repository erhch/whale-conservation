/**
 * 管理后台控制器
 * Phase 8: 管理后台 — 用户管理、系统设置、仪表盘
 */

import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, ParseBoolPipe,
} from '@nestjs/common';
import { StationStatus } from '../stations/entities/station.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { Species } from '../species/entities/species.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Station } from '../stations/entities/station.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';

@ApiTags('Phase 8 管理后台')
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminController {
  constructor(
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
    @InjectRepository(Species) private speciesRepo: Repository<Species>,
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(GenealogyRecord) private genealogyRepo: Repository<GenealogyRecord>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(Station) private stationRepo: Repository<Station>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: '管理后台仪表盘 — 全系统概览' })
  async getDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalWhales, aliveWhales, deceasedWhales,
      totalSightings, recentSightings, weeklySightings,
      totalSpecies, activeSpecies,
      totalHealth, criticalHealth,
      totalBehavior, weeklyBehavior,
      totalFeeding, weeklyFeeding,
      totalGenealogy, confirmedGenealogy,
      totalAudit, weeklyAudit,
      pendingNotifs, criticalNotifs,
      totalStations, activeStations,
    ] = await Promise.all([
      this.whaleRepo.count(),
      this.whaleRepo.count({ where: { lifeStatus: 'alive' as any } }),
      this.whaleRepo.count({ where: { lifeStatus: 'deceased' as any } }),
      this.sightingRepo.count(),
      this.sightingRepo.count({ where: { sightedAt: MoreThan(thirtyDaysAgo) } }),
      this.sightingRepo.count({ where: { sightedAt: MoreThan(sevenDaysAgo) } }),
      this.speciesRepo.count(),
      this.speciesRepo.count({ where: { isActive: true } }),
      this.healthRepo.count(),
      this.healthRepo.count({ where: { status: 'critical' as any } }),
      this.behaviorRepo.count(),
      this.behaviorRepo.count({ where: { sightedAt: MoreThan(sevenDaysAgo) } }),
      this.feedingRepo.count(),
      this.feedingRepo.count({ where: { sightedAt: MoreThan(sevenDaysAgo) } }),
      this.genealogyRepo.count(),
      this.genealogyRepo.count({ where: { confidence: 'confirmed' as any } }),
      this.auditRepo.count(),
      this.auditRepo.count({ where: { createdAt: MoreThan(sevenDaysAgo) } }),
      this.notifRepo.count({ where: { status: 'pending' as any } }),
      this.notifRepo.count({ where: { status: 'pending' as any, priority: 'critical' as any } }),
      this.stationRepo.count(),
      this.stationRepo.count({ where: { status: StationStatus.ACTIVE } }),
    ]);

    return {
      timestamp: now.toISOString(),
      population: {
        total: totalWhales,
        alive: aliveWhales,
        deceased: deceasedWhales,
        survivalRate: totalWhales > 0 ? Math.round(aliveWhales / totalWhales * 100) : 0,
      },
      sightings: {
        total: totalSightings,
        last30Days: recentSightings,
        last7Days: weeklySightings,
      },
      species: { total: totalSpecies, active: activeSpecies },
      health: { total: totalHealth, critical: criticalHealth },
      behavior: { total: totalBehavior, last7Days: weeklyBehavior },
      feeding: { total: totalFeeding, last7Days: weeklyFeeding },
      genealogy: { total: totalGenealogy, confirmed: confirmedGenealogy },
      audit: { total: totalAudit, last7Days: weeklyAudit },
      notifications: { pending: pendingNotifs, critical: criticalNotifs },
      stations: { total: totalStations, active: activeStations },
    };
  }

  @Get('data-quality')
  @ApiOperation({ summary: '数据质量评估' })
  async getDataQuality() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Unverified sightings older than 7 days
    const unverifiedSightings = await this.sightingRepo.count({
      where: { isVerified: false, sightedAt: LessThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) },
    });

    // Whales without species
    const whalesWithoutSpecies = await this.whaleRepo
      .createQueryBuilder('w')
      .where('w.speciesId IS NULL').getCount();

    // Whales without photo
    const whalesWithoutPhoto = await this.whaleRepo
      .createQueryBuilder('w')
      .where('w.photoUrl IS NULL OR w.photoUrl = \'\'').getCount();

    // Health records without vet
    const healthWithoutVet = await this.healthRepo
      .createQueryBuilder('h')
      .where('h.vetName IS NULL OR h.vetName = \'\'').getCount();

    const totalWhales = await this.whaleRepo.count();

    return {
      overall: {
        score: Math.max(0, 100 - (unverifiedSightings * 2) - (whalesWithoutSpecies * 5) - (whalesWithoutPhoto * 3)),
        grade: 'A',
      },
      issues: {
        unverifiedSightings,
        whalesWithoutSpecies,
        whalesWithoutPhoto,
        healthRecordsWithoutVet: healthWithoutVet,
      },
      completeness: {
        whalesWithSpecies: totalWhales > 0 ? Math.round((totalWhales - whalesWithoutSpecies) / totalWhales * 100) : 0,
        whalesWithPhoto: totalWhales > 0 ? Math.round((totalWhales - whalesWithoutPhoto) / totalWhales * 100) : 0,
      },
    };
  }
}
