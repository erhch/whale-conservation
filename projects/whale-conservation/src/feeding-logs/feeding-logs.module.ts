import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingLog } from './entities/feeding-log.entity';
import { FeedingLogsService } from './feeding-logs.service';
import { FeedingLogsController } from './feeding-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingLog])],
  controllers: [FeedingLogsController],
  providers: [FeedingLogsService],
  exports: [FeedingLogsService],
})
export class FeedingLogsModule {}
