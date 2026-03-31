/**
 * 统计分析控制器单元测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
  let controller: StatsController;
  let mockStatsService: Partial<StatsService>;

  beforeEach(async () => {
    mockStatsService = {
      getOverview: jest.fn(),
      getSpeciesDistribution: jest.fn(),
      getSightingsTrend: jest.fn(),
      getStationStats: jest.fn(),
      getWhaleStatusBreakdown: jest.fn(),
      getWhaleSexDistribution: jest.fn(),
      getSpeciesFrequency: jest.fn(),
      getTopLocations: jest.fn(),
      getWeeklyStats: jest.fn(),
      getMonthlyStats: jest.fn(),
      getQuarterlyStats: jest.fn(),
      getYearlyStats: jest.fn(),
      getActiveWhales: jest.fn(),
      getRecentSightings: jest.fn(),
      getRecentSightingsTotal: jest.fn(),
      getSpeciesStats: jest.fn(),
      getBehaviorDistribution: jest.fn(),
      getWhaleMigration: jest.fn(),
      getPopulationGrowthTrend: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: StatsService,
          useValue: mockStatsService,
        },
      ],
    }).compile();

    controller = module.get<StatsController>(StatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview()', () => {
    it('should return overall statistics', async () => {
      const mockResult = {
        species: { total: 12 },
        whales: { total: 45 },
        sightings: { total: 238, recent30Days: 15 },
        stations: { total: 8 },
      };

      mockStatsService.getOverview = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getOverview();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getOverview).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpeciesDistribution()', () => {
    it('should return species distribution data', async () => {
      const mockResult = [
        { name: '座头鲸', scientificName: 'Megaptera novaeangliae', count: 18 },
        { name: '蓝鲸', scientificName: 'Balaenoptera musculus', count: 5 },
      ];

      mockStatsService.getSpeciesDistribution = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getSpeciesDistribution();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getSpeciesDistribution).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSightingsTrend()', () => {
    it('should return sightings trend with default 30 days', async () => {
      const mockResult = {
        trend: [
          { date: '2026-03-01', count: 5 },
          { date: '2026-03-02', count: 8 },
        ],
        days: 30,
      };

      mockStatsService.getSightingsTrend = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getSightingsTrend(30);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getSightingsTrend).toHaveBeenCalledWith(30);
    });
  });

  describe('getStationStats()', () => {
    it('should return station statistics', async () => {
      const mockResult = {
        total: 8,
        active: 6,
        byRegion: [{ region: '东海', count: 4 }],
      };

      mockStatsService.getStationStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getStationStats();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getStationStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWhaleStatusBreakdown()', () => {
    it('should return whale status distribution', async () => {
      const mockResult = {
        alive: 35,
        deceased: 8,
        missing: 2,
      };

      mockStatsService.getWhaleStatusBreakdown = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getWhaleStatusBreakdown();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getWhaleStatusBreakdown).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWhaleSexDistribution()', () => {
    it('should return whale sex distribution', async () => {
      const mockResult = {
        male: 22,
        female: 20,
        unknown: 3,
      };

      mockStatsService.getWhaleSexDistribution = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getWhaleSexDistribution();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getWhaleSexDistribution).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpeciesFrequency()', () => {
    it('should return species frequency statistics', async () => {
      const mockResult = [
        { speciesId: '1', name: '座头鲸', sightingCount: 120 },
        { speciesId: '2', name: '蓝鲸', sightingCount: 45 },
      ];

      mockStatsService.getSpeciesFrequency = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getSpeciesFrequency();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getSpeciesFrequency).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTopLocations()', () => {
    it('should return top locations with default limit 10', async () => {
      const mockResult = [
        { location: '舟山群岛', count: 45 },
        { location: '大亚湾', count: 32 },
      ];

      mockStatsService.getTopLocations = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getTopLocations(10);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getTopLocations).toHaveBeenCalledWith(10);
    });
  });

  describe('getWeeklyStats()', () => {
    it('should return weekly statistics with default 12 weeks', async () => {
      const mockResult = {
        weeks: [
          { week: '2026-W10', count: 12 },
          { week: '2026-W11', count: 15 },
        ],
        totalWeeks: 12,
      };

      mockStatsService.getWeeklyStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getWeeklyStats(12);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getWeeklyStats).toHaveBeenCalledWith(12);
    });
  });

  describe('getMonthlyStats()', () => {
    it('should return monthly statistics with default 12 months', async () => {
      const mockResult = {
        months: [
          { month: '2025-12', count: 25 },
          { month: '2026-01', count: 30 },
        ],
        totalMonths: 12,
      };

      mockStatsService.getMonthlyStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getMonthlyStats(12);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getMonthlyStats).toHaveBeenCalledWith(12);
    });
  });

  describe('getQuarterlyStats()', () => {
    it('should return quarterly statistics with default 8 quarters', async () => {
      const mockResult = {
        quarters: [
          { quarter: '2025-Q1', count: 45 },
          { quarter: '2025-Q2', count: 52 },
        ],
        totalQuarters: 8,
      };

      mockStatsService.getQuarterlyStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getQuarterlyStats(8);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getQuarterlyStats).toHaveBeenCalledWith(8);
    });
  });

  describe('getYearlyStats()', () => {
    it('should return yearly statistics with default 10 years', async () => {
      const mockResult = {
        years: [
          { year: 2024, count: 180 },
          { year: 2025, count: 220 },
        ],
        totalYears: 10,
      };

      mockStatsService.getYearlyStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getYearlyStats(10);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getYearlyStats).toHaveBeenCalledWith(10);
    });
  });

  describe('getActiveWhales()', () => {
    it('should return active whales ranking with default params', async () => {
      const mockResult = [
        { whaleId: 'W001', name: '希望', sightingCount: 25 },
        { whaleId: 'W002', name: '自由', sightingCount: 22 },
      ];

      mockStatsService.getActiveWhales = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getActiveWhales(10, 90);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getActiveWhales).toHaveBeenCalledWith(10, 90);
    });
  });

  describe('getRecentSightings()', () => {
    it('should return recent sightings with pagination', async () => {
      const mockData = [
        { id: '1', date: '2026-03-30', species: '座头鲸' },
        { id: '2', date: '2026-03-29', species: '蓝鲸' },
      ];
      const mockTotal = 238;

      mockStatsService.getRecentSightings = jest.fn().mockResolvedValue(mockData);
      mockStatsService.getRecentSightingsTotal = jest.fn().mockResolvedValue(mockTotal);

      const result = await controller.getRecentSightings(10, 0);

      expect(result).toEqual({
        data: mockData,
        pagination: {
          limit: 10,
          offset: 0,
          total: mockTotal,
          hasMore: true,
        },
      });
      expect(mockStatsService.getRecentSightings).toHaveBeenCalledWith(10, 0);
      expect(mockStatsService.getRecentSightingsTotal).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpeciesStats()', () => {
    it('should return detailed statistics for a specific species', async () => {
      const mockResult = {
        speciesId: '1',
        name: '座头鲸',
        whaleCount: 18,
        sightingCount: 120,
        lastSighting: '2026-03-28',
      };

      mockStatsService.getSpeciesStats = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getSpeciesStats('1');

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getSpeciesStats).toHaveBeenCalledWith('1');
    });
  });

  describe('getBehaviorDistribution()', () => {
    it('should return behavior distribution statistics', async () => {
      const mockResult = [
        { behavior: '觅食', count: 85 },
        { behavior: '社交', count: 62 },
        { behavior: '迁徙', count: 45 },
      ];

      mockStatsService.getBehaviorDistribution = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getBehaviorDistribution();

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getBehaviorDistribution).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWhaleMigration()', () => {
    it('should return whale migration trajectory with default 365 days', async () => {
      const mockResult = {
        whaleId: 'W001',
        name: '希望',
        trajectory: [
          { date: '2026-03-01', lat: 30.5, lng: 122.3 },
          { date: '2026-03-15', lat: 31.2, lng: 123.1 },
        ],
        totalDistance: 450.5,
      };

      mockStatsService.getWhaleMigration = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getWhaleMigration('W001', 365);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getWhaleMigration).toHaveBeenCalledWith('W001', 365);
    });
  });

  describe('getPopulationGrowthTrend()', () => {
    it('should return population growth trend with forecast', async () => {
      const mockResult = {
        historical: [
          { month: '2025-12', population: 42 },
          { month: '2026-01', population: 43 },
        ],
        forecast: [
          { month: '2026-04', population: 46 },
          { month: '2026-05', population: 47 },
        ],
        growthRate: 0.025,
      };

      mockStatsService.getPopulationGrowthTrend = jest.fn().mockResolvedValue(mockResult);

      const result = await controller.getPopulationGrowthTrend(12, 3);

      expect(result).toEqual(mockResult);
      expect(mockStatsService.getPopulationGrowthTrend).toHaveBeenCalledWith(12, 3);
    });
  });
});
