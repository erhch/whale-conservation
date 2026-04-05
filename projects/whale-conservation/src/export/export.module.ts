import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    WhaleHealthRecord, BehaviorLog, FeedingLog, GenealogyRecord, Whale, Sighting,
  ])],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
