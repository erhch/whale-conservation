/**
 * 环境日志服务
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentLog } from './entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(EnvironmentLog)
    private readonly environmentRepository: Repository<EnvironmentLog>,
  ) {}

  /**
   * 创建环境日志记录
   */
  async create(createEnvironmentDto: CreateEnvironmentDto): Promise<EnvironmentLog> {
    const environment = this.environmentRepository.create({
      station_id: createEnvironmentDto.stationId,
      recorded_at: new Date(createEnvironmentDto.recordedAt),
      water_temperature: createEnvironmentDto.waterTemperature,
      salinity: createEnvironmentDto.salinity,
      ph_level: createEnvironmentDto.phLevel,
      dissolved_oxygen: createEnvironmentDto.dissolvedOxygen,
      turbidity: createEnvironmentDto.turbidity,
      chlorophyll: createEnvironmentDto.chlorophyll,
      notes: createEnvironmentDto.notes,
    });

    return this.environmentRepository.save(environment);
  }

  /**
   * 获取站点的环境数据 (分页)
   */
  async findByStation(
    stationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: EnvironmentLog[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.environmentRepository.findAndCount({
      where: { station_id: stationId },
      order: { recorded_at: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * 获取单个环境记录
   */
  async findOne(id: string): Promise<EnvironmentLog> {
    const environment = await this.environmentRepository.findOne({ where: { id } });

    if (!environment) {
      throw new NotFoundException('环境记录不存在');
    }

    return environment;
  }

  /**
   * 获取站点最近的环境数据
   */
  async findRecent(stationId: string, limit: number = 10): Promise<EnvironmentLog[]> {
    return this.environmentRepository.find({
      where: { station_id: stationId },
      order: { recorded_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * 按时间范围查询环境数据
   */
  async findByDateRange(
    stationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<EnvironmentLog[]> {
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return this.environmentRepository.find({
      where: {
        station_id: stationId,
        recorded_at: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      order: { recorded_at: 'ASC' },
      take: limit,
    });
  }

  /**
   * 删除环境记录
   */
  async remove(id: string): Promise<void> {
    const environment = await this.findOne(id);
    await this.environmentRepository.remove(environment);
  }
}
