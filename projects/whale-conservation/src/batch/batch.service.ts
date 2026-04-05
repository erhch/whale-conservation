/**
 * 批量操作服务
 * Phase 6: 批量管理 — 批量更新状态、批量删除、批量验证
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';

import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';

export interface BatchResult {
  success: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(GenealogyRecord) private genealogyRepo: Repository<GenealogyRecord>,
  ) {}

  // ============================================
  // 鲸鱼个体批量操作
  // ============================================

  /** 批量更新鲸鱼状态 */
  async batchUpdateWhaleStatus(ids: string[], lifeStatus: string): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] };
    const whales = await this.whaleRepo.findBy({ id: In(ids) });
    const foundIds = new Set(whales.map(w => w.id));

    for (const id of ids) {
      if (!foundIds.has(id)) {
        result.failed++;
        result.errors.push(`Whale ${id} not found`);
      } else {
        await this.whaleRepo.update(id, { lifeStatus: lifeStatus as any });
        result.success++;
      }
    }
    return result;
  }

  /** 批量删除鲸鱼 */
  async batchDeleteWhales(ids: string[]): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] };
    const existing = await this.whaleRepo.findBy({ id: In(ids) });
    const existingIds = existing.map(w => w.id);

    // 检查是否有关联的观测记录
    const relatedSightings = await this.sightingRepo
      .createQueryBuilder('s')
      .where('s.whaleId IN (:...ids)', { ids: existingIds })
      .getCount();

    if (relatedSightings > 0) {
      result.failed = existingIds.length;
      result.errors.push(`Cannot delete: ${relatedSightings} related sightings exist. Remove sightings first.`);
      return result;
    }

    const res = await this.whaleRepo.delete({ id: In(existingIds) });
    result.success = res.affected || 0;
    result.failed = ids.length - result.success;
    return result;
  }

  // ============================================
  // 健康记录批量操作
  // ============================================

  /** 批量更新健康记录状态 */
  async batchUpdateHealthStatus(ids: string[], status: string): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] };
    const res = await this.healthRepo.update({ id: In(ids) }, { status: status as any });
    result.success = res.affected || 0;
    result.failed = ids.length - result.success;
    if (result.failed > 0) result.errors.push(`${result.failed} records not found`);
    return result;
  }

  // ============================================
  // 行为日志批量操作
  // ============================================

  /** 批量验证行为日志 */
  async batchVerifyBehavior(ids: string[], verified: boolean = true): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] };
    const res = await this.behaviorRepo.update({ id: In(ids) }, { isVerified: verified });
    result.success = res.affected || 0;
    result.failed = ids.length - result.success;
    if (result.failed > 0) result.errors.push(`${result.failed} logs not found`);
    return result;
  }

  // ============================================
  // 觅食记录批量操作
  // ============================================

  /** 批量验证觅食记录 */
  async batchVerifyFeeding(ids: string[], verified: boolean = true): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] };
    const res = await this.feedingRepo.update({ id: In(ids) }, { isVerified: verified });
    result.success = res.affected || 0;
    result.failed = ids.length - result.success;
    if (result.failed > 0) result.errors.push(`${result.failed} logs not found`);
    return result;
  }

  // ============================================
  // 通用批量操作
  // ============================================

  /** 批量删除（通用） */
  async batchDelete(entityType: string, ids: string[]): Promise<BatchResult> {
    const repos: Record<string, Repository<any>> = {
      behavior: this.behaviorRepo,
      feeding: this.feedingRepo,
      health: this.healthRepo,
      genealogy: this.genealogyRepo,
    };

    const repo = repos[entityType.toLowerCase()];
    if (!repo) return { success: 0, failed: ids.length, errors: [`Unknown entity type: ${entityType}`] };

    const res = await repo.delete({ id: In(ids) });
    return {
      success: res.affected || 0,
      failed: ids.length - (res.affected || 0),
      errors: [],
    };
  }
}
