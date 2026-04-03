/**
 * 创建健康记录 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { HealthType, HealthStatus } from '../entities/whale-health-record.entity';

export class CreateWhaleHealthRecordDto {
  @ApiProperty({ description: '鲸鱼个体 ID' })
  @IsString()
  whaleId: string;

  @ApiProperty({ description: '记录类型', enum: HealthType })
  @IsEnum(HealthType)
  type: HealthType;

  @ApiProperty({ description: '标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '详细描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '兽医/记录人' })
  @IsOptional()
  @IsString()
  vetName?: string;

  @ApiPropertyOptional({ description: '状态', enum: HealthStatus })
  @IsOptional()
  @IsEnum(HealthStatus)
  status?: HealthStatus;

  @ApiProperty({ description: '记录日期' })
  @IsDateString()
  recordDate: string;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '照片链接列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
