/**
 * 环境日志实体
 * 记录监测站点的环境数据 (水温、盐度、PH 值、溶解氧等)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Station } from '../../stations/entities/station.entity';

@Entity('environment_log')
@Index(['station_id', 'recorded_at'])
@Index(['recorded_at'])
export class EnvironmentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Station, { eager: true })
  station: Station;

  @Column({ type: 'uuid' })
  @Index()
  station_id: string;

  @Column({ type: 'timestamptz' })
  @Index()
  recorded_at: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  water_temperature: number | null; // 水温 (°C)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  salinity: number | null; // 盐度 (ppt)

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  ph_level: number | null; // PH 值

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dissolved_oxygen: number | null; // 溶解氧 (mg/L)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  turbidity: number | null; // 浊度 (NTU)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  chlorophyll: number | null; // 叶绿素 (μg/L)

  @Column({ type: 'text', nullable: true })
  notes: string | null; // 备注

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
