/**
 * 监测站点服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Station } from './entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
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

  async create(createStationDto: any): Promise<Station> {
    const station = this.stationRepository.create(createStationDto);
    return this.stationRepository.save(station);
  }

  async update(id: string, updateStationDto: any): Promise<Station> {
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
