import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Whale, Sighting, WhaleHealthRecord, BehaviorLog, FeedingLog, GenealogyRecord,
  ])],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
