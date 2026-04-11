/**
 * 鲸鱼觅食/饮食记录实体
 * Phase 2: 个体觅食行为追踪
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
import { User } from '../../auth/entities/user.entity';

/** 觅食方式 */
export enum FeedingMethod {
  LUNGE_FEEDING = 'lunge_feeding',      // 冲击式进食
  SKIM_FEEDING = 'skim_feeding',        // 滤食性滑行
  BUBBLE_NET = 'bubble_net',            // 气泡网捕食
  BOTTOM_FEEDING = 'bottom_feeding',    // 底部觅食
  SIDESWIMMING = 'sideswimming',        // 侧游捕食
  TAIL_LOB_FEEDING = 'tail_lob_feeding', // 尾击驱赶
  COOPERATIVE = 'cooperative',          // 合作捕食
  SURFACE_SKIMMING = 'surface_skimming', // 水面滤食
  OTHER = 'other',
}

/** 食欲评估 */
export enum AppetiteLevel {
  NONE = 'none',       // 未观测到进食
  LOW = 'low',         // 少量
  MODERATE = 'moderate', // 正常
  HIGH = 'high',       // 旺盛
}

@Entity('feeding_logs')
export class FeedingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'whale_id' })
  whaleId: string;

  @ManyToOne(() => Whale, (whale) => whale.feedingLogs)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'observer_id' })
  observer: User;

  @Column({ name: 'observer_id' })
  observerId: string;

  @Column({ type: 'timestamptz' })
  observedAt: Date;

  @Column({
    type: 'enum',
    enum: FeedingMethod,
    array: true,
    default: [],
  })
  methods: FeedingMethod[]; // 觅食方式（可多种）

  @Column({
    type: 'enum',
    enum: AppetiteLevel,
    default: AppetiteLevel.MODERATE,
  })
  appetite: AppetiteLevel;

  @Column({ nullable: true })
  preySpecies: string; // 猎物物种（如：磷虾、沙丁鱼）

  @Column({ nullable: true })
  preyDensity: string; // 猎物密度描述

  @Column({ nullable: true })
  feedingDuration: number; // 进食时长 (分钟)

  @Column({ nullable: true })
  feedingDepth: number; // 进食深度 (米)

  @Column({ nullable: true })
  groupFeeding: boolean; // 群体觅食

  @Column({ type: 'simple-array', nullable: true })
  associatedWhales: string[]; // 同群体其他鲸鱼 ID

  @Column({ nullable: true })
  waterTemp: number; // 水温

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[];

  @Column({ type: 'simple-array', nullable: true })
  videoUrls: string[];

  @Column({ default: true })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
