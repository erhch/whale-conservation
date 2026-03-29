/**
 * 创建环境日志请求 DTO
 */

import { IsUUID, IsISO8601, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnvironmentDto {
  @ApiProperty({ description: '监测站点 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  stationId: string;

  @ApiProperty({ description: '记录时间 (ISO 8601)', example: '2026-03-29T14:30:00.000Z' })
  @IsISO8601()
  recordedAt: string;

  @ApiPropertyOptional({ description: '水温 (°C)', example: 18.5, minimum: -5, maximum: 40 })
  @IsOptional()
  @IsNumber()
  @Min(-5)
  @Max(40)
  waterTemperature?: number;

  @ApiPropertyOptional({ description: '盐度 (ppt)', example: 35.2, minimum: 0, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  salinity?: number;

  @ApiPropertyOptional({ description: 'PH 值', example: 8.1, minimum: 0, maximum: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(14)
  phLevel?: number;

  @ApiPropertyOptional({ description: '溶解氧 (mg/L)', example: 7.5, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  dissolvedOxygen?: number;

  @ApiPropertyOptional({ description: '浊度 (NTU)', example: 2.3, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  turbidity?: number;

  @ApiPropertyOptional({ description: '叶绿素 (μg/L)', example: 1.2, minimum: 0, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  chlorophyll?: number;

  @ApiPropertyOptional({ description: '备注', example: '正常观测', maxLength: 500 })
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}
