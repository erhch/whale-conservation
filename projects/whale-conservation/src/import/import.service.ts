/**
 * 数据导入服务
 * Phase 3: 批量导入 — CSV 解析 + 数据验证 + 批量写入
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DeepPartial } from 'typeorm';

import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { Whale } from '../whales/entities/whale.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(FeedingLog) private feedingRepo: Repository<FeedingLog>,
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
  ) {}

  /** 解析 CSV 行 */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') { current += '"'; i++; }
        else if (char === '"') { inQuotes = false; }
        else { current += char; }
      } else {
        if (char === '"') { inQuotes = true; }
        else if (char === ',') { result.push(current.trim()); current = ''; }
        else { current += char; }
      }
    }
    result.push(current.trim());
    return result;
  }

  /** 解析 CSV 字符串 */
  private parseCsv(csv: string): { headers: string[]; rows: string[][] } {
    const lines = csv.trim().split('\n');
    const headers = this.parseCsvLine(lines[0]);
    const rows = lines.slice(1).map(l => this.parseCsvLine(l));
    return { headers, rows };
  }

  /** 获取鲸鱼 ID */
  private async getWhaleId(identifier: string): Promise<string | null> {
    if (!identifier) return null;
    const whale = await this.whaleRepo.findOne({ where: { identifier } });
    return whale?.id || null;
  }

  // ============================================
  // 导入接口
  // ============================================

  /** 导入健康记录 */
  async importHealthRecords(csv: string, defaultObserverId?: string): Promise<{ success: number; errors: string[] }> {
    const { headers, rows } = this.parseCsv(csv);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (row.length < 5) { errors.push(`Row ${i + 1}: insufficient columns`); continue; }

        const [identifier, type, title, description, vetName, status, dateStr, location] = row;
        const whaleId = await this.getWhaleId(identifier);
        if (!whaleId) { errors.push(`Row ${i + 1}: whale "${identifier}" not found`); continue; }

        const record = this.healthRepo.create({
          whaleId,
          type: type as any,
          title: title || `Imported record ${i + 1}`,
          description: description || null,
          vetName: vetName || null,
          status: (status as any) || 'pending',
          recordDate: dateStr ? new Date(dateStr) : new Date(),
          location: location || null,
        } as unknown as DeepPartial<WhaleHealthRecord>);
        await this.healthRepo.save(record);
        success++;
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }
    return { success, errors };
  }

  /** 导入行为日志 */
  async importBehaviorLogs(csv: string, defaultObserverId?: string): Promise<{ success: number; errors: string[] }> {
    const { headers, rows } = this.parseCsv(csv);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (row.length < 4) { errors.push(`Row ${i + 1}: insufficient columns`); continue; }

        const [identifier, behaviorsStr, intensity, durationStr, depthStr, speedStr, groupSizeStr, dateStr, notes] = row;
        const whaleId = await this.getWhaleId(identifier);
        if (!whaleId) { errors.push(`Row ${i + 1}: whale "${identifier}" not found`); continue; }

        const behaviors = behaviorsStr.split(';').filter(Boolean);
        if (behaviors.length === 0) { errors.push(`Row ${i + 1}: no behaviors specified`); continue; }

        const log = this.behaviorRepo.create({
          whaleId,
          observerId: defaultObserverId || null,
          observedAt: dateStr ? new Date(dateStr) : new Date(),
          behaviors: behaviors as any,
          intensity: (intensity as any) || 'moderate',
          duration: durationStr ? parseInt(durationStr) : null,
          depth: depthStr ? parseFloat(depthStr) : null,
          speed: speedStr ? parseFloat(speedStr) : null,
          groupSize: groupSizeStr ? parseInt(groupSizeStr) : null,
          notes: notes || null,
        } as any);
        await this.behaviorRepo.save(log);
        success++;
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }
    return { success, errors };
  }

  /** 导入觅食记录 */
  async importFeedingLogs(csv: string, defaultObserverId?: string): Promise<{ success: number; errors: string[] }> {
    const { headers, rows } = this.parseCsv(csv);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (row.length < 4) { errors.push(`Row ${i + 1}: insufficient columns`); continue; }

        const [identifier, methodsStr, appetite, preySpecies, durationStr, depthStr, groupFeedingStr, dateStr] = row;
        const whaleId = await this.getWhaleId(identifier);
        if (!whaleId) { errors.push(`Row ${i + 1}: whale "${identifier}" not found`); continue; }

        const methods = methodsStr.split(';').filter(Boolean);
        if (methods.length === 0) { errors.push(`Row ${i + 1}: no feeding methods specified`); continue; }

        const log = this.feedingRepo.create({
          whaleId,
          observerId: defaultObserverId || null,
          observedAt: dateStr ? new Date(dateStr) : new Date(),
          methods: methods as any,
          appetite: (appetite as any) || 'moderate',
          preySpecies: preySpecies || null,
          feedingDuration: durationStr ? parseInt(durationStr) : null,
          feedingDepth: depthStr ? parseFloat(depthStr) : null,
          groupFeeding: groupFeedingStr === '是' || groupFeedingStr === 'true' || groupFeedingStr === '1',
        } as any);
        await this.feedingRepo.save(log);
        success++;
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }
    return { success, errors };
  }
}
