import { Test, type TestingModule } from '@nestjs/testing';
import { V1ReproductiveService } from './reproductive.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  ReproductiveCondition,
  FlowType,
  PeriodFlowIntensity,
  ReproductiveUserGoal,
  CyclePhase,
} from '@mimicare/schema';
import { type CreateReproductiveProfileDto } from './dto/create-reproductive-profile.dto';
import { type LogDailyHealthDto } from './dto/log-daily-health.dto';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { subDays, startOfDay } from 'date-fns';

describe('V1ReproductiveService', () => {
  let service: V1ReproductiveService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V1ReproductiveService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<V1ReproductiveService>(V1ReproductiveService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================================
   * PROFILE TESTS
   * ============================================================================
   */
  describe('createReproductiveProfile', () => {
    const createDto: CreateReproductiveProfileDto = {
      reproductiveGoal: ReproductiveUserGoal.TRACKING_ONLY,
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      isIrregular: false,
      isOnBirthControl: false,
      isOnFertilityTreatment: false,
    };

    it('should create a profile successfully', async () => {
      // Arrange
      prisma.reproductiveProfile.findUnique.mockResolvedValue(null);

      prisma.reproductiveProfile.create.mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        reproductiveGoal: createDto.reproductiveGoal!,
        isIrregular: createDto.isIrregular ?? false,
        averageCycleLength: createDto.averageCycleLength as any,
        averagePeriodDuration: createDto.averagePeriodDuration ?? null,
        isOnBirthControl: createDto.isOnBirthControl ?? false,
        isOnFertilityTreatment: createDto.isOnFertilityTreatment ?? false,
        diagnosedConditions: [ReproductiveCondition.NONE],
        updatedAt: new Date(),
        createdAt: new Date(),
        shortestCycle: null,
        longestCycle: null,
        lutealPhaseLength: null,
        lastRegularityAnalysis: null,
        lastRegularityCalculatedAt: null,
        lastBBTAnalysis: null,
        lastBBTAnalysisCalculatedAt: null,
        diagnosisDate: null,
        treatingDoctorId: null,
        birthControlType: null,
        smokingStatus: null,
        alcoholConsumption: null,
        stressLevel: null,
      });

      // Act
      const result = await service.createReproductiveProfile(mockUserId, createDto);

      // Assert
      expect(prisma.reproductiveProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prisma.reproductiveProfile.create).toHaveBeenCalled();
      expect(result.insight.status).toBe('HEALTHY');
      expect(result.data.userId).toBe(mockUserId);
    });

    it('should throw ConflictException if profile already exists', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.createReproductiveProfile(mockUserId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  /**
   * ============================================================================
   * DASHBOARD TESTS
   * ============================================================================
   */
  describe('getDashboard', () => {
    const mockProfile = {
      id: 'profile-1',
      userId: mockUserId,
      averageCycleLength: 28,
      isIrregular: false,
      diagnosedConditions: [],
    };

    it('should return dashboard data with HEALTHY status', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue(mockProfile as any);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      prisma.cyclePrediction.findFirst.mockResolvedValue({
        predictedStartDate: futureDate,
        predictedOvulationDate: new Date(),
        confidenceLevel: 85,
        fertilityWindowStart: new Date(),
        fertilityWindowEnd: new Date(),
      } as any);

      prisma.periodCycle.findFirst.mockResolvedValue(null);

      prisma.periodCycle.aggregate.mockResolvedValue({
        _count: 5,
        _avg: { cycleLength: 28, periodDuration: 5 },
        _min: { cycleLength: 28 },
        _max: { cycleLength: 28 },
      } as any);

      prisma.periodCycle.findMany.mockResolvedValue([{ cycleLength: 28 }] as any);

      const result = await service.getDashboard(mockUserId);

      expect(result.insight.status).toBe('HEALTHY');
      expect(result.data.daysUntilPeriod).toBeGreaterThan(0);
      expect(result.data.predictionConfidence).toBe('HIGH');
      expect(result.data.currentPhase).not.toBe(CyclePhase.MENSTRUAL);
    });

    it('should return MENSTRUAL phase if there is an active period', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue(mockProfile as any);
      prisma.cyclePrediction.findFirst.mockResolvedValue(null);

      prisma.periodCycle.findFirst.mockResolvedValue({
        startDate: new Date(),
        endDate: null,
      } as any);

      prisma.periodCycle.aggregate.mockResolvedValue({
        _count: 0,
        _avg: {},
        _min: {},
        _max: {},
      } as any);
      prisma.periodCycle.findMany.mockResolvedValue([]);

      const result = await service.getDashboard(mockUserId);

      expect(result.data.currentPhase).toBe(CyclePhase.MENSTRUAL);
      expect(result.data.hasActivePeriod).toBe(true);
    });

    it('should throw NotFoundException if profile is missing', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue(null);
      await expect(service.getDashboard(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ============================================================================
   * DAILY LOGGING TESTS
   * ============================================================================
   */
  describe('logDailyHealth', () => {
    const logDto: LogDailyHealthDto = {
      logDate: new Date().toISOString(),
      mood: 'HAPPY',
      painLevel: 'NONE',
    };

    it('should log health data successfully', async () => {
      prisma.dailyHealthLog.findFirst.mockResolvedValue(null);
      prisma.dailyHealthLog.create.mockResolvedValue({
        id: 'log-1',
        ...logDto,
        basalBodyTemp: null,
      } as any);

      const result = await service.logDailyHealth(mockUserId, logDto);

      expect(prisma.dailyHealthLog.create).toHaveBeenCalled();
      expect(result.insight.status).toBe('HEALTHY');
    });

    it('should auto-start a period if flow is heavy and no active period exists', async () => {
      const heavyFlowDto: LogDailyHealthDto = {
        ...logDto,
        flowType: FlowType.HEAVY,
      };

      prisma.dailyHealthLog.findFirst.mockResolvedValue(null);
      prisma.dailyHealthLog.create.mockResolvedValue({
        id: 'log-1',
        ...heavyFlowDto,
      } as any);

      prisma.periodCycle.findFirst.mockResolvedValue(null);

      prisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(prisma);
      });

      prisma.periodCycle.create.mockResolvedValue({
        id: 'cycle-new',
        startDate: new Date(),
      } as any);

      prisma.periodCycle.aggregate.mockResolvedValue({
        _avg: {},
        _min: {},
        _max: {},
      } as any);
      prisma.periodCycle.findMany.mockResolvedValue([]);
      prisma.reproductiveProfile.update.mockResolvedValue({} as any);

      const result = await service.logDailyHealth(mockUserId, heavyFlowDto);

      expect(result.clinicalMetrics.autoStartedPeriod).toBe(true);
      expect(prisma.periodCycle.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flowIntensity: PeriodFlowIntensity.HEAVY,
            flowMeetsDay1Threshold: true,
          }),
        }),
      );
    });

    it('should alert if basal body temperature suggests fever', async () => {
      const feverDto: LogDailyHealthDto = {
        ...logDto,
        basalBodyTemp: 39.5,
      };

      prisma.dailyHealthLog.findFirst.mockResolvedValue(null);
      prisma.dailyHealthLog.create.mockResolvedValue({
        id: 'log-1',
        ...feverDto,
      } as any);

      const result = await service.logDailyHealth(mockUserId, feverDto);

      expect(result.insight.status).toBe('CONSULT_DOCTOR');
      expect(result.insight.color).toBe('RED');
    });
  });

  /**
   * ============================================================================
   * CYCLE MANAGEMENT TESTS
   * ============================================================================
   */
  describe('startPeriodCycle', () => {
    it('should start a new cycle and close the gap from previous cycle', async () => {
      // FIX: Use startOfDay to normalize dates, ensuring integer day differences (28 not 27.9)
      const today = startOfDay(new Date());
      const startDto = {
        startDate: today.toISOString(),
        flowIntensity: PeriodFlowIntensity.MEDIUM,
      };

      // 1. Check active period (none)
      prisma.periodCycle.findFirst.mockResolvedValueOnce(null);

      // 2. Transaction setup
      prisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(prisma);
      });

      // 3. Create new cycle
      prisma.periodCycle.create.mockResolvedValue({
        id: 'cycle-new',
        startDate: today,
      } as any);

      // 4. Find previous cycle (for length calc)
      // FIX: Use subDays on 'today' to ensure exactly 28 days difference
      prisma.periodCycle.findFirst.mockResolvedValueOnce({
        id: 'cycle-prev',
        startDate: subDays(today, 28),
        endDate: subDays(today, 1),
      } as any);

      // 5. Metrics mocks
      prisma.periodCycle.aggregate.mockResolvedValue({
        _avg: { cycleLength: 28 },
        _min: {},
        _max: {},
      } as any);
      prisma.periodCycle.findMany.mockResolvedValue([]);
      prisma.reproductiveProfile.update.mockResolvedValue({} as any);

      const result = await service.startPeriodCycle(mockUserId, startDto);

      expect(prisma.periodCycle.create).toHaveBeenCalled();
      // Verify previous cycle length was updated
      expect(prisma.periodCycle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cycle-prev' },
          data: expect.objectContaining({ cycleLength: 28 }),
        }),
      );
      expect(result.clinicalMetrics.cycleStarted).toBe(true);
    });

    it('should throw ConflictException if active cycle exists', async () => {
      const startDto = {
        startDate: new Date().toISOString(),
        flowIntensity: PeriodFlowIntensity.MEDIUM,
      };
      prisma.periodCycle.findFirst.mockResolvedValue({ id: 'active' } as any);

      await expect(service.startPeriodCycle(mockUserId, startDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  /**
   * ============================================================================
   * PREDICTION TESTS
   * ============================================================================
   */
  describe('upsertCyclePrediction', () => {
    it('should throw BadRequestException if insufficient cycle history', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue({ id: 'p1' } as any);
      prisma.periodCycle.findMany.mockResolvedValue([{ id: 'c1', cycleLength: 28 }] as any);

      await expect(service.upsertCyclePrediction(mockUserId, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate prediction when enough history exists', async () => {
      prisma.reproductiveProfile.findUnique.mockResolvedValue({
        id: 'p1',
        lutealPhaseLength: 14,
        averagePeriodDuration: 5,
      } as any);

      const mockCycles = Array(6)
        .fill(0)
        .map((_, i) => ({
          id: `c${i}`,
          startDate: new Date(),
          cycleLength: 28,
          periodDuration: 5,
        }));

      prisma.periodCycle.findMany.mockResolvedValue(mockCycles as any);
      prisma.cyclePrediction.findFirst.mockResolvedValue(null);
      prisma.cyclePrediction.create.mockResolvedValue({
        id: 'pred-1',
        predictedStartDate: new Date(),
        confidenceLevel: 80,
      } as any);

      const result = await service.upsertCyclePrediction(mockUserId, { cyclesToAnalyze: 6 });

      expect(prisma.cyclePrediction.create).toHaveBeenCalled();
      expect(result.clinicalMetrics.isRegular).toBeDefined();
      expect(result.data.confidenceLevel).toBeDefined();
    });
  });
});
