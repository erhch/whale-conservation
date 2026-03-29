/**
 * 鲸鱼个体服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Whale, LifeStatus } from './entities/whale.entity';
import { CreateWhaleDto, UpdateWhaleDto } from './dto';

interface FindWhalesOptions {
  page: number;
  limit: number;
  speciesId?: string;
  sex?: string;
  active?: boolean;
}

@Injectable()
export class WhalesService {
  constructor(
    @InjectRepository(Whale)
    private whaleRepository: Repository<Whale>,
  ) {}

  async findAll(options: FindWhalesOptions): Promise<{ data: Whale[]; total: number; page: number; limit: number }> {
    const { page, limit, speciesId, sex, active } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 物种筛选
    if (speciesId) {
      where.speciesId = speciesId;
    }

    // 性别筛选
    if (sex) {
      where.sex = sex;
    }

    // 生命状态筛选 (active=true 仅显示存活个体)
    if (active !== undefined && active === true) {
      where.lifeStatus = LifeStatus.ALIVE;
    }

    const [data, total] = await this.whaleRepository.findAndCount({
      where,
      relations: ['species'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
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

  async create(createWhaleDto: CreateWhaleDto): Promise<Whale> {
    const whale = this.whaleRepository.create(createWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async update(id: string, updateWhaleDto: UpdateWhaleDto): Promise<Whale> {
    const whale = await this.findOne(id);
    Object.assign(whale, updateWhaleDto);
    return this.whaleRepository.save(whale);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.whaleRepository.delete(id);
  }

  /**
   * 搜索鲸鱼个体 - 支持按编号、昵称、备注模糊搜索
   */
  async search(query: string): Promise<Whale[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;

    return this.whaleRepository
      .createQueryBuilder('whale')
      .leftJoinAndSelect('whale.species', 'species')
      .where('whale.identifier LIKE :term', { term: searchTerm })
      .orWhere('whale.name LIKE :term', { term: searchTerm })
      .orWhere('whale.notes LIKE :term', { term: searchTerm })
      .orderBy('whale.createdAt', 'DESC')
      .getMany();
  }
}
