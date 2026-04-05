/**
 * 应用根模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// 功能模块
import { AuthModule } from './auth/auth.module';
import { SpeciesModule } from './species/species.module';
import { WhalesModule } from './whales/whales.module';
import { SightingsModule } from './sightings/sightings.module';
import { StationsModule } from './stations/stations.module';
import { StatsModule } from './stats/stats.module';
import { HealthModule } from './health/health.module';
import { EnvironmentModule } from './environment/environment.module';
import { WhaleHealthModule } from './whale-health/whale-health.module';
import { BehaviorLogsModule } from './behavior-logs/behavior-logs.module';
import { FeedingLogsModule } from './feeding-logs/feeding-logs.module';
import { GenealogyModule } from './genealogy/genealogy.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // 数据库连接
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.WHALE_DB_HOST || 'localhost',
      port: parseInt(process.env.WHALE_DB_PORT, 10) || 5432,
      username: process.env.WHALE_DB_USER || 'postgres',
      password: process.env.WHALE_DB_PASSWORD || 'postgres',
      database: process.env.WHALE_DB_NAME || 'whale_conservation',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // 生产环境禁用
      logging: process.env.NODE_ENV === 'development',
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    }),

    // 功能模块
    AuthModule,
    SpeciesModule,
    WhalesModule,
    SightingsModule,
    StationsModule,
    StatsModule,
    HealthModule,
    EnvironmentModule,
    WhaleHealthModule,
    BehaviorLogsModule,
    FeedingLogsModule,
    GenealogyModule,
    ExportModule,
  ],
})
export class AppModule {}
