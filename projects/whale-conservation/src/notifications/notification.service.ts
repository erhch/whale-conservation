/**
 * 通知/告警服务
 * Phase 7: 通知系统 — 告警生成、查询、管理
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, IsNull, In } from 'typeorm';

import { Notification, NotificationType, NotificationPriority, NotificationStatus } from './entities/notification.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { Whale } from '../whales/entities/whale.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { Sighting } from '../sightings/entities/sighting.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(WhaleHealthRecord) private healthRepo: Repository<WhaleHealthRecord>,
    @InjectRepository(Whale) private whaleRepo: Repository<Whale>,
    @InjectRepository(BehaviorLog) private behaviorRepo: Repository<BehaviorLog>,
    @InjectRepository(Sighting) private sightingRepo: Repository<Sighting>,
  ) {}

  // ============================================
  // 告警生成（自动检测）
  // ============================================

  /** 扫描并生成所有类型的告警 */
  async scanAndGenerate(): Promise<{ created: number; existing: number }> {
    let created = 0;

    created += await this.checkCriticalHealth();
    created += await this.checkOverdueCheckups();
    created += await this.checkMissingWhales();
    created += await this.checkUnverifiedSightings();

    return { created, existing: 0 };
  }

  /** 检查健康危急记录 */
  private async checkCriticalHealth(): Promise<number> {
    const criticalRecords = await this.healthRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.whale', 'whale')
      .where('h.status = :status', { status: 'critical' })
      .andWhere('h.createdAt > NOW() - INTERVAL \'24 hours\'')
      .getMany();

    let created = 0;
    for (const record of criticalRecords) {
      const exists = await this.notifRepo.findOne({
        where: {
          type: NotificationType.HEALTH_CRITICAL,
          entityId: record.id,
          status: NotificationStatus.PENDING,
        },
      });
      if (!exists) {
        await this.notifRepo.save({
          type: NotificationType.HEALTH_CRITICAL,
          priority: NotificationPriority.CRITICAL,
          title: `🚨 鲸鱼 ${record.whale?.identifier || '未知'} 健康状况危急`,
          message: `${record.title}: ${record.description || '需要立即关注'}`,
          entityType: 'WhaleHealthRecord',
          entityId: record.id,
          createdBy: 'system',
          metadata: { whaleId: record.whaleId, vetName: record.vetName },
        });
        created++;
      }
    }
    return created;
  }

  /** 检查超期未体检的鲸鱼 */
  private async checkOverdueCheckups(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const whalesWithoutRecentCheckup = await this.whaleRepo
      .createQueryBuilder('w')
      .leftJoin('whale_health_records', 'h', 'h.whale_id = w.id AND h.type = :type AND h.record_date > :date', {
        type: 'checkup',
        date: thirtyDaysAgo,
      })
      .where('h.id IS NULL')
      .andWhere('w.life_status = :status', { status: 'alive' })
      .getMany();

    let created = 0;
    for (const whale of whalesWithoutRecentCheckup) {
      const exists = await this.notifRepo.findOne({
        where: {
          type: NotificationType.HEALTH_OVERDUE,
          entityId: whale.id,
          status: NotificationStatus.PENDING,
        },
      });
      if (!exists) {
        await this.notifRepo.save({
          type: NotificationType.HEALTH_OVERDUE,
          priority: NotificationPriority.HIGH,
          title: `⏰ 鲸鱼 ${whale.identifier || whale.name} 超期未体检`,
          message: `已超过90天未进行常规体检，建议尽快安排`,
          entityType: 'Whale',
          entityId: whale.id,
          createdBy: 'system',
          metadata: { lastCheckup: 'unknown' },
        });
        created++;
      }
    }
    return created;
  }

  /** 检查长时间未观测到的鲸鱼 */
  private async checkMissingWhales(): Promise<number> {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const missingWhales = await this.whaleRepo
      .createQueryBuilder('w')
      .leftJoin('sightings', 's', 's.whale_id = w.id AND s.observed_at > :date', { date: sixtyDaysAgo })
      .where('s.id IS NULL')
      .andWhere('w.life_status = :status', { status: 'alive' })
      .getMany();

    let created = 0;
    for (const whale of missingWhales) {
      const exists = await this.notifRepo.findOne({
        where: {
          type: NotificationType.WHALE_MISSING,
          entityId: whale.id,
          status: NotificationStatus.PENDING,
        },
      });
      if (!exists) {
        await this.notifRepo.save({
          type: NotificationType.WHALE_MISSING,
          priority: NotificationPriority.HIGH,
          title: `🔍 鲸鱼 ${whale.identifier || whale.name} 长时间未观测到`,
          message: `已超过60天未观测到该个体，建议安排搜寻`,
          entityType: 'Whale',
          entityId: whale.id,
          createdBy: 'system',
          metadata: { lastSighted: 'unknown' },
        });
        created++;
      }
    }
    return created;
  }

  /** 检查未验证的观测记录 */
  private async checkUnverifiedSightings(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const unverifiedCount = await this.sightingRepo.count({
      where: { isVerified: false, sightedAt: LessThan(sevenDaysAgo) },
    });

    if (unverifiedCount > 0) {
      const exists = await this.notifRepo.findOne({
        where: {
          type: NotificationType.SIGHTING_UNVERIFIED,
          status: NotificationStatus.PENDING,
        },
      });
      if (!exists) {
        await this.notifRepo.save({
          type: NotificationType.SIGHTING_UNVERIFIED,
          priority: NotificationPriority.MEDIUM,
          title: `📋 ${unverifiedCount} 条观测记录待验证`,
          message: `有 ${unverifiedCount} 条超过7天的观测记录尚未验证`,
          entityType: 'Sighting',
          createdBy: 'system',
          metadata: { unverifiedCount },
        });
        return 1;
      }
    }
    return 0;
  }

  // ============================================
  // 通知管理
  // ============================================

  /** 查询通知列表 */
  async findAll(params: {
    type?: NotificationType;
    priority?: NotificationPriority;
    status?: NotificationStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Notification[]; total: number }> {
    const { type, priority, status, userId, page = 1, limit = 20 } = params;

    const query = this.notifRepo.createQueryBuilder('n')
      .orderBy('n.createdAt', 'DESC');

    if (type) query.andWhere('n.type = :type', { type });
    if (priority) query.andWhere('n.priority = :priority', { priority });
    if (status) query.andWhere('n.status = :status', { status });
    if (userId) query.andWhere('(n.userId = :userId OR n.userId IS NULL)', { userId });

    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  /** 标记已读 */
  async markAsRead(id: string): Promise<Notification> {
    await this.notifRepo.update(id, { status: NotificationStatus.READ });
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new Error(`Notification ${id} not found`);
    return notif;
  }

  /** 批量标记已读 */
  async markManyAsRead(ids: string[]): Promise<number> {
    const result = await this.notifRepo.update({ id: In(ids) }, { status: NotificationStatus.READ });
    return result.affected || 0;
  }

  /** 标记已解决 */
  async markAsResolved(id: string, resolvedBy: string): Promise<Notification> {
    await this.notifRepo.update(id, {
      status: NotificationStatus.RESOLVED,
      resolvedAt: new Date(),
      resolvedBy,
    });
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new Error(`Notification ${id} not found`);
    return notif;
  }

  /** 获取未读数量 */
  async getUnreadCount(userId?: string): Promise<number> {
    const query = this.notifRepo.createQueryBuilder('n')
      .where('n.status IN (:...statuses)', { statuses: [NotificationStatus.PENDING, NotificationStatus.READ] });
    if (userId) {
      query.andWhere('(n.userId = :userId OR n.userId IS NULL)', { userId });
    }
    return query.getCount();
  }

  /** 获取统计概览 */
  async getOverview(): Promise<any> {
    const byType = await this.notifRepo
      .createQueryBuilder('n')
      .select('n.type', 'type').addSelect('COUNT(*)', 'count')
      .where('n.status = :status', { status: NotificationStatus.PENDING })
      .groupBy('n.type').getRawMany();

    const byPriority = await this.notifRepo
      .createQueryBuilder('n')
      .select('n.priority', 'priority').addSelect('COUNT(*)', 'count')
      .where('n.status = :status', { status: NotificationStatus.PENDING })
      .groupBy('n.priority').getRawMany();

    const total = await this.notifRepo.count({ where: { status: NotificationStatus.PENDING } });
    const critical = await this.notifRepo.count({
      where: { status: NotificationStatus.PENDING, priority: NotificationPriority.CRITICAL },
    });

    return {
      total,
      critical,
      byType: byType.map(r => ({ type: r.type, count: parseInt(r.count) })),
      byPriority: byPriority.map(r => ({ priority: r.priority, count: parseInt(r.count) })),
    };
  }
}
