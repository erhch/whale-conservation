/**
 * 健康检查控制器单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthCheckService: Partial<HealthCheckService>;
  let mockTypeOrmHealthIndicator: Partial<TypeOrmHealthIndicator>;
  let mockMemoryHealthIndicator: Partial<MemoryHealthIndicator>;

  beforeEach(async () => {
    mockHealthCheckService = {
      check: jest.fn(),
    };

    mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn(),
    };

    mockMemoryHealthIndicator = {
      checkHeap: jest.fn(),
      checkRSS: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check()', () => {
    it('should perform full health check with database and memory', async () => {
      const mockResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };

      mockHealthCheckService.check = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.check();

      expect(result).toEqual(mockResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('liveness()', () => {
    it('should return simple live status with timestamp', async () => {
      const result = await controller.liveness();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('readiness()', () => {
    it('should perform readiness check with database only', async () => {
      const mockResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
        },
      };

      mockHealthCheckService.check = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.readiness();

      expect(result).toEqual(mockResult);
      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
    });
  });
});
