/**
 * 鲸鱼健康/医疗记录实体
 * Phase 2: 个体管理增强
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Whale } from '../../whales/entities/whale.entity';

export enum HealthType {
  CHECKUP = 'checkup',       // 常规体检
  INJURY = 'injury',         // 受伤
  ILLNESS = 'illness',       // 疾病
  TREATMENT = 'treatment',   // 治疗
  RESCUE = 'rescue',         // 救援
  AUTOPSY = 'autopsy',       // 尸检
}

export enum HealthStatus {
  PENDING = 'pending',
  ONGOING = 'ongoing',
  RECOVERED = 'recovered',
  CRITICAL = 'critical',
  DECEASED = 'deceased',
}

@Entity('whale_health_records')
export class WhaleHealthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'whale_id' })
  whaleId: string;

  @ManyToOne(() => Whale, (whale) => whale.healthRecords)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @Column({
    type: 'enum',
    enum: HealthType,
  })
  type: HealthType;

  @Column()
  title: string; // 记录标题 (如：背部擦伤处理)

  @Column({ type: 'text', nullable: true })
  description: string; // 详细描述

  @Column({ nullable: true })
  vetName: string; // 兽医/记录人

  @Column({
    type: 'enum',
    enum: HealthStatus,
    default: HealthStatus.PENDING,
  })
  status: HealthStatus;

  @Column({ type: 'timestamp' })
  recordDate: Date; // 记录日期

  @Column({ nullable: true })
  location: string; // 发现/治疗地点

  @Column('simple-array', { nullable: true })
  photos: string[]; // 照片链接列表

  @CreateDateColumn()
  createdAt: Date;
}
