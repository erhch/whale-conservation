/**
 * 物种服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Species } from './entities/species.entity';

export interface SpeciesFilter {
  page?: number;
  limit?: number;
  iucnStatus?: string;
  family?: string;
}

@Injectable()
export class SpeciesService {
  constructor(
    @InjectRepository(Species)
    private speciesRepository: Repository<Species>,
  ) {}

  async findAll(filter?: SpeciesFilter): Promise<{ data: Species[]; total: number; page: number; limit: number }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    
    const queryBuilder = this.speciesRepository
      .createQueryBuilder('species')
      .where('species.isActive = :isActive', { isActive: true });

    if (filter?.iucnStatus) {
      queryBuilder.andWhere('species.iucnStatus = :iucnStatus', { iucnStatus: filter.iucnStatus });
    }

    if (filter?.family) {
      queryBuilder.andWhere('species.family = :family', { family: filter.family });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('species.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total, page, limit };
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

  /**
   * 搜索物种 - 支持按学名、中文名、英文名、科属模糊搜索
   */
  async search(query: string): Promise<Species[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    return this.speciesRepository
      .createQueryBuilder('species')
      .where('species.isActive = :isActive', { isActive: true })
      .andWhere(
        '(species.scientificName LIKE :term OR species.commonNameZh LIKE :term OR species.commonNameEn LIKE :term OR species.family LIKE :term)',
        { term: searchTerm },
      )
      .orderBy('species.createdAt', 'DESC')
      .getMany();
  }
}
