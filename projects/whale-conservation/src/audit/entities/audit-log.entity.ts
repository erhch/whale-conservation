/**
 * 审计日志实体
 * Phase 5: 数据完整性 — 记录所有写操作（创建/更新/删除）
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string; // 操作者 ID

  @Column()
  action: AuditAction;

  @Column({ name: 'entity_type' })
  entityType: string; // 实体类型 (Whale, BehaviorLog, etc.)

  @Column({ name: 'entity_id', nullable: true })
  entityId: string; // 被操作实体的 ID

  @Column({ type: 'jsonb', nullable: true })
  oldValue: object; // 变更前的数据

  @Column({ type: 'jsonb', nullable: true })
  newValue: object; // 变更后的数据

  @Column({ type: 'jsonb', nullable: true })
  metadata: object; // 额外元数据 (IP, user agent, etc.)

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
