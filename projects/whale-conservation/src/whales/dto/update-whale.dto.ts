/**
 * 更新鲸鱼个体 DTO
 * 所有字段均为可选，用于 PATCH 操作
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

import { Sex, LifeStatus } from '../entities/whale.entity';

export class UpdateWhaleDto {
  @ApiPropertyOptional({ description: '唯一标识符 (如：BCX001)', example: 'BCX002' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiPropertyOptional({ description: '昵称', example: '小白' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '物种 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  speciesId?: string;

  @ApiPropertyOptional({ description: '性别', enum: Sex, example: Sex.FEMALE })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({ description: '估计年龄 (年)', example: 5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  estimatedAge?: number;

  @ApiPropertyOptional({ description: '体长 (米)', example: 12.5, minimum: 0.1, maximum: 35 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(35)
  length?: number;

  @ApiPropertyOptional({ description: '体重 (吨)', example: 25.5, minimum: 0.1, maximum: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(200)
  weight?: number;

  @ApiPropertyOptional({ description: '生命状态', enum: LifeStatus, example: LifeStatus.ALIVE })
  @IsOptional()
  @IsEnum(LifeStatus)
  lifeStatus?: LifeStatus;

  @ApiPropertyOptional({ description: '特征描述 (疤痕、鳍形状等)', example: '背鳍有明显缺口' })
  @IsOptional()
  @IsString()
  distinctiveFeatures?: string;

  @ApiPropertyOptional({ description: '照片 URL', example: 'https://example.com/photos/whale-001.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: '首次观测时间', example: '2024-06-15T10:30:00Z' })
  @IsOptional()
  firstSightedAt?: Date;

  @ApiPropertyOptional({ description: '最后观测时间', example: '2024-12-20T14:45:00Z' })
  @IsOptional()
  lastSightedAt?: Date;

  @ApiPropertyOptional({ description: '最后观测地点', example: '北纬 22.3°, 东经 114.5°' })
  @IsOptional()
  @IsString()
  lastSightedLocation?: string;
}
