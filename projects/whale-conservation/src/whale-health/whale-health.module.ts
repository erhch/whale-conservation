/**
 * 鲸鱼健康记录模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhaleHealthRecord } from './entities/whale-health-record.entity';
import { WhaleHealthService } from './whale-health.service';
import { WhaleHealthController } from './whale-health.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WhaleHealthRecord])],
  controllers: [WhaleHealthController],
  providers: [WhaleHealthService],
  exports: [WhaleHealthService],
})
export class WhaleHealthModule {}
