/**
 * 数据导出服务
 * Phase 3: 报表导出 — CSV/JSON 格式，供科研团队下载分析
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(GenealogyRecord) private genealogyRepo: Repository<GenealogyRecord>,
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
  ) {}

  // ============================================
  // 工具方法
  // ============================================

  /** 转义 CSV 字段 */
  private escapeCsvField(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /** 生成 CSV */
  private toCsv(headers: string[], rows: any[][]): string {
    const headerLine = headers.map(h => this.escapeCsvField(h)).join(',');
    const dataLines = rows.map(r => r.map(c => this.escapeCsvField(c)).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  // ============================================
  // 导出接口
  // ============================================

  /** 导出健康记录 */
  async exportHealthRecords(format: 'csv' | 'json' = 'csv', whaleId?: string): Promise<string | object> {
    const query = this.healthRepo.createQueryBuilder('h')
      .leftJoinAndSelect('h.whale', 'whale')
      .orderBy('h.recordDate', 'DESC');
    if (whaleId) query.andWhere('h.whaleId = :id', { id: whaleId });
    const records = await query.getMany();

    if (format === 'json') return records;

    const headers = ['ID', '鲸鱼编号', '类型', '标题', '描述', '兽医', '状态', '日期', '地点'];
    const rows = records.map(r => [
      r.id, r.whale?.identifier || '', r.type, r.title, r.description || '',
      r.vetName || '', r.status, r.recordDate.toISOString(), r.location || '',
    ]);
    return this.toCsv(headers, rows);
  }

  /** 导出行为日志 */
  async exportBehaviorLogs(format: 'csv' | 'json' = 'csv', whaleId?: string, days?: number): Promise<string | object> {
    const query = this.behaviorRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.whale', 'whale')
      .orderBy('b.sightedAt', 'DESC');
    if (whaleId) query.andWhere('b.whaleId = :id', { id: whaleId });
    if (days) {
      const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      query.andWhere('b.sightedAt >= :start', { start });
    }
    const logs = await query.getMany();

    if (format === 'json') return logs;

    const headers = ['ID', '鲸鱼编号', '行为', '强度', '持续时间(s)', '深度(m)', '速度(km/h)', '群体数', '观测时间', '备注'];
    const rows = logs.map(l => [
      l.id, l.whale?.identifier || '', (l.behaviors || []).join(';'), l.intensity,
      l.duration || '', l.depth || '', l.speed || '', l.groupSize || '',
      l.sightedAt.toISOString(), l.notes || '',
    ]);
    return this.toCsv(headers, rows);
  }

  /** 导出觅食记录 */
  async exportFeedingLogs(format: 'csv' | 'json' = 'csv', whaleId?: string): Promise<string | object> {
    const query = this.feedingRepo.createQueryBuilder('f')
      .leftJoinAndSelect('f.whale', 'whale')
      .orderBy('f.sightedAt', 'DESC');
    if (whaleId) query.andWhere('f.whaleId = :id', { id: whaleId });
    const logs = await query.getMany();

    if (format === 'json') return logs;

    const headers = ['ID', '鲸鱼编号', '觅食方式', '食欲', '猎物', '时长(min)', '深度(m)', '群体觅食', '观测时间'];
    const rows = logs.map(l => [
      l.id, l.whale?.identifier || '', (l.methods || []).join(';'), l.appetite,
      l.preySpecies || '', l.feedingDuration || '', l.feedingDepth || '',
      l.groupFeeding ? '是' : '否', l.sightedAt.toISOString(),
    ]);
    return this.toCsv(headers, rows);
  }

  /** 导出谱系记录 */
  async exportGenealogyRecords(format: 'csv' | 'json' = 'csv'): Promise<string | object> {
    const records = await this.genealogyRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.whale', 'whale')
      .leftJoinAndSelect('g.relatedWhale', 'related')
      .orderBy('g.createdAt', 'DESC')
      .getMany();

    if (format === 'json') return records;

    const headers = ['ID', '鲸鱼A', '鲸鱼B', '关系类型', '置信度', '证据', '日期', '备注'];
    const rows = records.map(r => [
      r.id, r.whale?.identifier || '', r.relatedWhale?.identifier || '',
      r.relationshipType, r.confidence, r.evidence || '',
      r.establishedAt ? r.establishedAt.toISOString() : '', r.notes || '',
    ]);
    return this.toCsv(headers, rows);
  }

  /** 导出鲸鱼个体档案 */
  async exportWhaleProfiles(format: 'csv' | 'json' = 'csv'): Promise<string | object> {
    const whales = await this.whaleRepo.createQueryBuilder('w')
      .leftJoinAndSelect('w.species', 'species')
      .orderBy('w.createdAt', 'DESC')
      .getMany();

    if (format === 'json') return whales;

    const headers = ['ID', '编号', '昵称', '物种', '性别', '年龄', '体长(m)', '体重(t)', '状态', '特征', '首次观测', '最后观测'];
    const rows = whales.map(w => [
      w.id, w.identifier || '', w.name || '', w.species?.commonNameZh || '',
      w.sex || '', w.estimatedAge || '', w.length || '', w.weight || '',
      w.lifeStatus, w.distinctiveFeatures || '',
      w.firstSightedAt ? w.firstSightedAt.toISOString() : '',
      w.lastSightedAt ? w.lastSightedAt.toISOString() : '',
    ]);
    return this.toCsv(headers, rows);
  }
}
