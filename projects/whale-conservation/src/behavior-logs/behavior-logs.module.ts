/**
 * 鲸鱼行为日志模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BehaviorLog } from './entities/behavior-log.entity';
import { BehaviorLogsService } from './behavior-logs.service';
import { BehaviorLogsController } from './behavior-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BehaviorLog])],
  controllers: [BehaviorLogsController],
  providers: [BehaviorLogsService],
  exports: [BehaviorLogsService],
})
export class BehaviorLogsModule {}
