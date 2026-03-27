/**
 * 监测站点实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { EnvironmentLog } from './environment-log.entity';

export enum StationType {
  FIXED = 'fixed', // 固定站点
  MOBILE = 'mobile', // 移动站点
  VESSEL = 'vessel', // 船只
}

export enum StationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // 站点代码 (如：ST001)

  @Column()
  name: string; // 站点名称

  @Column({
    type: 'enum',
    enum: StationType,
    default: StationType.FIXED,
  })
  type: StationType;

  @Column({
    type: 'enum',
    enum: StationStatus,
    default: StationStatus.ACTIVE,
  })
  status: StationStatus;

  @Column()
  latitude: number; // 纬度

  @Column()
  longitude: number; // 经度

  @Column({ nullable: true })
  location: string; // 位置描述

  @Column({ nullable: true })
  depth: number; // 水深 (米)

  @Column({ nullable: true })
  installedAt: Date; // 安装时间

  @Column({ nullable: true })
  responsiblePerson: string; // 负责人

  @Column({ nullable: true })
  contactPhone: string; // 联系电话

  @Column({ nullable: true })
  equipment: string; // 设备清单 (JSON)

  @OneToMany(() => EnvironmentLog, (log) => log.station)
  environmentLogs: EnvironmentLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
