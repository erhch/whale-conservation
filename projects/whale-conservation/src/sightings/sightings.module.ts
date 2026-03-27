/**
 * 观测记录模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SightingsController } from './sightings.controller';
import { SightingsService } from './sightings.service';
import { Sighting } from './entities/sighting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sighting])],
  controllers: [SightingsController],
  providers: [SightingsService],
  exports: [SightingsService],
})
export class SightingsModule {}
