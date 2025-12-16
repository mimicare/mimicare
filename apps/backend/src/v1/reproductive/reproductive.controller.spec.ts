/**
 * ============================================================================
 * REPRODUCTIVE HEALTH CONTROLLER - UNIT TESTS (TYPE-SAFE)
 * ============================================================================
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { V1ReproductiveController } from './reproductive.controller';
import { V1ReproductiveService } from './reproductive.service';
import { AccessTokenGuard } from '../../common/guards/auth';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

// ✅ IMPORT ENUMS FROM SCHEMA
import {
  ReproductiveUserGoal,
  FlowType,
  PainLevel,
  PeriodFlowIntensity,
  MoodLevel,
} from '@mimicare/schema';

// ✅ IMPORT PREDICTION METHOD ENUM FROM DTO
import { PredictionMethod } from './dto/generate-prediction.dto';

describe('V1ReproductiveController', () => {
  let controller: V1ReproductiveController;
  let service: V1ReproductiveService;

  const mockUserId = 'user_test123xyz';

  const mockProfile = {
    id: 'profile_abc123',
    userId: mockUserId,
    averageCycleLength: 28,
    averagePeriodDuration: 5,
    isIrregular: false,
    createdAt: new Date('2025-01-01'),
  };

  const mockDashboard = {
    insight: {
      status: 'HEALTHY',
      titleKey: 'insights.dashboard.period_soon.title',
      descriptionKey: 'insights.dashboard.period_soon.description',
      actionKey: 'insights.dashboard.period_soon.action',
      color: 'GREEN',
      interpolation: { days: 8 },
    },
    clinicalMetrics: {
      profileId: 'profile_abc123',
      dataQuality: 'GOOD',
      predictionAccuracy: 85,
      cyclesAnalyzed: 12,
    },
    data: {
      nextPredictedPeriod: '2025-12-24',
      currentPhase: 'LUTEAL',
      daysUntilPeriod: 8,
      isFertileWindow: false,
    },
  };

  const mockDailyLog = {
    id: 'log_xyz789',
    userId: mockUserId,
    logDate: new Date('2025-12-16'),
    flowType: FlowType.MEDIUM,
    painLevel: PainLevel.MILD,
    mood: MoodLevel.HAPPY,
    createdAt: new Date(),
  };

  const mockPeriodCycle = {
    id: 'cycle_def456',
    userId: mockUserId,
    startDate: new Date('2025-12-16'),
    endDate: null,
    flowIntensity: PeriodFlowIntensity.MEDIUM,
    cycleLength: null,
  };

  const mockPrediction = {
    id: 'pred_ghi789',
    userId: mockUserId,
    predictedPeriodStart: new Date('2025-12-24'),
    predictedPeriodEnd: new Date('2025-12-29'),
    predictedOvulation: new Date('2025-12-10'),
    confidence: 'HIGH',
    predictionMethod: PredictionMethod.CALENDAR_MEDIAN,
  };

  const mockReproductiveService = {
    getDashboard: jest.fn(),
    createReproductiveProfile: jest.fn(),
    getReproductiveProfile: jest.fn(),
    updateReproductiveProfile: jest.fn(),
    logDailyHealth: jest.fn(),
    getDailyHealthLogs: jest.fn(),
    updateDailyHealthLog: jest.fn(),
    startPeriodCycle: jest.fn(),
    endPeriodCycle: jest.fn(),
    getPeriodCycles: jest.fn(),
    getCurrentActivePeriod: jest.fn(),
    upsertCyclePrediction: jest.fn(),
    getCyclePredictions: jest.fn(),
    getFertileWindow: jest.fn(),
    getNextPredictedPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [V1ReproductiveController],
      providers: [
        {
          provide: V1ReproductiveService,
          useValue: mockReproductiveService,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<V1ReproductiveController>(V1ReproductiveController);
    service = module.get<V1ReproductiveService>(V1ReproductiveService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ============================================================================
   * DASHBOARD ENDPOINT TESTS
   * ============================================================================
   */

  describe('getDashboard', () => {
    it('should return dashboard data with success message', async () => {
      mockReproductiveService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard(mockUserId);

      expect(service.getDashboard).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Dashboard retrieved successfully',
        data: mockDashboard,
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockReproductiveService.getDashboard.mockRejectedValue(
        new NotFoundException('Reproductive profile not found'),
      );

      await expect(controller.getDashboard(mockUserId)).rejects.toThrow(NotFoundException);
      expect(service.getDashboard).toHaveBeenCalledWith(mockUserId);
    });

    it('should call service exactly once', async () => {
      mockReproductiveService.getDashboard.mockResolvedValue(mockDashboard);

      await controller.getDashboard(mockUserId);

      expect(service.getDashboard).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * ============================================================================
   * PROFILE MANAGEMENT TESTS
   * ============================================================================
   */

  describe('createProfile', () => {
    const createDto = {
      reproductiveGoal: ReproductiveUserGoal.TRACKING_ONLY, // ✅ ENUM
      averageCycleLength: 28,
      averagePeriodDuration: 5,
      isIrregular: false,
    };

    it('should create profile and return success message', async () => {
      mockReproductiveService.createReproductiveProfile.mockResolvedValue(mockProfile);

      const result = await controller.createProfile(mockUserId, createDto);

      expect(service.createReproductiveProfile).toHaveBeenCalledWith(mockUserId, createDto);
      expect(result).toEqual({
        message: 'Reproductive profile created successfully',
        data: mockProfile,
      });
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockReproductiveService.createReproductiveProfile.mockRejectedValue(
        new ConflictException('Profile already exists'),
      );

      await expect(controller.createProfile(mockUserId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid data', async () => {
      const invalidDto = { ...createDto, averageCycleLength: 15 };

      mockReproductiveService.createReproductiveProfile.mockRejectedValue(
        new BadRequestException('Cycle length must be between 21-45 days'),
      );

      await expect(controller.createProfile(mockUserId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockReproductiveService.getReproductiveProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockUserId);

      expect(service.getReproductiveProfile).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Profile retrieved successfully',
        data: mockProfile,
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockReproductiveService.getReproductiveProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(controller.getProfile(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateDto = { averageCycleLength: 30 };

    it('should update profile and return success message', async () => {
      const updatedProfile = { ...mockProfile, averageCycleLength: 30 };
      mockReproductiveService.updateReproductiveProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(mockUserId, updateDto);

      expect(service.updateReproductiveProfile).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result).toEqual({
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockReproductiveService.updateReproductiveProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(controller.updateProfile(mockUserId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ============================================================================
   * DAILY HEALTH LOGGING TESTS
   * ============================================================================
   */

  describe('logDailyHealth', () => {
    const logDto = {
      logDate: '2025-12-16',
      flowType: FlowType.MEDIUM, // ✅ ENUM
      painLevel: PainLevel.MILD, // ✅ ENUM
      mood: MoodLevel.HAPPY, // ✅ ENUM
    };

    it('should create daily log and return success message', async () => {
      mockReproductiveService.logDailyHealth.mockResolvedValue({
        insight: { status: 'HEALTHY' },
        clinicalMetrics: { logged: true },
        data: mockDailyLog,
      });

      const result = await controller.logDailyHealth(mockUserId, logDto);

      expect(service.logDailyHealth).toHaveBeenCalledWith(mockUserId, logDto);
      expect(result.message).toBe('Daily health logged successfully');
    });

    it('should throw ConflictException if log already exists', async () => {
      mockReproductiveService.logDailyHealth.mockRejectedValue(
        new ConflictException('Health log already exists for 2025-12-16. Use PATCH to update.'),
      );

      await expect(controller.logDailyHealth(mockUserId, logDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for future date', async () => {
      const futureDateDto = { ...logDto, logDate: '2025-12-25' };

      mockReproductiveService.logDailyHealth.mockRejectedValue(
        new BadRequestException('Cannot log health data for future dates'),
      );

      await expect(controller.logDailyHealth(mockUserId, futureDateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDailyLogs', () => {
    const query = { startDate: '2025-12-01', endDate: '2025-12-16' };

    it('should return paginated daily logs', async () => {
      const mockLogsResponse = {
        data: [mockDailyLog],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 1 },
      };

      mockReproductiveService.getDailyHealthLogs.mockResolvedValue(mockLogsResponse);

      const result = await controller.getDailyLogs(mockUserId, query);

      expect(service.getDailyHealthLogs).toHaveBeenCalledWith(mockUserId, query);
      expect(result.message).toBe('Daily logs retrieved successfully');
      expect(result.data).toEqual([mockDailyLog]);
    });

    it('should handle empty result set', async () => {
      mockReproductiveService.getDailyHealthLogs.mockResolvedValue({
        data: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: 1, pageSize: 0 },
      });

      const result = await controller.getDailyLogs(mockUserId, query);

      expect(result.data).toEqual([]);
    });
  });

  describe('updateDailyLog', () => {
    const logId = 'log_xyz789';
    const updateDto = { painLevel: PainLevel.MODERATE }; // ✅ ENUM

    it('should update daily log and return success message', async () => {
      const updatedLog = { ...mockDailyLog, painLevel: PainLevel.MODERATE };
      mockReproductiveService.updateDailyHealthLog.mockResolvedValue(updatedLog);

      const result = await controller.updateDailyLog(mockUserId, logId, updateDto);

      expect(service.updateDailyHealthLog).toHaveBeenCalledWith(mockUserId, logId, updateDto);
      expect(result).toEqual({
        message: 'Daily log updated successfully',
        data: updatedLog,
      });
    });

    it('should throw NotFoundException if log not found', async () => {
      mockReproductiveService.updateDailyHealthLog.mockRejectedValue(
        new NotFoundException('Daily health log not found'),
      );

      await expect(controller.updateDailyLog(mockUserId, logId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * ============================================================================
   * PERIOD CYCLE TRACKING TESTS
   * ============================================================================
   */

  describe('startCycle', () => {
    const startDto = {
      startDate: '2025-12-16',
      flowIntensity: PeriodFlowIntensity.MEDIUM, // ✅ ENUM
      notes: 'Mild cramps',
    };

    it('should start period cycle and return success message', async () => {
      mockReproductiveService.startPeriodCycle.mockResolvedValue({
        insight: { status: 'HEALTHY' },
        clinicalMetrics: { cycleStarted: true },
        data: mockPeriodCycle,
      });

      const result = await controller.startCycle(mockUserId, startDto);

      expect(service.startPeriodCycle).toHaveBeenCalledWith(mockUserId, startDto);
      expect(result.message).toBe('Period cycle started successfully');
    });

    it('should throw ConflictException if active period exists', async () => {
      mockReproductiveService.startPeriodCycle.mockRejectedValue(
        new ConflictException('Active period already exists'),
      );

      await expect(controller.startCycle(mockUserId, startDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for future date', async () => {
      const futureDateDto = { ...startDto, startDate: '2025-12-25' };

      mockReproductiveService.startPeriodCycle.mockRejectedValue(
        new BadRequestException('Cannot start period with future date'),
      );

      await expect(controller.startCycle(mockUserId, futureDateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('endCycle', () => {
    const cycleId = 'cycle_def456';
    const endDto = {
      endDate: '2025-12-21',
      flowIntensity: PeriodFlowIntensity.LIGHT, // ✅ ENUM
    };

    it('should end period cycle and return success message', async () => {
      const endedCycle = { ...mockPeriodCycle, endDate: new Date('2025-12-21') };
      mockReproductiveService.endPeriodCycle.mockResolvedValue({
        insight: { status: 'HEALTHY' },
        clinicalMetrics: { cycleEnded: true },
        data: endedCycle,
      });

      const result = await controller.endCycle(mockUserId, cycleId, endDto);

      expect(service.endPeriodCycle).toHaveBeenCalledWith(mockUserId, cycleId, endDto);
      expect(result.message).toBe('Period cycle ended successfully');
    });

    it('should throw NotFoundException if cycle not found', async () => {
      mockReproductiveService.endPeriodCycle.mockRejectedValue(
        new NotFoundException('Cycle not found'),
      );

      await expect(controller.endCycle(mockUserId, cycleId, endDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if end date before start date', async () => {
      mockReproductiveService.endPeriodCycle.mockRejectedValue(
        new BadRequestException('End date must be after start date'),
      );

      await expect(controller.endCycle(mockUserId, cycleId, endDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCycles', () => {
    const query = { limit: 12 };

    it('should return paginated cycles', async () => {
      const mockCyclesResponse = {
        data: [mockPeriodCycle],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 1 },
      };

      mockReproductiveService.getPeriodCycles.mockResolvedValue(mockCyclesResponse);

      const result = await controller.getCycles(mockUserId, query);

      expect(service.getPeriodCycles).toHaveBeenCalledWith(mockUserId, query);
      expect(result.message).toBe('Cycles retrieved successfully');
      expect(result.data).toEqual([mockPeriodCycle]);
    });
  });

  describe('getActivePeriod', () => {
    it('should return active period if exists', async () => {
      mockReproductiveService.getCurrentActivePeriod.mockResolvedValue(mockPeriodCycle);

      const result = await controller.getActivePeriod(mockUserId);

      expect(service.getCurrentActivePeriod).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Active period found',
        data: mockPeriodCycle,
      });
    });

    it('should return null if no active period', async () => {
      mockReproductiveService.getCurrentActivePeriod.mockResolvedValue(null);

      const result = await controller.getActivePeriod(mockUserId);

      expect(result).toEqual({
        message: 'No active period',
        data: null,
      });
    });
  });

  /**
   * ============================================================================
   * CYCLE PREDICTION & OVULATION TESTS
   * ============================================================================
   */

  describe('generatePrediction', () => {
    const predictionDto = {
      method: PredictionMethod.CALENDAR_MEDIAN, // ✅ ENUM
      cyclesToAnalyze: 6,
    };

    it('should generate prediction and return success message', async () => {
      mockReproductiveService.upsertCyclePrediction.mockResolvedValue({
        insight: { status: 'HEALTHY' },
        clinicalMetrics: { predictionGenerated: true },
        data: mockPrediction,
      });

      const result = await controller.generatePrediction(mockUserId, predictionDto);

      expect(service.upsertCyclePrediction).toHaveBeenCalledWith(mockUserId, predictionDto);
      expect(result.message).toBe('Cycle prediction generated successfully');
    });

    it('should throw BadRequestException if insufficient cycles', async () => {
      mockReproductiveService.upsertCyclePrediction.mockRejectedValue(
        new BadRequestException('Insufficient cycles. Need at least 3 completed cycles.'),
      );

      await expect(controller.generatePrediction(mockUserId, predictionDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPredictions', () => {
    it('should return recent predictions', async () => {
      mockReproductiveService.getCyclePredictions.mockResolvedValue([mockPrediction]);

      const result = await controller.getPredictions(mockUserId);

      expect(service.getCyclePredictions).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Predictions retrieved successfully',
        data: [mockPrediction],
      });
    });

    it('should handle empty predictions array', async () => {
      mockReproductiveService.getCyclePredictions.mockResolvedValue([]);

      const result = await controller.getPredictions(mockUserId);

      expect(result.data).toEqual([]);
    });
  });

  describe('getFertileWindow', () => {
    const mockFertileWindow = {
      start: new Date('2025-12-05'),
      end: new Date('2025-12-11'),
      peak: new Date('2025-12-10'),
      dailyProbabilities: [
        { date: '2025-12-05', probability: 0.1 },
        { date: '2025-12-10', probability: 0.33 },
      ],
    };

    it('should return fertile window dates', async () => {
      mockReproductiveService.getFertileWindow.mockResolvedValue(mockFertileWindow);

      const result = await controller.getFertileWindow(mockUserId);

      expect(service.getFertileWindow).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Fertile window retrieved successfully',
        data: mockFertileWindow,
      });
    });

    it('should throw NotFoundException if no predictions available', async () => {
      mockReproductiveService.getFertileWindow.mockRejectedValue(
        new NotFoundException('No predictions available'),
      );

      await expect(controller.getFertileWindow(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNextPeriod', () => {
    it('should return next predicted period date', async () => {
      const predictedDate = new Date('2025-12-24');
      mockReproductiveService.getNextPredictedPeriod.mockResolvedValue(predictedDate);

      const result = await controller.getNextPeriod(mockUserId);

      expect(service.getNextPredictedPeriod).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        message: 'Next period prediction retrieved successfully',
        data: { predictedDate },
      });
    });

    it('should throw NotFoundException if no predictions available', async () => {
      mockReproductiveService.getNextPredictedPeriod.mockRejectedValue(
        new NotFoundException('No predictions available'),
      );

      await expect(controller.getNextPeriod(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
