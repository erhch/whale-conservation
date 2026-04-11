/**
 * 鲸鱼觅食记录服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeedingLog } from './entities/feeding-log.entity';
import { CreateFeedingLogDto } from './dto';

@Injectable()
export class FeedingLogsService {
  constructor(
    @InjectRepository(FeedingLog)
    private feedingRepo: Repository<FeedingLog>,
  ) {}

  async create(dto: CreateFeedingLogDto): Promise<FeedingLog> {
    const log = this.feedingRepo.create(dto);
    return this.feedingRepo.save(log);
  }

  async findAll(params: {
    whaleId?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: FeedingLog[]; total: number }> {
    const { whaleId, method, startDate, endDate, page = 1, limit = 20 } = params;
    const query = this.feedingRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.whale', 'whale')
      .leftJoinAndSelect('log.observer', 'observer')
      .orderBy('log.sightedAt', 'DESC');
    if (whaleId) query.andWhere('log.whaleId = :whaleId', { whaleId });
    if (method) query.andWhere(':method = ANY(log.methods)', { method });
    if (startDate && endDate) query.andWhere('log.sightedAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<FeedingLog> {
    const log = await this.feedingRepo.findOne({ where: { id }, relations: ['whale', 'observer'] });
    if (!log) throw new NotFoundException(`Feeding log ${id} not found`);
    return log;
  }

  async remove(id: string): Promise<void> {
    const result = await this.feedingRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Feeding log ${id} not found`);
  }
}
