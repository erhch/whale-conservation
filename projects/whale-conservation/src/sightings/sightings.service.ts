/**
 * 观测记录服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sighting } from './entities/sighting.entity';

@Injectable()
export class SightingsService {
  constructor(
    @InjectRepository(Sighting)
    private sightingRepository: Repository<Sighting>,
  ) {}

  async findAll(): Promise<Sighting[]> {
    return this.sightingRepository.find({
      relations: ['whale', 'station', 'observer'],
      order: { observedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Sighting> {
    const sighting = await this.sightingRepository.findOne({
      where: { id },
      relations: ['whale', 'station', 'observer'],
    });
    if (!sighting) {
      throw new NotFoundException('观测记录不存在');
    }
    return sighting;
  }

  async create(createSightingDto: any): Promise<Sighting> {
    const sighting = this.sightingRepository.create(createSightingDto);
    return this.sightingRepository.save(sighting);
  }

  async update(id: string, updateSightingDto: any): Promise<Sighting> {
    const sighting = await this.findOne(id);
    Object.assign(sighting, updateSightingDto);
    return this.sightingRepository.save(sighting);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.sightingRepository.delete(id);
  }

  async findByWhale(whaleId: string): Promise<Sighting[]> {
    return this.sightingRepository.find({
      where: { whaleId },
      relations: ['station', 'observer'],
      order: { observedAt: 'DESC' },
    });
  }
}
