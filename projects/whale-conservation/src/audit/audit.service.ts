/**
 * 审计日志服务
 * Phase 5: 审计追踪 — 自动记录所有数据变更
 */

import { Injectable, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface AuditEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  metadata?: object;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @Optional() @Inject(REQUEST) private request?: Request,
  ) {}

  async log(entry: AuditEntry): Promise<AuditLog> {
    const log = this.auditRepo.create({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      metadata: entry.metadata,
      ipAddress: this.request?.ip || null,
      userAgent: this.request?.headers['user-agent'] as string || null,
    } as unknown as DeepPartial<AuditLog>);
    const saved = await this.auditRepo.save(log);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /** 批量查询审计日志 */
  async findAll(params: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const { userId, action, entityType, entityId, startDate, endDate, page = 1, limit = 20 } = params;

    const query = this.auditRepo.createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC');

    if (userId) query.andWhere('audit.userId = :userId', { userId });
    if (action) query.andWhere('audit.action = :action', { action });
    if (entityType) query.andWhere('audit.entityType = :entityType', { entityType });
    if (entityId) query.andWhere('audit.entityId = :entityId', { entityId });
    if (startDate && endDate) query.andWhere('audit.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });

    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  /** 获取某个实体的变更历史 */
  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /** 获取用户操作统计 */
  async getUserActivitySummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.auditRepo
      .createQueryBuilder('a')
      .select('a.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('a.userId = :userId', { userId })
      .andWhere('a.createdAt >= :start', { start: startDate })
      .groupBy('a.action')
      .getRawMany();

    const total = await this.auditRepo.count({
      where: { userId, createdAt: startDate },
    });

    return {
      userId,
      period: { days, startDate, endDate: new Date() },
      total,
      byAction: result.map(r => ({
        action: r.action,
        count: parseInt(r.count),
      })),
    };
  }
}
