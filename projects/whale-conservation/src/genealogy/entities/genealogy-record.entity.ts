/**
 * 鲸鱼谱系/家系记录实体
 * Phase 2: 个体谱系追踪 - 记录母子关系、族群归属、基因谱系
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

/** 关系类型 */
export enum RelationshipType {
  PARENT_OFFSPRING = 'parent_offspring',    // 亲子
  SIBLING = 'sibling',                     // 兄弟姐妹
  HALF_SIBLING = 'half_sibling',           // 同父异母/同母异父
  GRANDPARENT = 'grandparent',             // 祖孙
  MATING_PAIR = 'mating_pair',             // 配偶
  SOCIAL_BOND = 'social_bond',             // 社交纽带
}

/** 关系置信度 */
export enum ConfidenceLevel {
  CONFIRMED = 'confirmed',       // 基因确认
  LIKELY = 'likely',             // 高度可能（行为观测）
  PROBABLE = 'probable',         // 可能（推断）
  SPECULATED = 'speculated',     // 推测
}

/** 族群分类 */
export enum ClanType {
  RESIDENT = 'resident',         // 定居族群
  TRANSIENT = 'transient',       // 临时族群
  OFFSHORE = 'offshore',         // 远洋族群
  COASTAL = 'coastal',           // 近岸族群
  UNKNOWN = 'unknown',
}

@Entity('genealogy_records')
export class GenealogyRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'whale_id' })
  whaleId: string;

  @ManyToOne(() => Whale, (whale) => whale.genealogyRecords)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @ManyToOne(() => Whale)
  @JoinColumn({ name: 'related_whale_id' })
  relatedWhale: Whale;

  @Column({ name: 'related_whale_id' })
  relatedWhaleId: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relationshipType: RelationshipType;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.SPECULATED,
  })
  confidence: ConfidenceLevel;

  @Column({ nullable: true })
  establishedAt: Date; // 关系确认时间

  @Column({ nullable: true })
  evidence: string; // 证据描述（基因检测、行为观测等）

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy: User;

  @Column({ name: 'recorded_by_id', nullable: true })
  recordedById: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 鲸鱼个体扩展信息（谱系相关的字段）
 * 这些字段直接关联到 Whale 实体
 */
@Entity('whale_pedigree')
export class WhalePedigree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'whale_id' })
  whaleId: string;

  @ManyToOne(() => Whale)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @ManyToOne(() => Whale, { nullable: true })
  @JoinColumn({ name: 'mother_id' })
  mother: Whale;

  @Column({ name: 'mother_id', nullable: true })
  motherId: string;

  @ManyToOne(() => Whale, { nullable: true })
  @JoinColumn({ name: 'father_id' })
  father: Whale;

  @Column({ name: 'father_id', nullable: true })
  fatherId: string;

  @Column({
    type: 'enum',
    enum: ClanType,
    nullable: true,
  })
  clan: ClanType;

  @Column({ nullable: true })
  matriline: string; // 母系谱系编号

  @Column({ nullable: true })
  geneticProfile: string; // 基因档案编号

  @Column({ nullable: true })
  mitochondrialHaplotype: string; // 线粒体单倍型

  @Column({ nullable: true })
  microsatelliteProfile: string; // 微卫星基因型

  @Column({ nullable: true })
  photoIdConfidence: number; // 照片识别置信度 (0-1)

  @Column({ type: 'text', nullable: true })
  geneticNotes: string; // 基因备注

  @Column({ nullable: true })
  lastGeneticSampleDate: Date; // 最后采样日期

  @Column({ nullable: true })
  sampleType: string; // 样本类型 (skin, biopsy, feces)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
