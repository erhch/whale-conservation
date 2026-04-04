/**
 * 鲸鱼谱系服务
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GenealogyRecord, WhalePedigree } from '../entities/genealogy-record.entity';
import { CreateGenealogyRecordDto } from './dto/create-genealogy-record.dto';
import { UpdateGenealogyRecordDto } from './dto/update-genealogy-record.dto';

@Injectable()
export class GenealogyService {
  constructor(
    @InjectRepository(GenealogyRecord)
    private genealogyRepo: Repository<GenealogyRecord>,
    @InjectRepository(WhalePedigree)
    private pedigreeRepo: Repository<WhalePedigree>,
  ) {}

  // === Genealogy Records ===

  async createRecord(dto: CreateGenealogyRecordDto): Promise<GenealogyRecord> {
    const record = this.genealogyRepo.create(dto);
    return this.genealogyRepo.save(record);
  }

  async findAll(whaleId?: string, relationshipType?: string): Promise<{ data: GenealogyRecord[]; total: number }> {
    const query = this.genealogyRepo.createQueryBuilder('record')
      .leftJoinAndSelect('record.whale', 'whale')
      .leftJoinAndSelect('record.relatedWhale', 'relatedWhale')
      .leftJoinAndSelect('record.recordedBy', 'recorder')
      .orderBy('record.establishedAt', 'DESC');

    if (whaleId) query.andWhere('record.whaleId = :whaleId', { whaleId });
    if (relationshipType) query.andWhere('record.relationshipType = :type', { type: relationshipType });

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<GenealogyRecord> {
    const record = await this.genealogyRepo.findOne({
      where: { id },
      relations: ['whale', 'relatedWhale', 'recordedBy'],
    });
    if (!record) throw new NotFoundException(`Genealogy record ${id} not found`);
    return record;
  }

  async update(id: string, dto: UpdateGenealogyRecordDto): Promise<GenealogyRecord> {
    await this.genealogyRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.genealogyRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Genealogy record ${id} not found`);
  }

  // === Whale Pedigree ===

  async getPedigree(whaleId: string): Promise<WhalePedigree | null> {
    return this.pedigreeRepo.findOne({
      where: { whaleId },
      relations: ['whale', 'mother', 'father'],
    });
  }

  async updatePedigree(whaleId: string, data: Partial<WhalePedigree>): Promise<WhalePedigree> {
    let pedigree = await this.getPedigree(whaleId);
    if (!pedigree) {
      pedigree = this.pedigreeRepo.create({ whaleId, ...data });
    } else {
      Object.assign(pedigree, data);
    }
    return this.pedigreeRepo.save(pedigree);
  }

  /** 获取某只鲸鱼的完整家谱树（向上追溯 3 代） */
  async getFamilyTree(whaleId: string, depth: number = 3): Promise<any> {
    const pedigree = await this.getPedigree(whaleId);
    if (!pedigree) return null;

    const buildTree = async (id: string, currentDepth: number): Promise<any> => {
      if (currentDepth <= 0) return null;
      const p = await this.getPedigree(id);
      if (!p) return null;

      return {
        whale: p.whale,
        mother: p.motherId ? await buildTree(p.motherId, currentDepth - 1) : null,
        father: p.fatherId ? await buildTree(p.fatherId, currentDepth - 1) : null,
        clan: p.clan,
        matriline: p.matriline,
      };
    };

    return buildTree(whaleId, depth);
  }

  /** 获取某只鲸鱼的所有后代 */
  async getDescendants(whaleId: string): Promise<GenealogyRecord[]> {
    return this.genealogyRepo.createQueryBuilder('record')
      .leftJoinAndSelect('record.relatedWhale', 'relatedWhale')
      .leftJoinAndSelect('record.whale', 'whale')
      .where('record.whaleId = :whaleId', { whaleId })
      .andWhere('record.relationshipType = :type', { type: 'parent_offspring' })
      .getMany();
  }
}
