/**
 * 观测记录实体
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
import { Station } from '../../stations/entities/station.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('sightings')
export class Sighting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Whale, (whale) => whale.sightings)
  @JoinColumn({ name: 'whale_id' })
  whale: Whale;

  @Column({ name: 'whale_id', nullable: true })
  whaleId: string | null;

  @ManyToOne(() => Station)
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @Column({ name: 'station_id', nullable: true })
  stationId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'observer_id' })
  observer: User;

  @Column({ name: 'observer_id' })
  observerId: string;

  @Column({ type: 'timestamptz' })
  observedAt: Date; // 观测时间

  @Column()
  latitude: number; // 纬度

  @Column()
  longitude: number; // 经度

  @Column({ nullable: true })
  locationName: string; // 地点名称

  @Column({ nullable: true })
  behavior: string; // 行为描述

  @Column({ nullable: true })
  groupSize: number; // 群体数量

  @Column({ type: 'text', nullable: true })
  notes: string; // 备注

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[]; // 照片 URLs

  @Column({ nullable: true })
  weather: string; // 天气状况

  @Column({ nullable: true })
  seaState: number; // 海况等级 (0-9)

  @Column({ default: true })
  isVerified: boolean; // 是否已验证

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
