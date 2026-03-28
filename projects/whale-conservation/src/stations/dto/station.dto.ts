/**
 * 监测站点数据传输对象
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

import { StationType, StationStatus } from '../entities/station.entity';

export class CreateStationDto {
  @ApiProperty({ description: '站点代码', example: 'ST001' })
  @IsString()
  code: string;

  @ApiProperty({ description: '站点名称', example: '长江口监测站' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '站点类型',
    enum: StationType,
    default: StationType.FIXED,
  })
  @IsEnum(StationType)
  @IsOptional()
  type?: StationType;

  @ApiPropertyOptional({
    description: '站点状态',
    enum: StationStatus,
    default: StationStatus.ACTIVE,
  })
  @IsEnum(StationStatus)
  @IsOptional()
  status?: StationStatus;

  @ApiProperty({ description: '纬度', example: 31.2304 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: '经度', example: 121.4737 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: '位置描述', example: '上海市浦东新区长江入海口' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '水深 (米)', example: 15.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  depth?: number;

  @ApiPropertyOptional({ description: '安装时间' })
  @IsDateString()
  @IsOptional()
  installedAt?: string;

  @ApiPropertyOptional({ description: '负责人', example: '张三' })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: '联系电话', example: '13800138000' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '设备清单 (JSON 字符串)', example: '{"cameras": 2, "sensors": 5}' })
  @IsString()
  @IsOptional()
  equipment?: string;
}

export class UpdateStationDto {
  @ApiPropertyOptional({ description: '站点名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: '站点类型',
    enum: StationType,
  })
  @IsEnum(StationType)
  @IsOptional()
  type?: StationType;

  @ApiPropertyOptional({
    description: '站点状态',
    enum: StationStatus,
  })
  @IsEnum(StationStatus)
  @IsOptional()
  status?: StationStatus;

  @ApiPropertyOptional({ description: '纬度' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: '经度' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: '位置描述' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: '水深 (米)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  depth?: number;

  @ApiPropertyOptional({ description: '安装时间' })
  @IsDateString()
  @IsOptional()
  installedAt?: string;

  @ApiPropertyOptional({ description: '负责人' })
  @IsString()
  @IsOptional()
  responsiblePerson?: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '设备清单 (JSON 字符串)' })
  @IsString()
  @IsOptional()
  equipment?: string;
}
