/**
 * 创建觅食记录 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsArray, IsDateString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { FeedingMethod, AppetiteLevel } from '../entities/feeding-log.entity';

export class CreateFeedingLogDto {
  @ApiProperty({ description: '鲸鱼个体 ID' })
  @IsString()
  whaleId: string;

  @ApiProperty({ description: '观测者 ID' })
  @IsString()
  observerId: string;

  @ApiProperty({ description: '观测时间' })
  @IsDateString()
  sightedAt: string;

  @ApiProperty({ description: '觅食方式', enum: FeedingMethod, isArray: true })
  @IsEnum(FeedingMethod, { each: true })
  @IsArray()
  methods: FeedingMethod[];

  @ApiPropertyOptional({ description: '食欲评估', enum: AppetiteLevel })
  @IsOptional()
  @IsEnum(AppetiteLevel)
  appetite?: AppetiteLevel;

  @ApiPropertyOptional({ description: '猎物物种' })
  @IsOptional()
  @IsString()
  preySpecies?: string;

  @ApiPropertyOptional({ description: '猎物密度描述' })
  @IsOptional()
  @IsString()
  preyDensity?: string;

  @ApiPropertyOptional({ description: '进食时长 (分钟)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feedingDuration?: number;

  @ApiPropertyOptional({ description: '进食深度 (米)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feedingDepth?: number;

  @ApiPropertyOptional({ description: '是否群体觅食' })
  @IsOptional()
  @IsBoolean()
  groupFeeding?: boolean;

  @ApiPropertyOptional({ description: '同群体其他鲸鱼 ID' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  associatedWhales?: string[];

  @ApiPropertyOptional({ description: '水温' })
  @IsOptional()
  @IsNumber()
  waterTemp?: number;

  @ApiPropertyOptional({ description: '纬度' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: '经度' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '照片' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({ description: '视频' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoUrls?: string[];

  @ApiPropertyOptional({ description: '已验证', default: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
