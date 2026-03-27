/**
 * 物种实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Whale } from '../../whales/entities/whale.entity';

export enum IUCNStatus {
  LC = 'LC', // 无危
  NT = 'NT', // 近危
  VU = 'VU', // 易危
  EN = 'EN', // 濒危
  CR = 'CR', // 极危
  EW = 'EW', // 野外灭绝
  EX = 'EX', // 灭绝
}

@Entity('species')
export class Species {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  scientificName: string; // 学名

  @Column()
  commonNameZh: string; // 中文名

  @Column({ nullable: true })
  commonNameEn: string; // 英文名

  @Column({ type: 'text', nullable: true })
  description: string; // 描述

  @Column({ nullable: true })
  family: string; // 科

  @Column({ nullable: true })
  averageLength: number; // 平均体长 (米)

  @Column({ nullable: true })
  averageWeight: number; // 平均体重 (吨)

  @Column({
    type: 'enum',
    enum: IUCNStatus,
    nullable: true,
  })
  iucnStatus: IUCNStatus; // IUCN 保护等级

  @Column({ default: 0 })
  populationEstimate: number; // 种群数量估计

  @Column({ nullable: true })
  distribution: string; // 分布区域

  @Column({ nullable: true })
  imageUrl: string; // 图片 URL

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Whale, (whale) => whale.species)
  whales: Whale[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
