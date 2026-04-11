/**
 * 健康检查控制器单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth()', () => {
    it('should return health status with uptime and memory', async () => {
      const result = await controller.getHealth();

      expect(result.status).toBe('ok');
      expect(result.uptime).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.memory).toBeDefined();
    });
  });

  describe('getDetailedHealth()', () => {
    it('should return detailed status with database health', async () => {
      const result = await controller.getDetailedHealth();

      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.database.connected).toBe(true);
      expect(result.memory).toBeDefined();
    });

    it('should handle database connection failure', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      const result = await controller.getDetailedHealth();

      expect(result.status).toBe('degraded');
      expect(result.database.connected).toBe(false);
    });
  });

  describe('getMetrics()', () => {
    it('should return memory and CPU metrics', async () => {
      const result = await controller.getMetrics();

      expect(result.memory).toBeDefined();
      expect(result.cpu).toBeDefined();
      expect(result.memory.rss).toBeDefined();
      expect(result.memory.heapTotal).toBeDefined();
      expect(result.memory.heapUsed).toBeDefined();
    });
  });

  describe('getVersion()', () => {
    it('should return version info', () => {
      const result = controller.getVersion();

      expect(result.name).toBe('whale-conservation');
      expect(result.version).toBeDefined();
    });
  });

  describe('check()', () => {
    it('should perform full health check with database and memory', async () => {
      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.info.database.status).toBe('up');
      expect(result.info.memory_heap.status).toBe('up');
      expect(result.info.memory_rss.status).toBe('up');
    });
  });

  describe('liveness()', () => {
    it('should return simple live status with timestamp', () => {
      const result = controller.liveness();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('readiness()', () => {
    it('should perform readiness check with database', async () => {
      const result = await controller.readiness();

      expect(result.status).toBe('ok');
      expect(result.info.database.status).toBe('up');
    });

    it('should return error when database is down', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(new Error('DB down'));

      const result = await controller.readiness();

      expect(result.status).toBe('error');
      expect(result.info.database.status).toBe('down');
    });
  });
});
