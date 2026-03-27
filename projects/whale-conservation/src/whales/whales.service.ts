/**
 * 鲸鱼个体服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Whale } from './entities/whale.entity';

@Injectable()
export class WhalesService {
  constructor(
    @InjectRepository(Whale)
    private whaleRepository: Repository<Whale>,
  ) {}

  async findAll(): Promise<Whale[]> {
    return this.whaleRepository.find({ relations: ['species'] });
  }

  async findOne(id: string): Promise<Whale> {
    const whale = await this.whaleRepository.findOne({
      where: { id },
      relations: ['species', 'sightings'],
    });
    if (!whale) {
      throw new NotFoundException('鲸鱼个体不存在');
    }
    return whale;
  }

  async create(createWhaleDto: any): Promise<Whale> {
    const whale = this.whaleRepository.create(createWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async update(id: string, updateWhaleDto: any): Promise<Whale> {
    const whale = await this.findOne(id);
    Object.assign(whale, updateWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.whaleRepository.delete(id);
  }
}
