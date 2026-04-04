/**
 * 统计分析模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Phase 1
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Species } from '../species/entities/species.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { Station } from '../stations/entities/station.entity';

// Phase 2 entities (for Phase 3 stats)
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';

// Phase 3
import { AdvancedStatsController } from './advanced-stats.controller';
import { AdvancedStatsService } from './advanced-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Species, Whale, Sighting, Station,
      WhaleHealthRecord, BehaviorLog, FeedingLog, GenealogyRecord,
    ]),
  ],
  controllers: [StatsController, AdvancedStatsController],
  providers: [StatsService, AdvancedStatsService],
  exports: [StatsService, AdvancedStatsService],
})
export class StatsModule {}
