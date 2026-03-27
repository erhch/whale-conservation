/**
 * 环境监测日志实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Station } from './station.entity';

@Entity('environment_logs')
export class EnvironmentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Station, (station) => station.environmentLogs)
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @Column({ name: 'station_id' })
  stationId: string;

  @Column({ type: 'timestamptz' })
  recordedAt: Date; // 记录时间

  @Column({ nullable: true })
  waterTemperature: number; // 水温 (°C)

  @Column({ nullable: true })
  salinity: number; // 盐度 (ppt)

  @Column({ nullable: true })
  ph: number; // pH 值

  @Column({ nullable: true })
  dissolvedOxygen: number; // 溶解氧 (mg/L)

  @Column({ nullable: true })
  turbidity: number; // 浊度 (NTU)

  @Column({ nullable: true })
  seaState: number; // 海况等级 (0-9)

  @Column({ nullable: true })
  weather: string; // 天气状况

  @Column({ nullable: true })
  windSpeed: number; // 风速 (m/s)

  @Column({ nullable: true })
  windDirection: number; // 风向 (度)

  @Column({ nullable: true })
  visibility: number; // 能见度 (km)

  @Column({ type: 'text', nullable: true })
  notes: string; // 备注

  @CreateDateColumn()
  createdAt: Date;
}
