/**
 * 创建谱系记录 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { RelationshipType, ConfidenceLevel } from '../entities/genealogy-record.entity';

export class CreateGenealogyRecordDto {
  @ApiProperty({ description: '鲸鱼个体 ID' })
  @IsString()
  whaleId: string;

  @ApiProperty({ description: '关联鲸鱼个体 ID' })
  @IsString()
  relatedWhaleId: string;

  @ApiProperty({ description: '关系类型', enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ApiPropertyOptional({ description: '置信度', enum: ConfidenceLevel })
  @IsOptional()
  @IsEnum(ConfidenceLevel)
  confidence?: ConfidenceLevel;

  @ApiPropertyOptional({ description: '关系确认时间' })
  @IsOptional()
  @IsDateString()
  establishedAt?: string;

  @ApiPropertyOptional({ description: '证据描述' })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({ description: '记录者 ID' })
  @IsOptional()
  @IsString()
  recordedById?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
