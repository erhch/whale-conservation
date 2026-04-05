import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { WhaleHealthRecord } from '../whale-health/entities/whale-health-record.entity';
import { Whale } from '../whales/entities/whale.entity';
import { BehaviorLog } from '../behavior-logs/entities/behavior-log.entity';
import { Sighting } from '../sightings/entities/sighting.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    Notification, WhaleHealthRecord, Whale, BehaviorLog, Sighting,
  ])],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationsModule {}
