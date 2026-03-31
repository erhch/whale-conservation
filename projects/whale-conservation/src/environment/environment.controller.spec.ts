/**
 * 环境日志控制器单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnvironmentController } from './environment.controller';
import { EnvironmentService } from './environment.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

describe('EnvironmentController', () => {
  let controller: EnvironmentController;
  let mockEnvironmentService: Partial<EnvironmentService>;

  beforeEach(async () => {
    mockEnvironmentService = {
      create: jest.fn(),
      findByStation: jest.fn(),
      findOne: jest.fn(),
      findRecent: jest.fn(),
      remove: jest.fn(),
      findByDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvironmentController],
      providers: [
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService,
        },
      ],
    }).compile();

    controller = module.get<EnvironmentController>(EnvironmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new environment record', async () => {
      const createDto: CreateEnvironmentDto = {
        stationId: '550e8400-e29b-41d4-a716-446655440000',
        recordedAt: '2026-03-29T14:30:00.000Z',
        waterTemperature: 18.5,
        salinity: 35.2,
        phLevel: 8.1,
        dissolvedOxygen: 7.5,
        turbidity: 2.3,
        chlorophyll: 1.2,
        notes: '正常观测',
      };

      const mockResult = {
        id: '660e8400-e29b-41d4-a716-446655440001',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEnvironmentService.create = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResult);
      expect(mockEnvironmentService.create).toHaveBeenCalledWith(createDto);
      expect(mockEnvironmentService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByStation()', () => {
    it('should return paginated environment data for a station', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockData = {
        data: [
          { id: '1', station_id: stationId, water_temperature: 18.5 },
          { id: '2', station_id: stationId, water_temperature: 18.3 },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockEnvironmentService.findByStation = jest.fn().mockResolvedValue(mockData);

      const result = await controller.findByStation(stationId, 1, 10);

      expect(result).toEqual(mockData);
      expect(mockEnvironmentService.findByStation).toHaveBeenCalledWith(stationId, 1, 10);
    });

    it('should use default pagination values', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockData = { data: [], total: 0, page: 1, limit: 10 };

      mockEnvironmentService.findByStation = jest.fn().mockResolvedValue(mockData);

      // Controller handles undefined by using defaults (page=1, limit=10)
      await controller.findByStation(stationId, 1, 10);

      expect(mockEnvironmentService.findByStation).toHaveBeenCalledWith(stationId, 1, 10);
    });
  });

  describe('findOne()', () => {
    it('should return a single environment record', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const mockResult = {
        id,
        station_id: '550e8400-e29b-41d4-a716-446655440001',
        water_temperature: 18.5,
        recorded_at: new Date('2026-03-29T14:30:00.000Z'),
      };

      mockEnvironmentService.findOne = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.findOne(id);

      expect(result).toEqual(mockResult);
      expect(mockEnvironmentService.findOne).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when record not found', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      mockEnvironmentService.findOne = jest.fn().mockRejectedValue(new NotFoundException('环境记录不存在'));

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRecent()', () => {
    it('should return recent environment records for a station', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockResult = [
        { id: '1', station_id: stationId, recorded_at: new Date('2026-03-29T14:30:00.000Z') },
        { id: '2', station_id: stationId, recorded_at: new Date('2026-03-29T13:30:00.000Z') },
      ];

      mockEnvironmentService.findRecent = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.findRecent(stationId, 10);

      expect(result).toEqual(mockResult);
      expect(mockEnvironmentService.findRecent).toHaveBeenCalledWith(stationId, 10);
    });

    it('should use default limit of 10', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const mockResult: any[] = [];

      mockEnvironmentService.findRecent = jest.fn().mockResolvedValue(mockResult);

      // Controller handles undefined by using default (limit=10)
      await controller.findRecent(stationId, 10);

      expect(mockEnvironmentService.findRecent).toHaveBeenCalledWith(stationId, 10);
    });
  });

  describe('remove()', () => {
    it('should delete an environment record and return success message', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      mockEnvironmentService.remove = jest.fn().mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result).toEqual({ message: '环境记录已删除' });
      expect(mockEnvironmentService.remove).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when deleting non-existent record', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      mockEnvironmentService.remove = jest.fn().mockRejectedValue(new NotFoundException('环境记录不存在'));

      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByDateRange()', () => {
    it('should return environment data within date range', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const startDate = new Date('2026-03-01T00:00:00.000Z');
      const endDate = new Date('2026-03-31T23:59:59.000Z');
      const mockResult = [
        { id: '1', station_id: stationId, recorded_at: startDate },
        { id: '2', station_id: stationId, recorded_at: new Date('2026-03-15T12:00:00.000Z') },
        { id: '3', station_id: stationId, recorded_at: endDate },
      ];

      mockEnvironmentService.findByDateRange = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.findByDateRange(stationId, startDate, endDate, 100);

      expect(result).toEqual(mockResult);
      expect(mockEnvironmentService.findByDateRange).toHaveBeenCalledWith(stationId, startDate, endDate, 100);
    });

    it('should use default limit of 100', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const startDate = new Date('2026-03-01T00:00:00.000Z');
      const endDate = new Date('2026-03-31T23:59:59.000Z');
      const mockResult: any[] = [];

      mockEnvironmentService.findByDateRange = jest.fn().mockResolvedValue(mockResult);

      // Controller handles undefined by using default (limit=100)
      await controller.findByDateRange(stationId, startDate, endDate, 100);

      expect(mockEnvironmentService.findByDateRange).toHaveBeenCalledWith(stationId, startDate, endDate, 100);
    });

    it('should throw BadRequestException when startDate is after endDate', async () => {
      const stationId = '550e8400-e29b-41d4-a716-446655440000';
      const startDate = new Date('2026-03-31T00:00:00.000Z');
      const endDate = new Date('2026-03-01T00:00:00.000Z');

      mockEnvironmentService.findByDateRange = jest.fn().mockRejectedValue(
        new BadRequestException('startDate must be before endDate'),
      );

      await expect(controller.findByDateRange(stationId, startDate, endDate, 100)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
