/**
 * 创建行为日志 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsString, IsOptional, IsNumber, IsArray, IsDateString,
  IsBoolean, Min, Max, IsInt,
} from 'class-validator';
import { BehaviorType, BehaviorIntensity } from '../entities/behavior-log.entity';

export class CreateBehaviorLogDto {
  @ApiProperty({ description: '鲸鱼个体 ID' })
  @IsString()
  whaleId: string;

  @ApiProperty({ description: '观测者 ID' })
  @IsString()
  observerId: string;

  @ApiProperty({ description: '观测时间' })
  @IsDateString()
  sightedAt: string;

  @ApiProperty({ description: '行为类型列表', enum: BehaviorType, isArray: true })
  @IsEnum(BehaviorType, { each: true })
  @IsArray()
  behaviors: BehaviorType[];

  @ApiPropertyOptional({ description: '行为强度', enum: BehaviorIntensity })
  @IsOptional()
  @IsEnum(BehaviorIntensity)
  intensity?: BehaviorIntensity;

  @ApiPropertyOptional({ description: '持续时间 (秒)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: '深度 (米)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ description: '游速 (km/h)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({ description: '游向 (角度 0-360)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  direction?: number;

  @ApiPropertyOptional({ description: '同群体个体数' })
  @IsOptional()
  @IsInt()
  @Min(1)
  groupSize?: number;

  @ApiPropertyOptional({ description: '同群体其他鲸鱼 ID' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedWhales?: string[];

  @ApiPropertyOptional({ description: '详细备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '观测照片' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({ description: '观测视频' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoUrls?: string[];

  @ApiPropertyOptional({ description: '水温' })
  @IsOptional()
  @IsNumber()
  waterTemp?: number;

  @ApiPropertyOptional({ description: '能见度 (米)' })
  @IsOptional()
  @IsNumber()
  visibility?: number;

  @ApiPropertyOptional({ description: '是否已验证', default: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
