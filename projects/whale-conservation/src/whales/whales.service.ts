/**
 * 鲸鱼个体服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Whale, LifeStatus } from './entities/whale.entity';
import { CreateWhaleDto, UpdateWhaleDto } from './dto';
import { Sighting } from '../sightings/entities/sighting.entity';

interface FindWhalesOptions {
  page: number;
  limit: number;
  speciesId?: string;
  sex?: string;
  active?: boolean;
}

interface FindSightingsOptions {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
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

  /**
   * 获取某只鲸鱼的观测记录 (支持分页和日期范围筛选)
   */
  async findSightings(
    whaleId: string,
    options: FindSightingsOptions,
  ): Promise<{ data: Sighting[]; total: number; page: number; limit: number }> {
    const { page, limit, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    // 验证鲸鱼是否存在
    const whale = await this.whaleRepository.findOne({ where: { id: whaleId } });
    if (!whale) {
      throw new NotFoundException('鲸鱼个体不存在');
    }

    const queryBuilder = this.whaleRepository
      .createQueryBuilder('whale')
      .leftJoinAndSelect('whale.sightings', 'sighting')
      .leftJoinAndSelect('sighting.station', 'station')
      .leftJoinAndSelect('sighting.observer', 'observer')
      .where('whale.id = :whaleId', { whaleId })
      .orderBy('sighting.observedAt', 'DESC')
      .skip(skip)
      .take(limit);

    // 日期范围筛选
    if (startDate) {
      queryBuilder.andWhere('sighting.observedAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('sighting.observedAt <= :endDate', { endDate });
    }

    const result = await queryBuilder.getManyAndCount();
    const sightings = result[0].length > 0 ? result[0][0].sightings : [];
    const total = result[1];

    return { data: sightings, total, page, limit };
  }
}
