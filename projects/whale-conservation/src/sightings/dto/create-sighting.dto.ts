/**
 * 创建观测记录 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateSightingDto {
  @ApiPropertyOptional({ description: '关联鲸鱼 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsString()
  whaleId?: string;

  @ApiPropertyOptional({ description: '关联监测站点 ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsString()
  stationId?: string;

  @ApiProperty({ description: '观测者 ID', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsString()
  observerId: string;

  @ApiProperty({ description: '观测时间', example: '2026-03-29T10:30:00Z' })
  @IsDateString()
  sightedAt: string;

  @ApiProperty({ description: '纬度 (-90 到 90)', example: 22.3, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: '经度 (-180 到 180)', example: 114.5, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: '地点名称', example: '南海北部海域' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ description: '行为描述', example: '跃出水面、喷气' })
  @IsOptional()
  @IsString()
  behavior?: string;

  @ApiPropertyOptional({ description: '群体数量', example: 3, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  groupSize?: number;

  @ApiPropertyOptional({ description: '备注信息', example: '天气良好，能见度高' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '照片 URLs 数组', example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({ description: '天气状况', example: '晴' })
  @IsOptional()
  @IsString()
  weather?: string;

  @ApiPropertyOptional({ description: '海况等级 (0-9)', example: 2, minimum: 0, maximum: 9 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  seaState?: number;

  @ApiPropertyOptional({ description: '是否已验证', default: true, example: true })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
