/**
 * 物种服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Species } from './entities/species.entity';

@Injectable()
export class SpeciesService {
  constructor(
    @InjectRepository(Species)
    private speciesRepository: Repository<Species>,
  ) {}

  async findAll(): Promise<Species[]> {
    return this.speciesRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Species> {
    const species = await this.speciesRepository.findOne({ where: { id } });
    if (!species) {
      throw new NotFoundException('物种不存在');
    }
    return species;
  }

  async create(createSpeciesDto: any): Promise<Species> {
    const species = this.speciesRepository.create(createSpeciesDto);
    return this.speciesRepository.save(species);
  }

  async update(id: string, updateSpeciesDto: any): Promise<Species> {
    const species = await this.findOne(id);
    Object.assign(species, updateSpeciesDto);
    return this.speciesRepository.save(species);
  }

  async remove(id: string): Promise<void> {
    const species = await this.findOne(id);
    species.isActive = false; // 软删除
    await this.speciesRepository.save(species);
  }
}
