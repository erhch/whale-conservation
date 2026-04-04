/**
 * 鲸鱼个体实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { Species } from '../../species/entities/species.entity';
import { Sighting } from '../../sightings/entities/sighting.entity';

export enum Sex {
  MALE = 'M',
  FEMALE = 'F',
  UNKNOWN = 'U',
}

export enum LifeStatus {
  ALIVE = 'alive',
  DECEASED = 'deceased',
  MISSING = 'missing',
}

@Entity('whales')
export class Whale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identifier: string; // 唯一标识符 (如：BCX001)

  @Column({ nullable: true })
  name: string; // 昵称

  @ManyToOne(() => Species, (species) => species.whales)
  @JoinColumn({ name: 'species_id' })
  species: Species;

  @Column({ name: 'species_id' })
  speciesId: string;

  @Column({
    type: 'enum',
    enum: Sex,
    nullable: true,
  })
  sex: Sex;

  @Column({ nullable: true })
  estimatedAge: number; // 估计年龄 (年)

  @Column({ nullable: true })
  length: number; // 体长 (米)

  @Column({ nullable: true })
  weight: number; // 体重 (吨)

  @Column({
    type: 'enum',
    enum: LifeStatus,
    default: LifeStatus.ALIVE,
  })
  lifeStatus: LifeStatus;

  @Column({ nullable: true })
  distinctiveFeatures: string; // 特征描述 (疤痕、鳍形状等)

  @Column({ nullable: true })
  photoUrl: string; // 照片 URL

  @Column({ nullable: true })
  firstSightedAt: Date; // 首次观测时间

  @Column({ nullable: true })
  lastSightedAt: Date; // 最后观测时间

  @Column({ nullable: true })
  lastSightedLocation: string; // 最后观测地点

  @OneToMany(() => Sighting, (sighting) => sighting.whale)
  sightings: Sighting[];

  @OneToMany(() => import('../../whale-health/entities/whale-health-record.entity').WhaleHealthRecord, (record) => record.whale)
  healthRecords: import('../../whale-health/entities/whale-health-record.entity').WhaleHealthRecord[];

  @OneToMany(() => import('../../behavior-logs/entities/behavior-log.entity').BehaviorLog, (log) => log.whale)
  behaviorLogs: import('../../behavior-logs/entities/behavior-log.entity').BehaviorLog[];

  @OneToMany(() => import('../../feeding-logs/entities/feeding-log.entity').FeedingLog, (log) => log.whale)
  feedingLogs: import('../../feeding-logs/entities/feeding-log.entity').FeedingLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
