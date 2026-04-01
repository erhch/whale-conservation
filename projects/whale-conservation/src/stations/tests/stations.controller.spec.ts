/**
 * 监测站点控制器单元测试
 * 
 * 测试 StationsController 的所有 API 端点
 * 覆盖场景：列表查询、分页筛选、活跃站点、搜索、统计、CRUD 操作
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { StationsController } from '../stations.controller';
import { StationsService } from '../stations.service';
import { Station, StationType, StationStatus } from '../entities/station.entity';
import { CreateStationDto, UpdateStationDto } from '../dto/station.dto';

describe('StationsController', () => {
  let controller: StationsController;
  let service: StationsService;

  // 模拟站点数据
  const mockStations: Station[] = [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      code: 'ST001',
      name: '长江口监测站',
      type: StationType.FIXED,
      status: StationStatus.ACTIVE,
      latitude: 31.2304,
      longitude: 121.4737,
      location: '上海市浦东新区长江入海口',
      depth: 15.5,
      installedAt: new Date('2024-01-15T08:30:00.000Z'),
      responsiblePerson: '张三',
      contactPhone: '13800138000',
      equipment: '{"cameras": 2, "sensors": 5}',
      createdAt: new Date('2024-01-15T08:30:00.000Z'),
      updatedAt: new Date('2024-01-15T08:30:00.000Z'),
      environmentLogs: [],
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      code: 'ST002',
      name: '南海观测船',
      type: StationType.VESSEL,
      status: StationStatus.ACTIVE,
      latitude: 18.2567,
      longitude: 109.5123,
      location: '南海海域',
      depth: 50.0,
      installedAt: new Date('2024-02-20T10:00:00.000Z'),
      responsiblePerson: '李四',
      contactPhone: '13900139000',
      equipment: '{"cameras": 1, "sensors": 3, "hydrophone": true}',
      createdAt: new Date('2024-02-20T10:00:00.000Z'),
      updatedAt: new Date('2024-02-20T10:00:00.000Z'),
      environmentLogs: [],
    },
    {
      id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      code: 'ST003',
      name: '黄海浮标站',
      type: StationType.FIXED,
      status: StationStatus.MAINTENANCE,
      latitude: 36.0671,
      longitude: 120.3826,
      location: '黄海海域',
      depth: 25.0,
      installedAt: new Date('2024-03-10T14:30:00.000Z'),
      responsiblePerson: '王五',
      contactPhone: '13700137000',
      equipment: '{"sensors": 8, "weatherStation": true}',
      createdAt: new Date('2024-03-10T14:30:00.000Z'),
      updatedAt: new Date('2024-03-10T14:30:00.000Z'),
      environmentLogs: [],
    },
  ];

  beforeEach(async () => {
    const mockStationsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findActive: jest.fn(),
      search: jest.fn(),
      getStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StationsController],
      providers: [
        {
          provide: StationsService,
          useValue: mockStationsService,
        },
      ],
    }).compile();

    controller = module.get<StationsController>(StationsController);
    service = module.get<StationsService>(StationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll()', () => {
    it('应该返回分页的站点列表 (默认参数)', async () => {
      const mockResult = {
        data: [mockStations[0], mockStations[1]],
        total: 2,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('应该支持按类型筛选', async () => {
      const mockResult = {
        data: [mockStations[0]],
        total: 1,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10, StationType.FIXED);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: StationType.FIXED,
      });
    });

    it('应该支持按状态筛选', async () => {
      const mockResult = {
        data: [mockStations[2]],
        total: 1,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10, undefined, StationStatus.MAINTENANCE);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        status: StationStatus.MAINTENANCE,
      });
    });

    it('应该支持组合筛选 (类型 + 状态)', async () => {
      const mockResult = {
        data: [mockStations[0]],
        total: 1,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10, StationType.FIXED, StationStatus.ACTIVE);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: StationType.FIXED,
        status: StationStatus.ACTIVE,
      });
    });
  });

  describe('findActive()', () => {
    it('应该返回所有活跃站点', async () => {
      const activeStations = mockStations.filter(s => s.status === StationStatus.ACTIVE);
      jest.spyOn(service, 'findActive').mockResolvedValue(activeStations);

      const result = await controller.findActive();

      expect(result).toEqual(activeStations);
      expect(result.length).toBe(2);
      expect(service.findActive).toHaveBeenCalledTimes(1);
    });

    it('当没有活跃站点时应该返回空数组', async () => {
      jest.spyOn(service, 'findActive').mockResolvedValue([]);

      const result = await controller.findActive();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('search()', () => {
    it('应该按关键词搜索站点', async () => {
      const searchResults = [mockStations[0]];
      jest.spyOn(service, 'search').mockResolvedValue(searchResults);

      const result = await controller.search('长江');

      expect(result).toEqual(searchResults);
      expect(service.search).toHaveBeenCalledWith('长江');
    });

    it('应该支持按站点代码搜索', async () => {
      const searchResults = [mockStations[0]];
      jest.spyOn(service, 'search').mockResolvedValue(searchResults);

      const result = await controller.search('ST001');

      expect(result).toEqual(searchResults);
      expect(service.search).toHaveBeenCalledWith('ST001');
    });

    it('当没有匹配结果时应该返回空数组', async () => {
      jest.spyOn(service, 'search').mockResolvedValue([]);

      const result = await controller.search('不存在的站点');

      expect(result).toEqual([]);
    });
  });

  describe('getStats()', () => {
    it('应该返回站点统计信息', async () => {
      const mockStats = {
        total: 3,
        byType: {
          fixed: 2,
          vessel: 1,
          mobile: 0,
        },
        byStatus: {
          active: 2,
          maintenance: 1,
          inactive: 0,
        },
      };

      jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(result.total).toBe(3);
      expect(result.byType.fixed).toBe(2);
      expect(result.byStatus.active).toBe(2);
    });
  });

  describe('findOne()', () => {
    it('应该返回单个站点详情', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockStations[0]);

      const result = await controller.findOne('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(result).toEqual(mockStations[0]);
      expect(result.code).toBe('ST001');
      expect(service.findOne).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('当站点不存在时应该抛出 NotFoundException', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('站点不存在'));

      await expect(
        controller.findOne('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('应该创建新站点', async () => {
      const createDto: CreateStationDto = {
        code: 'ST004',
        name: '珠江口监测站',
        type: StationType.FIXED,
        status: StationStatus.ACTIVE,
        latitude: 22.3193,
        longitude: 113.8008,
        location: '广东省珠海市珠江入海口',
        depth: 12.0,
        responsiblePerson: '赵六',
        contactPhone: '13600136000',
      };

      const newStation: Station = {
        id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
        code: createDto.code,
        name: createDto.name,
        type: (createDto.type as StationType) || StationType.FIXED,
        status: (createDto.status as StationStatus) || StationStatus.ACTIVE,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        location: createDto.location as string,
        depth: createDto.depth as number,
        installedAt: new Date(),
        responsiblePerson: createDto.responsiblePerson as string,
        contactPhone: createDto.contactPhone as string,
        equipment: null as unknown as string,
        createdAt: new Date(),
        updatedAt: new Date(),
        environmentLogs: [],
      };

      jest.spyOn(service, 'create').mockResolvedValue(newStation);

      const result = await controller.create(createDto);

      expect(result).toEqual(newStation);
      expect(result.code).toBe('ST004');
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update()', () => {
    it('应该更新站点信息', async () => {
      const updateDto: UpdateStationDto = {
        status: StationStatus.MAINTENANCE,
        responsiblePerson: '新负责人',
      };

      const updatedStation: Station = {
        ...mockStations[0],
        ...updateDto,
        updatedAt: new Date(),
        installedAt: mockStations[0].installedAt as Date,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedStation);

      const result = await controller.update('a1b2c3d4-e5f6-7890-abcd-ef1234567890', updateDto);

      expect(result).toEqual(updatedStation);
      expect(result.status).toBe(StationStatus.MAINTENANCE);
      expect(result.responsiblePerson).toBe('新负责人');
      expect(service.update).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-abcd-ef1234567890', updateDto);
    });

    it('当站点不存在时应该抛出 NotFoundException', async () => {
      const updateDto: UpdateStationDto = { status: StationStatus.ACTIVE };
      jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException('站点不存在'));

      await expect(
        controller.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('应该删除站点', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove('a1b2c3d4-e5f6-7890-abcd-ef1234567890');

      expect(service.remove).toHaveBeenCalledWith('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('当站点不存在时应该抛出 NotFoundException', async () => {
      jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException('站点不存在'));

      await expect(
        controller.remove('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('边界情况测试', () => {
    describe('分页参数边界', () => {
      it('应该处理第 1 页', async () => {
        const mockResult = { data: [], total: 0, page: 1, limit: 10 };
        jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

        await controller.findAll(1, 10);
        expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
      });

      it('应该处理大页码', async () => {
        const mockResult = { data: [], total: 0, page: 100, limit: 10 };
        jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

        await controller.findAll(100, 10);
        expect(service.findAll).toHaveBeenCalledWith({ page: 100, limit: 10 });
      });
    });

    describe('搜索边界', () => {
      it('应该处理空搜索关键词', async () => {
        jest.spyOn(service, 'search').mockResolvedValue([]);

        const result = await controller.search('');
        expect(result).toEqual([]);
      });

      it('应该处理特殊字符搜索', async () => {
        jest.spyOn(service, 'search').mockResolvedValue([]);

        await controller.search('测试@#$%');
        expect(service.search).toHaveBeenCalledWith('测试@#$%');
      });
    });
  });
});
