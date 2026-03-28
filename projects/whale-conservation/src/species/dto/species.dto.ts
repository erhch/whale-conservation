/**
 * 物种数据传输对象
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsUrl,
} from 'class-validator';

import { IUCNStatus } from '../entities/species.entity';

export class CreateSpeciesDto {
  @ApiProperty({ description: '学名', example: 'Balaenoptera musculus' })
  @IsString()
  scientificName: string;

  @ApiProperty({ description: '中文名', example: '蓝鲸' })
  @IsString()
  commonNameZh: string;

  @ApiPropertyOptional({ description: '英文名', example: 'Blue Whale' })
  @IsString()
  @IsOptional()
  commonNameEn?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '科', example: 'Balaenopteridae' })
  @IsString()
  @IsOptional()
  family?: string;

  @ApiPropertyOptional({ description: '平均体长 (米)', example: 25 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageLength?: number;

  @ApiPropertyOptional({ description: '平均体重 (吨)', example: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageWeight?: number;

  @ApiPropertyOptional({
    description: 'IUCN 保护等级',
    enum: IUCNStatus,
    example: IUCNStatus.EN,
  })
  @IsEnum(IUCNStatus)
  @IsOptional()
  iucnStatus?: IUCNStatus;

  @ApiPropertyOptional({ description: '种群数量估计', example: 10000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  populationEstimate?: number;

  @ApiPropertyOptional({ description: '分布区域', example: '全球各大洋' })
  @IsString()
  @IsOptional()
  distribution?: string;

  @ApiPropertyOptional({ description: '图片 URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateSpeciesDto {
  @ApiPropertyOptional({ description: '中文名' })
  @IsString()
  @IsOptional()
  commonNameZh?: string;

  @ApiPropertyOptional({ description: '英文名' })
  @IsString()
  @IsOptional()
  commonNameEn?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '科' })
  @IsString()
  @IsOptional()
  family?: string;

  @ApiPropertyOptional({ description: '平均体长 (米)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageLength?: number;

  @ApiPropertyOptional({ description: '平均体重 (吨)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  averageWeight?: number;

  @ApiPropertyOptional({
    description: 'IUCN 保护等级',
    enum: IUCNStatus,
  })
  @IsEnum(IUCNStatus)
  @IsOptional()
  iucnStatus?: IUCNStatus;

  @ApiPropertyOptional({ description: '种群数量估计' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  populationEstimate?: number;

  @ApiPropertyOptional({ description: '分布区域' })
  @IsString()
  @IsOptional()
  distribution?: string;

  @ApiPropertyOptional({ description: '图片 URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
