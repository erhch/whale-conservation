/**
 * 全局搜索服务
 * Phase 4: 搜索与过滤 — 跨模块全文搜索 + 多条件筛选
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { Species } from '../species/entities/species.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord, RelationshipType, ConfidenceLevel } from '../genealogy/entities/genealogy-record.entity';

export interface SearchParams {
  q?: string;              // 全文搜索关键词
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  // 通用筛选
  startDate?: string;
  endDate?: string;
  verified?: boolean;
  // 鲸鱼个体筛选
  speciesId?: string;
  sex?: string;
  lifeStatus?: string;
  // 健康记录筛选
  healthType?: string;
  healthStatus?: string;
  // 行为日志筛选
  behaviorType?: string;
  intensity?: string;
  // 觅食记录筛选
  feedingMethod?: string;
  // 谱系筛选
  relationshipType?: string;
  confidence?: string;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
    @InjectRepository(Species) private speciesRepo: Repository<Species>,
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(GenealogyRecord) private genealogyRepo: Repository<GenealogyRecord>,
  ) {}

  /** 构建分页参数 */
  private pagination(params: SearchParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    return { skip: (page - 1) * limit, take: limit, page, limit };
  }

  // ============================================
  // 全局搜索
  // ============================================

  /** 全局搜索（跨所有模块） */
  async globalSearch(q: string, limit: number = 20): Promise<any> {
    const results: any[] = [];

    // 搜索鲸鱼
    const whales = await this.whaleRepo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.species', 'species')
      .where('w.identifier ILIKE :q', { q: `%${q}%` })
      .orWhere('w.name ILIKE :q', { q: `%${q}%` })
      .orWhere('w.distinctiveFeatures ILIKE :q', { q: `%${q}%` })
      .limit(5).getMany();
    results.push(...whales.map(w => ({ type: 'whale', data: w, identifier: w.identifier })));

    // 搜索物种
    const species = await this.speciesRepo
      .createQueryBuilder('s')
      .where('s.commonNameZh ILIKE :q', { q: `%${q}%` })
      .orWhere('s.scientificName ILIKE :q', { q: `%${q}%` })
      .limit(5).getMany();
    results.push(...species.map(s => ({ type: 'species', data: s, identifier: s.scientificName })));

    // 搜索观测记录（按备注）
    const sightings = await this.sightingRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.whale', 'whale')
      .where('s.notes ILIKE :q', { q: `%${q}%` })
      .orWhere('s.locationName ILIKE :q', { q: `%${q}%` })
      .limit(5).getMany();
    results.push(...sightings.map(s => ({ type: 'sighting', data: s, identifier: s.locationName })));

    // 搜索健康记录
    const health = await this.healthRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.whale', 'whale')
      .where('h.title ILIKE :q', { q: `%${q}%` })
      .orWhere('h.description ILIKE :q', { q: `%${q}%` })
      .limit(5).getMany();
    results.push(...health.map(h => ({ type: 'health', data: h, identifier: h.title })));

    return {
      query: q,
      total: results.length,
      results: results.slice(0, limit),
    };
  }

  // ============================================
  // 各模块搜索
  // ============================================

  /** 搜索鲸鱼个体 */
  async searchWhales(params: SearchParams): Promise<SearchResult<Whale>> {
    const { q, speciesId, sex, lifeStatus } = params;
    const { skip, take, page, limit } = this.pagination(params);

    const query = this.whaleRepo.createQueryBuilder('w')
      .leftJoinAndSelect('w.species', 'species');

    if (q) {
      query.andWhere(
        '(w.identifier ILIKE :q OR w.name ILIKE :q OR w.distinctiveFeatures ILIKE :q)',
        { q: `%${q}%` }
      );
    }
    if (speciesId) query.andWhere('w.speciesId = :speciesId', { speciesId });
    if (sex) query.andWhere('w.sex = :sex', { sex });
    if (lifeStatus) query.andWhere('w.lifeStatus = :status', { status: lifeStatus });

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'DESC';
    query.orderBy(`w.${sortBy}`, sortOrder);

    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** 搜索健康记录 */
  async searchHealth(params: SearchParams): Promise<SearchResult<WhaleHealthRecord>> {
    const { q, healthType, healthStatus, startDate, endDate } = params;
    const { skip, take, page, limit } = this.pagination(params);

    const query = this.healthRepo.createQueryBuilder('h')
      .leftJoinAndSelect('h.whale', 'whale');

    if (q) query.andWhere('(h.title ILIKE :q OR h.description ILIKE :q)', { q: `%${q}%` });
    if (healthType) query.andWhere('h.type = :type', { type: healthType });
    if (healthStatus) query.andWhere('h.status = :status', { status: healthStatus });
    if (startDate && endDate) query.andWhere('h.recordDate BETWEEN :start AND :end', { start: new Date(startDate), end: new Date(endDate) });

    query.orderBy('h.recordDate', 'DESC');
    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** 搜索行为日志 */
  async searchBehavior(params: SearchParams): Promise<SearchResult<BehaviorLog>> {
    const { q, behaviorType, intensity, startDate, endDate, verified } = params;
    const { skip, take, page, limit } = this.pagination(params);

    const query = this.behaviorRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.whale', 'whale');

    if (q) query.andWhere('(b.notes ILIKE :q)', { q: `%${q}%` });
    if (behaviorType) query.andWhere(':type = ANY(b.behaviors)', { type: behaviorType });
    if (intensity) query.andWhere('b.intensity = :intensity', { intensity });
    if (startDate && endDate) query.andWhere('b.sightedAt BETWEEN :start AND :end', { start: new Date(startDate), end: new Date(endDate) });
    if (verified !== undefined) query.andWhere('b.isVerified = :verified', { verified });

    query.orderBy('b.sightedAt', 'DESC');
    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** 搜索觅食记录 */
  async searchFeeding(params: SearchParams): Promise<SearchResult<FeedingLog>> {
    const { q, feedingMethod, startDate, endDate, verified } = params;
    const { skip, take, page, limit } = this.pagination(params);

    const query = this.feedingRepo.createQueryBuilder('f')
      .leftJoinAndSelect('f.whale', 'whale');

    if (q) query.andWhere('(f.notes ILIKE :q OR f.preySpecies ILIKE :q)', { q: `%${q}%` });
    if (feedingMethod) query.andWhere(':method = ANY(f.methods)', { method: feedingMethod });
    if (startDate && endDate) query.andWhere('f.sightedAt BETWEEN :start AND :end', { start: new Date(startDate), end: new Date(endDate) });
    if (verified !== undefined) query.andWhere('f.isVerified = :verified', { verified });

    query.orderBy('f.sightedAt', 'DESC');
    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** 搜索谱系记录 */
  async searchGenealogy(params: SearchParams): Promise<SearchResult<GenealogyRecord>> {
    const { q, relationshipType, confidence } = params;
    const { skip, take, page, limit } = this.pagination(params);

    const query = this.genealogyRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.whale', 'whale')
      .leftJoinAndSelect('g.relatedWhale', 'related');

    if (q) query.andWhere('(g.evidence ILIKE :q OR g.notes ILIKE :q)', { q: `%${q}%` });
    if (relationshipType) query.andWhere('g.relationshipType = :type', { type: relationshipType });
    if (confidence) query.andWhere('g.confidence = :confidence', { confidence });

    query.orderBy('g.createdAt', 'DESC');
    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
