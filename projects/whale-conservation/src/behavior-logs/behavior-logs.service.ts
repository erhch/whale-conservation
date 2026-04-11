/**
 * 鲸鱼行为日志服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { BehaviorLog } from './entities/behavior-log.entity';
import { CreateBehaviorLogDto } from './dto/create-behavior-log.dto';
import { UpdateBehaviorLogDto } from './dto/update-behavior-log.dto';

@Injectable()
export class BehaviorLogsService {
  constructor(
    @InjectRepository(BehaviorLog)
    private behaviorRepo: Repository<BehaviorLog>,
  ) {}

  async create(dto: CreateBehaviorLogDto): Promise<BehaviorLog> {
    const log = this.behaviorRepo.create(dto);
    return this.behaviorRepo.save(log);
  }

  async findAll(params: {
    whaleId?: string;
    behaviorType?: string;
    startDate?: Date;
    endDate?: Date;
    verified?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: BehaviorLog[]; total: number }> {
    const { whaleId, behaviorType, startDate, endDate, verified, page = 1, limit = 20 } = params;
    
    const query = this.behaviorRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.whale', 'whale')
      .leftJoinAndSelect('log.observer', 'observer')
      .orderBy('log.sightedAt', 'DESC');
    
    if (whaleId) query.andWhere('log.whaleId = :whaleId', { whaleId });
    if (behaviorType) query.andWhere(':type = ANY(log.behaviors)', { type: behaviorType });
    if (startDate && endDate) query.andWhere('log.sightedAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    if (verified !== undefined) query.andWhere('log.isVerified = :verified', { verified });
    
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<BehaviorLog> {
    const log = await this.behaviorRepo.findOne({
      where: { id },
      relations: ['whale', 'observer'],
    });
    if (!log) throw new NotFoundException(`Behavior log ${id} not found`);
    return log;
  }

  async update(id: string, dto: UpdateBehaviorLogDto): Promise<BehaviorLog> {
    await this.behaviorRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.behaviorRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Behavior log ${id} not found`);
  }

  /** 获取某只鲸鱼的行为统计 */
  async getBehaviorStats(whaleId: string): Promise<any[]> {
    return this.behaviorRepo
      .createQueryBuilder('log')
      .select('log.behaviors', 'behaviors')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(log.duration)', 'avgDuration')
      .where('log.whaleId = :whaleId', { whaleId })
      .groupBy('log.behaviors')
      .orderBy('count', 'DESC')
      .getRawMany();
  }
}
