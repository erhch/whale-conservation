/**
 * 监测站点服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Station, StationType, StationStatus } from './entities/station.entity';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

export interface StationsQueryResult {
  data: Station[];
  total: number;
  page: number;
  limit: number;
}

export interface StationsFilter {
  page?: number;
  limit?: number;
  type?: StationType;
  status?: StationStatus;
}

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async findAll(filter?: StationsFilter): Promise<StationsQueryResult | Station[]> {
    // 如果需要分页
    if (filter && (filter.page !== undefined || filter.limit !== undefined)) {
      const page = filter.page || 1;
      const limit = Math.min(filter.limit || 10, 100); // 最大 100 条
      const skip = (page - 1) * limit;

      const queryBuilder = this.stationRepository.createQueryBuilder('station');

      // 筛选条件
      if (filter.type) {
        queryBuilder.andWhere('station.type = :type', { type: filter.type });
      }
      if (filter.status) {
        queryBuilder.andWhere('station.status = :status', { status: filter.status });
      }

      const [data, total] = await queryBuilder
        .orderBy('station.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return { data, total, page, limit };
    }

    // 不分页 - 返回所有数据
    return this.stationRepository.find({
      relations: ['environmentLogs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Station> {
    const station = await this.stationRepository.findOne({
      where: { id },
      relations: ['environmentLogs'],
    });
    if (!station) {
      throw new NotFoundException('站点不存在');
    }
    return station;
  }

  async create(createStationDto: CreateStationDto): Promise<Station> {
    const station = this.stationRepository.create(createStationDto);
    return this.stationRepository.save(station);
  }

  async update(id: string, updateStationDto: UpdateStationDto): Promise<Station> {
    const station = await this.findOne(id);
    Object.assign(station, updateStationDto);
    return this.stationRepository.save(station);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.stationRepository.delete(id);
  }

  async findActive(): Promise<Station[]> {
    return this.stationRepository.find({
      where: { status: 'active' },
    });
  }
}
