/**
 * 通知/告警实体
 * Phase 7: 通知系统 — 关键事件告警（健康危急、未验证观测等）
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  HEALTH_CRITICAL = 'health_critical',           // 健康危急
  HEALTH_OVERDUE = 'health_overdue',             // 体检超期
  BEHAVIOR_ANOMALY = 'behavior_anomaly',         // 行为异常
  SIGHTING_UNVERIFIED = 'sighting_unverified',   // 未验证观测
  WHALE_MISSING = 'whale_missing',               // 鲸鱼失踪
  BREACHING_PATTERN = 'breaching_pattern',       // 异常行为模式
  SYSTEM = 'system',                             // 系统通知
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  READ = 'read',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType: string; // 关联实体类型

  @Column({ name: 'entity_id', nullable: true })
  entityId: string; // 关联实体 ID

  @Column({ name: 'user_id', nullable: true })
  userId: string; // 接收者（null = 所有用户）

  @Column({ name: 'created_by', nullable: true })
  createdBy: string; // 创建者（system 或 用户 ID）

  @Column({ type: 'jsonb', nullable: true })
  metadata: object; // 额外数据

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
