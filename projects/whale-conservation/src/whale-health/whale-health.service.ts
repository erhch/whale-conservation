/**
 * 鲸鱼健康记录服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WhaleHealthRecord } from './entities/whale-health-record.entity';
import { CreateWhaleHealthRecordDto } from './dto';

@Injectable()
export class WhaleHealthService {
  constructor(
    @InjectRepository(WhaleHealthRecord)
    private healthRepo: Repository<WhaleHealthRecord>,
  ) {}

  async create(dto: CreateWhaleHealthRecordDto): Promise<WhaleHealthRecord> {
    const record = this.healthRepo.create(dto);
    return this.healthRepo.save(record);
  }

  async findAll(whaleId?: string): Promise<WhaleHealthRecord[]> {
    const query = this.healthRepo.createQueryBuilder('record')
      .orderBy('record.recordDate', 'DESC');
    
    if (whaleId) {
      query.andWhere('record.whaleId = :whaleId', { whaleId });
    }
    
    return query.getMany();
  }

  async findOne(id: string): Promise<WhaleHealthRecord> {
    const record = await this.healthRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Health record ${id} not found`);
    }
    return record;
  }

  async update(id: string, dto: Partial<CreateWhaleHealthRecordDto>): Promise<WhaleHealthRecord> {
    await this.healthRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.healthRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Health record ${id} not found`);
    }
  }
}
