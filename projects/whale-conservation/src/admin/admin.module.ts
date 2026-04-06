import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Whale } from '../whales/entities/whale.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { Species } from '../species/entities/species.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { FeedingLog } from '../feeding-logs/entities/feeding-log.entity';
import { GenealogyRecord } from '../genealogy/entities/genealogy-record.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Station } from '../stations/entities/station.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Whale, Sighting, Species, WhaleHealthRecord,
    BehaviorLog, FeedingLog, GenealogyRecord,
    AuditLog, Notification, Station,
  ])],
  controllers: [AdminController],
})
export class AdminModule {}
