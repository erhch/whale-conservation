/**
 * 鲸鱼个体管理模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhalesController } from './whales.controller';
import { WhalesService } from './whales.service';
import { Whale } from './entities/whale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Whale])],
  controllers: [WhalesController],
  providers: [WhalesService],
  exports: [WhalesService],
})
export class WhalesModule {}
