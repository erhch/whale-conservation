/**
 * 鲸鱼行为日志实体
 * Phase 2: 个体行为追踪 - 参考 Wildbook 的行为记录框架
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Whale } from '../../whales/entities/whale.entity';
import { User } from '../../auth/entities/user.entity';

/** 行为类型 */
export enum BehaviorType {
  SURFACING = 'surfacing',           // 浮出水面
  DIVING = 'diving',                 // 潜水
  BREACHING = 'breaching',           // 跃身击浪
  LOBTAILING = 'lobtailing',         // 尾鳍拍水
  FLIPPER_SLAPPING = 'flipper_slapping', // 胸鳍拍水
  SPY_HOPPING = 'spy_hopping',       // 垂直探身
  FEEDING = 'feeding',               // 觅食
  RESTING = 'resting',               // 休息
  SOCIAL = 'social',                 // 社交
  VENTRAL = 'ventral',              // 腹部展示
  TRAVELING = 'traveling',           // 游动
  MATING = 'mating',                 // 交配
  CARE_GIVING = 'care_giving',       // 照顾幼崽
  OTHER = 'other',                   // 其他
}

/** 行为强度 */
export enum BehaviorIntensity {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
}

@Entity('behavior_logs')
export class BehaviorLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'whale_id' })
  whaleId: string;

  @ManyToOne(() => Whale, (whale) => whale.behaviorLogs)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'observer_id' })
  observer: User;

  @Column({ name: 'observer_id' })
  observerId: string;

  @Column({ type: 'timestamptz' })
  sightedAt: Date; // 观测时间

  @Column({
    type: 'enum',
    enum: BehaviorType,
    array: true,
    default: [],
  })
  behaviors: BehaviorType[]; // 多种行为可并行

  @Column({
    type: 'enum',
    enum: BehaviorIntensity,
    default: BehaviorIntensity.MODERATE,
  })
  intensity: BehaviorIntensity; // 行为强度

  @Column({ nullable: true })
  duration: number; // 持续时间 (秒)

  @Column({ nullable: true })
  depth: number; // 深度 (米)

  @Column({ nullable: true })
  speed: number; // 游速 (km/h)

  @Column({ nullable: true })
  direction: number; // 游向 (角度 0-360)

  @Column({ nullable: true })
  groupSize: number; // 同群体个体数

  @Column({ type: 'simple-array', nullable: true })
  associatedWhales: string[]; // 同群体其他鲸鱼 ID

  @Column({ type: 'text', nullable: true })
  notes: string; // 详细备注

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[]; // 观测照片

  @Column({ type: 'simple-array', nullable: true })
  videoUrls: string[]; // 观测视频

  @Column({ nullable: true })
  waterTemp: number; // 水温

  @Column({ nullable: true })
  visibility: number; // 能见度 (米)

  @Column({ default: true })
  isVerified: boolean; // 是否已验证

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
