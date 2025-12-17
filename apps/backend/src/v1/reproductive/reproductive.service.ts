/**
 * ============================================================================
 * REPRODUCTIVE HEALTH SERVICE - OPTIMIZED
 * ============================================================================
 *
 * Complete business logic for reproductive health tracking with:
 * - Database-level aggregations for performance
 * - Background job readiness for heavy computations
 * - i18n-ready translation keys
 * - Smart caching and conflict resolution
 *
 * @module ReproductiveModule
 * @category Service
 * @since 1.0.0
 * @author Mimicare Development Team
 * @lastUpdated 2025-12-16
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays,
  isAfter,
  parseISO,
  isFuture,
  subDays,
} from 'date-fns';
import { ReproductiveCondition, FlowType, PeriodFlowIntensity, CyclePhase } from '@mimicare/schema';

import { type CreateReproductiveProfileDto } from './dto/create-reproductive-profile.dto';
import { type UpdateReproductiveProfileDto } from './dto/update-reproductive-profile.dto';
import { type LogDailyHealthDto } from './dto/log-daily-health.dto';
import { type UpdateDailyHealthDto } from './dto/update-daily-health.dto';
import { type StartPeriodCycleDto } from './dto/start-period-cycle.dto';
import { type EndPeriodCycleDto } from './dto/end-period-cycle.dto';
import { type GeneratePredictionDto, PredictionMethod } from './dto/generate-prediction.dto';
import { type CycleHistoryQueryDto, type DailyLogsQueryDto } from './dto/query-filters.dto';

import {
  calculateCycleLength,
  calculateAverageCycleLength,
  predictNextPeriodStart,
  calculateOvulationDate,
  calculateFertileWindow,
  type FertileWindow,
} from './helpers/cycle-calculator.helper';

import {
  isCycleRegular,
  analyzeCycleRegularity,
  type CycleRegularityAnalysis,
} from './helpers/cycle-regularity.helper';

import {
  analyzeBBTPattern,
  type BBTAnalysis,
  type BBTReading,
} from './helpers/bbt-analysis.helper';

import { REPRODUCTIVE_CONSTANTS } from './constants/reproductive.constants';

import { type CycleStatistics } from './entities/reproductive-dashboard.entity';

/**
 * User-Friendly Insight Structure with i18n keys
 */
interface UserInsight {
  status: 'HEALTHY' | 'ATTENTION' | 'CONSULT_DOCTOR';
  titleKey: string;
  descriptionKey: string;
  actionKey: string;
  color: 'GREEN' | 'YELLOW' | 'RED';
  interpolation?: Record<string, any>;
}

/**
 * Tiered Response Structure
 */
interface TieredResponse<T> {
  insight: UserInsight;
  clinicalMetrics: Record<string, any>;
  data: T;
}

/**
 * Dashboard Data Structure
 */
interface DashboardData {
  nextPredictedPeriod: Date | null;
  predictedOvulation: Date | null;
  currentPhase: CyclePhase;
  daysUntilPeriod: number;
  daysUntilOvulation: number;
  isFertileWindow: boolean;
  fertileWindowDates: { start: Date; end: Date } | null;
  averageCycleLength: number;
  isCycleRegular: boolean;
  predictionConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  predictionType: 'TENTATIVE' | 'CONFIRMED';
  hasActivePeriod: boolean;
  activePeriodDay: number | null;
  statistics: CycleStatistics;
  healthAlerts: string[];
}

@Injectable()
export class V1ReproductiveService {
  private readonly logger = new Logger(V1ReproductiveService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converts Prisma Decimal fields to numbers for clean JSON serialization
   */
  private sanitizeDailyLog(log: any) {
    return {
      ...log,
      basalBodyTemp: log.basalBodyTemp ? Number(log.basalBodyTemp) : null,
      sleepHours: log.sleepHours ? Number(log.sleepHours) : null,
      waterIntake: log.waterIntake ? Number(log.waterIntake) : null,
      exerciseMinutes: log.exerciseMinutes ? Number(log.exerciseMinutes) : null,
    };
  }

  /**
   * ============================================================================
   * DASHBOARD ENDPOINT
   * ============================================================================
   */

  async getDashboard(userId: string): Promise<TieredResponse<DashboardData>> {
    this.logger.log(`Fetching dashboard for user: ${userId}`);

    const profile = await this.prisma.reproductiveProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        isIrregular: true,
        averageCycleLength: true,
        diagnosedConditions: true,
        updatedAt: true,
        lastRegularityAnalysis: true,
        lastRegularityCalculatedAt: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Reproductive profile not found. Please complete onboarding.');
    }

    const [prediction, activePeriod, stats] = await Promise.all([
      this.getLatestPrediction(userId),
      this.getCurrentActivePeriod(userId),
      this.getCycleStatistics(userId),
    ]);

    let currentPhase: CyclePhase = CyclePhase.FOLLICULAR;
    let activePeriodDay: number | null = null;

    if (activePeriod) {
      currentPhase = CyclePhase.MENSTRUAL;
      activePeriodDay = differenceInDays(new Date(), activePeriod.startDate) + 1;
    } else if (prediction) {
      const today = new Date();
      if (this.isDateInFertileWindow(today, prediction)) {
        currentPhase = CyclePhase.OVULATION;
      } else if (prediction.predictedStartDate) {
        const daysUntilPeriod = differenceInDays(prediction.predictedStartDate, today);
        if (daysUntilPeriod <= 7) {
          currentPhase = CyclePhase.LUTEAL;
        }
      }
    }

    const daysUntilPeriod =
      prediction && prediction.predictedStartDate
        ? Math.max(0, differenceInDays(prediction.predictedStartDate, new Date()))
        : 0;

    const daysUntilOvulation =
      prediction && prediction.predictedOvulationDate
        ? Math.max(0, differenceInDays(prediction.predictedOvulationDate, new Date()))
        : 0;

    const isFertileWindow = prediction ? this.isDateInFertileWindow(new Date(), prediction) : false;

    const fertileWindowDates =
      prediction && prediction.fertilityWindowStart && prediction.fertilityWindowEnd
        ? {
            start: prediction.fertilityWindowStart,
            end: prediction.fertilityWindowEnd,
          }
        : null;

    let predictionConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (prediction && prediction.confidenceLevel !== null) {
      if (prediction.confidenceLevel >= 80) predictionConfidence = 'HIGH';
      else if (prediction.confidenceLevel >= 60) predictionConfidence = 'MEDIUM';
    }

    const predictionType: 'TENTATIVE' | 'CONFIRMED' =
      predictionConfidence === 'HIGH' ? 'CONFIRMED' : 'TENTATIVE';

    const healthAlerts = this.generateHealthAlerts(profile, stats, prediction);

    const averageCycleLength = profile.averageCycleLength
      ? typeof profile.averageCycleLength === 'number'
        ? profile.averageCycleLength
        : Number(profile.averageCycleLength)
      : 28;

    const dashboardData: DashboardData = {
      nextPredictedPeriod: prediction?.predictedStartDate || null,
      predictedOvulation: prediction?.predictedOvulationDate || null,
      currentPhase,
      daysUntilPeriod,
      daysUntilOvulation,
      isFertileWindow,
      fertileWindowDates,
      averageCycleLength,
      isCycleRegular: !profile.isIrregular,
      predictionConfidence,
      predictionType,
      hasActivePeriod: !!activePeriod,
      activePeriodDay,
      statistics: stats,
      healthAlerts,
    };

    const insight = this.generateDashboardInsight(dashboardData);

    const clinicalMetrics = {
      profileId: profile.id,
      lastUpdated: profile.updatedAt,
      dataQuality: this.assessDataQuality(profile),
      predictionAccuracy: prediction?.confidenceLevel || 0,
      cyclesAnalyzed: stats.totalCycles,
      regularityAnalysis: profile.lastRegularityAnalysis,
    };

    return {
      insight,
      clinicalMetrics,
      data: dashboardData,
    };
  }

  /**
   * ============================================================================
   * PROFILE MANAGEMENT
   * ============================================================================
   */

  async createReproductiveProfile(
    userId: string,
    dto: CreateReproductiveProfileDto,
  ): Promise<TieredResponse<any>> {
    this.logger.log(`Creating reproductive profile for user: ${userId}`);

    const existingProfile = await this.prisma.reproductiveProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Reproductive profile already exists for this user');
    }

    const diagnosisDate = dto.diagnosisDate ? startOfDay(parseISO(dto.diagnosisDate)) : null;

    const profile = await this.prisma.reproductiveProfile.create({
      data: {
        userId,
        reproductiveGoal: dto.reproductiveGoal,
        averageCycleLength: dto.averageCycleLength,
        shortestCycle: dto.averageCycleLength,
        longestCycle: dto.averageCycleLength,
        averagePeriodDuration: dto.averagePeriodDuration,
        lutealPhaseLength: dto.lutealPhaseLength,
        isIrregular: dto.isIrregular,
        diagnosedConditions: dto.diagnosedConditions || [ReproductiveCondition.NONE],
        diagnosisDate,
        treatingDoctorId: dto.treatingDoctorId,
        isOnBirthControl: dto.isOnBirthControl,
        birthControlType: dto.birthControlType,
        isOnFertilityTreatment: dto.isOnFertilityTreatment,
        smokingStatus: dto.smokingStatus,
        alcoholConsumption: dto.alcoholConsumption,
        stressLevel: dto.stressLevel,
      },
    });

    const insight = this.generateProfileInsight(profile);

    const clinicalMetrics = {
      profileCreated: true,
      dataCompleteness: this.calculateDataCompleteness(dto),
      needsMoreData: !dto.averageCycleLength || !dto.averagePeriodDuration,
      recommendedActions: this.getRecommendedActions(profile),
    };

    return {
      insight,
      clinicalMetrics,
      data: profile,
    };
  }

  async getReproductiveProfile(userId: string): Promise<TieredResponse<any>> {
    this.logger.log(`Fetching reproductive profile for user: ${userId}`);

    const profile = await this.prisma.reproductiveProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Reproductive profile not found');
    }

    const [currentCycle, latestPrediction] = await Promise.all([
      this.getCurrentActivePeriod(userId),
      this.getLatestPrediction(userId),
    ]);

    const insight = this.generateProfileInsight(profile);

    const clinicalMetrics = {
      hasActivePeriod: !!currentCycle,
      lastUpdated: profile.updatedAt,
      regularityLastCalculated: profile.lastRegularityCalculatedAt,
      dataQuality: this.assessDataQuality(profile),
    };

    return {
      insight,
      clinicalMetrics,
      data: {
        ...profile,
        currentCycle,
        latestPrediction,
      },
    };
  }

  async updateReproductiveProfile(
    userId: string,
    dto: UpdateReproductiveProfileDto,
  ): Promise<TieredResponse<any>> {
    this.logger.log(`Updating reproductive profile for user: ${userId}`);

    const profile = await this.prisma.reproductiveProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Reproductive profile not found');
    }

    const updateData: any = { ...dto };
    if (dto.diagnosisDate) {
      updateData.diagnosisDate = startOfDay(parseISO(dto.diagnosisDate));
    }

    const updatedProfile = await this.prisma.reproductiveProfile.update({
      where: { userId },
      data: updateData,
    });

    if (dto.averageCycleLength !== undefined || dto.isIrregular !== undefined) {
      await this.recalculateRegularityAnalysis(userId);
    }

    const insight = this.generateProfileInsight(updatedProfile);

    return {
      insight,
      clinicalMetrics: {
        updated: true,
        fieldsChanged: Object.keys(dto),
      },
      data: updatedProfile,
    };
  }

  /**
   * ============================================================================
   * DAILY HEALTH LOGGING
   * ============================================================================
   */

  async logDailyHealth(userId: string, dto: LogDailyHealthDto): Promise<TieredResponse<any>> {
    this.logger.log(`Logging daily health for user: ${userId}, date: ${dto.logDate}`);

    const logDate = startOfDay(parseISO(dto.logDate));

    if (isFuture(logDate)) {
      throw new BadRequestException('Cannot log health data for future dates');
    }

    const existingLog = await this.prisma.dailyHealthLog.findFirst({
      where: {
        userId,
        logDate,
      },
    });

    if (existingLog) {
      throw new ConflictException(
        `Health log already exists for ${dto.logDate}. Use PATCH to update.`,
      );
    }

    const healthLog = await this.prisma.dailyHealthLog.create({
      data: {
        userId,
        logDate,
        flowType: dto.flowType,
        cervicalMucus: dto.cervicalMucus,
        painLevel: dto.painLevel,
        painLocations: dto.painLocations || [],
        basalBodyTemp: dto.basalBodyTemp,
        basalBodyTempSource: dto.basalBodyTempSource,
        mood: dto.mood,
        energyLevel: dto.energyLevel,
        sleepQuality: dto.sleepQuality,
        sleepHours: dto.sleepHours,
        menopauseSymptoms: dto.menopauseSymptoms || [],
        hadIntercourse: dto.hadIntercourse || false,
        usedProtection: dto.usedProtection || false,
        waterIntake: dto.waterIntake,
        exerciseMinutes: dto.exerciseMinutes,
        exerciseType: dto.exerciseType,
        notes: dto.notes,
      },
    });

    let autoStartedPeriod = false;
    if (dto.flowType && dto.flowType !== FlowType.SPOTTING) {
      const activePeriod = await this.getCurrentActivePeriod(userId);

      if (activePeriod) {
        const daysSinceStart = differenceInDays(logDate, activePeriod.startDate);
        if (daysSinceStart > 14) {
          this.logger.warn(
            `Auto-closing stale period (${daysSinceStart} days old) for user ${userId}`,
          );
          await this.prisma.periodCycle.update({
            where: { id: activePeriod.id },
            data: {
              endDate: subDays(logDate, 1),
              periodDuration: daysSinceStart,
              notes: `Auto-closed: User logged new period without ending previous`,
            },
          });

          const flowIntensity = this.mapFlowTypeToPeriodFlowIntensity(dto.flowType);
          await this.startPeriodCycle(userId, {
            startDate: dto.logDate,
            flowIntensity,
            notes: 'Auto-started from daily log',
          });
          autoStartedPeriod = true;
        }
      } else {
        const flowIntensity = this.mapFlowTypeToPeriodFlowIntensity(dto.flowType);
        await this.startPeriodCycle(userId, {
          startDate: dto.logDate,
          flowIntensity,
          notes: 'Auto-started from daily log',
        });
        autoStartedPeriod = true;
      }
    }

    let bbtAnalysis: BBTAnalysis | null = null;
    if (dto.basalBodyTemp && this.shouldRunBBTAnalysis(existingLog, dto.basalBodyTemp)) {
      try {
        bbtAnalysis = await this.runBBTAnalysis(userId, logDate);

        if (bbtAnalysis?.isBiphasic && bbtAnalysis.estimatedOvulationDate) {
          await this.updateLutealPhaseLearning(userId, bbtAnalysis);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`BBT analysis failed: ${errorMessage}`);
      }
    }

    const sanitizedLog = this.sanitizeDailyLog(healthLog);

    const insight = this.generateDailyLogInsight(sanitizedLog, dto, bbtAnalysis);

    const clinicalMetrics = {
      logged: true,
      autoStartedPeriod,
      dataPoints: this.countDataPoints(dto),
      bbtAnalysisRun: !!bbtAnalysis,
      bbtDetectedOvulation: bbtAnalysis?.isBiphasic || false,
    };

    return {
      insight,
      clinicalMetrics,
      data: {
        ...sanitizedLog,
        bbtAnalysis,
      },
    };
  }

  async getDailyHealthLogs(userId: string, query: DailyLogsQueryDto) {
    this.logger.log(`Fetching daily logs for user: ${userId}`);

    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.logDate = {};
      if (query.startDate) {
        where.logDate.gte = startOfDay(parseISO(query.startDate));
      }
      if (query.endDate) {
        where.logDate.lte = endOfDay(parseISO(query.endDate));
      }
    }

    const page = 1;
    const limit = 30;
    const skip = (page - 1) * limit;

    const [totalItems, logs] = await Promise.all([
      this.prisma.dailyHealthLog.count({ where }),
      this.prisma.dailyHealthLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          logDate: true,
          flowType: true,
          cervicalMucus: true,
          painLevel: true,
          basalBodyTemp: true,
          mood: true,
          energyLevel: true,
          sleepQuality: true,
          createdAt: true,
        },
        orderBy: { logDate: 'desc' },
        take: limit,
        skip: skip,
      }),
    ]);

    const sanitizedLogs = logs.map((log) => this.sanitizeDailyLog(log));

    return {
      data: sanitizedLogs,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        pageSize: logs.length,
      },
    };
  }

  async updateDailyHealthLog(
    userId: string,
    logId: string,
    dto: UpdateDailyHealthDto,
  ): Promise<TieredResponse<any>> {
    this.logger.log(`Updating daily log: ${logId} for user: ${userId}`);

    const existingLog = await this.prisma.dailyHealthLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existingLog) {
      throw new NotFoundException('Daily health log not found');
    }

    const temperatureChanged =
      dto.basalBodyTemp !== undefined &&
      dto.basalBodyTemp !== (existingLog.basalBodyTemp ? Number(existingLog.basalBodyTemp) : null);

    const updatedLog = await this.prisma.dailyHealthLog.update({
      where: { id: logId },
      data: dto,
    });

    let bbtAnalysis: BBTAnalysis | null = null;
    if (temperatureChanged && dto.basalBodyTemp) {
      try {
        bbtAnalysis = await this.runBBTAnalysis(userId, existingLog.logDate);

        if (bbtAnalysis?.isBiphasic && bbtAnalysis.estimatedOvulationDate) {
          await this.updateLutealPhaseLearning(userId, bbtAnalysis);
        }

        this.logger.log(`BBT analysis re-run after temperature update for user ${userId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`BBT analysis failed: ${errorMessage}`);
      }
    }

    const sanitizedLog = this.sanitizeDailyLog(updatedLog);

    const insight = this.generateUpdateLogInsight(sanitizedLog, bbtAnalysis);

    const clinicalMetrics = {
      updated: true,
      fieldsChanged: Object.keys(dto),
      bbtAnalysisRerun: !!bbtAnalysis,
      bbtDetectedOvulation: bbtAnalysis?.isBiphasic || false,
    };

    return {
      insight,
      clinicalMetrics,
      data: {
        ...sanitizedLog,
        bbtAnalysis,
      },
    };
  }

  /**
   * ============================================================================
   * PERIOD CYCLE TRACKING
   * ============================================================================
   */

  async startPeriodCycle(userId: string, dto: StartPeriodCycleDto): Promise<TieredResponse<any>> {
    this.logger.log(`Starting period cycle for user: ${userId}, date: ${dto.startDate}`);

    const startDate = startOfDay(parseISO(dto.startDate));

    if (isFuture(startDate)) {
      throw new BadRequestException('Cannot start period in the future');
    }

    const activePeriod = await this.getCurrentActivePeriod(userId);
    if (activePeriod) {
      throw new ConflictException(
        `Active period already exists (started ${activePeriod.startDate}). End it first.`,
      );
    }

    const { cycle, previousCycle } = await this.prisma.$transaction(async (tx) => {
      const flowMeetsThreshold =
        !dto.flowIntensity || dto.flowIntensity !== PeriodFlowIntensity.SPOTTING;

      const newCycle = await tx.periodCycle.create({
        data: {
          userId,
          startDate,
          flowIntensity: dto.flowIntensity,
          flowMeetsDay1Threshold: flowMeetsThreshold,
          notes: dto.notes,
        },
      });

      const prevCycle = await tx.periodCycle.findFirst({
        where: {
          userId,
          endDate: { not: null },
          startDate: { lt: startDate },
        },
        orderBy: { startDate: 'desc' },
      });

      if (prevCycle) {
        const cycleLength = calculateCycleLength(prevCycle.startDate, startDate);

        if (this.isValidCycleLength(cycleLength)) {
          await tx.periodCycle.update({
            where: { id: prevCycle.id },
            data: { cycleLength },
          });
        } else {
          this.logger.warn(`Ghost cycle detected: ${cycleLength} days. Likely missed period log.`);
        }
      }

      return { cycle: newCycle, previousCycle: prevCycle };
    });

    await this.updateProfileCycleMetrics(userId);

    try {
      await this.upsertCyclePrediction(userId, {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not generate prediction: ${errorMessage}`);
    }

    const insight = this.generateCycleStartInsight(cycle, previousCycle);

    return {
      insight,
      clinicalMetrics: {
        cycleStarted: true,
        previousCycleLength: previousCycle
          ? calculateCycleLength(previousCycle.startDate, startDate)
          : null,
      },
      data: cycle,
    };
  }

  async endPeriodCycle(
    userId: string,
    cycleId: string,
    dto: EndPeriodCycleDto,
  ): Promise<TieredResponse<any>> {
    this.logger.log(`Ending period cycle: ${cycleId} for user: ${userId}`);

    const cycle = await this.prisma.periodCycle.findFirst({
      where: { id: cycleId, userId },
    });

    if (!cycle) {
      throw new NotFoundException('Period cycle not found');
    }

    if (cycle.endDate) {
      throw new ConflictException('Period cycle already ended');
    }

    const endDate = startOfDay(parseISO(dto.endDate));

    if (!isAfter(endDate, cycle.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    const periodDuration = differenceInDays(endDate, cycle.startDate) + 1;

    const updatedCycle = await this.prisma.periodCycle.update({
      where: { id: cycleId },
      data: {
        endDate,
        periodDuration,
        flowIntensity: dto.flowIntensity || cycle.flowIntensity,
        cervicalMucus: dto.cervicalMucus,
        symptomsAndMood: dto.symptomsAndMood || [],
        notes: dto.notes,
      },
    });

    await this.updateProfileCycleMetrics(userId);

    const insight = this.generateCycleEndInsight(updatedCycle);

    return {
      insight,
      clinicalMetrics: {
        cycleEnded: true,
        periodDuration,
      },
      data: updatedCycle,
    };
  }

  async getPeriodCycles(userId: string, query: CycleHistoryQueryDto) {
    this.logger.log(`Fetching period cycles for user: ${userId}`);

    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.startDate = {};
      if (query.startDate) {
        where.startDate.gte = startOfDay(parseISO(query.startDate));
      }
      if (query.endDate) {
        where.startDate.lte = endOfDay(parseISO(query.endDate));
      }
    }

    const page = 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const [totalItems, cycles] = await Promise.all([
      this.prisma.periodCycle.count({ where }),
      this.prisma.periodCycle.findMany({
        where,
        select: {
          id: true,
          userId: true,
          startDate: true,
          endDate: true,
          cycleLength: true,
          periodDuration: true,
          flowIntensity: true,
          ovulationDetected: true,
          ovulationDate: true,
          createdAt: true,
        },
        orderBy: { startDate: 'desc' },
        take: limit,
        skip: skip,
      }),
    ]);

    return {
      data: cycles,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        pageSize: cycles.length,
      },
    };
  }

  async getCurrentActivePeriod(userId: string) {
    return this.prisma.periodCycle.findFirst({
      where: {
        userId,
        endDate: null,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * ============================================================================
   * CYCLE PREDICTION & OVULATION
   * ============================================================================
   */

  async upsertCyclePrediction(
    userId: string,
    dto: GeneratePredictionDto,
  ): Promise<TieredResponse<any>> {
    this.logger.log(`Upserting cycle prediction for user: ${userId}`);

    const profile = await this.prisma.reproductiveProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Reproductive profile not found');
    }

    const cyclesToAnalyze = dto.cyclesToAnalyze || 6;
    const completedCycles = await this.prisma.periodCycle.findMany({
      where: {
        userId,
        endDate: { not: null },
        cycleLength: { not: null },
      },
      select: {
        id: true,
        startDate: true,
        cycleLength: true,
        periodDuration: true,
      },
      orderBy: { startDate: 'desc' },
      take: cyclesToAnalyze,
    });

    if (completedCycles.length < REPRODUCTIVE_CONSTANTS.MIN_CYCLES_FOR_PREDICTION) {
      throw new BadRequestException(
        `Need at least ${REPRODUCTIVE_CONSTANTS.MIN_CYCLES_FOR_PREDICTION} completed cycles for prediction`,
      );
    }

    const lastCycle = completedCycles[0];

    const cycleLengths = completedCycles
      .map((cycle) => cycle.cycleLength)
      .filter((length): length is number => length !== null && this.isValidCycleLength(length));

    if (cycleLengths.length === 0) {
      throw new BadRequestException('No valid cycles available for prediction');
    }

    const avgCycleLength = calculateAverageCycleLength(cycleLengths);

    const predictedStartDate = predictNextPeriodStart(lastCycle.startDate, avgCycleLength);

    const lutealLength = profile.lutealPhaseLength
      ? typeof profile.lutealPhaseLength === 'number'
        ? profile.lutealPhaseLength
        : Number(profile.lutealPhaseLength)
      : REPRODUCTIVE_CONSTANTS.LUTEAL_PHASE_LENGTH;

    const predictedOvulationDate = calculateOvulationDate(predictedStartDate, lutealLength);

    const fertileWindow: FertileWindow = calculateFertileWindow(predictedOvulationDate);

    const regularityAnalysis = analyzeCycleRegularity(cycleLengths);
    const isRegular = regularityAnalysis.isRegular;
    const confidence = regularityAnalysis.predictionConfidence;
    const confidenceLevel = this.mapConfidenceToPercentage(confidence);

    const method = dto.method || PredictionMethod.CALENDAR_MEDIAN;

    const bestDay1 = addDays(predictedOvulationDate, -2);
    const bestDay2 = addDays(predictedOvulationDate, -1);

    const avgPeriodDuration = profile.averagePeriodDuration
      ? typeof profile.averagePeriodDuration === 'number'
        ? profile.averagePeriodDuration
        : Number(profile.averagePeriodDuration)
      : 5;

    const existingPrediction = await this.prisma.cyclePrediction.findFirst({
      where: {
        userId,
        predictedStartDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const predictionData = {
      predictedStartDate,
      predictedOvulationDate,
      predictedEndDate: addDays(predictedStartDate, avgPeriodDuration),
      confidenceLevel,
      predictionMethod: method,
      fertilityWindowStart: fertileWindow.start,
      fertilityWindowEnd: fertileWindow.end,
      fertileWindowData: {
        start: fertileWindow.start,
        end: fertileWindow.end,
        peak: fertileWindow.peak,
        dailyProbabilities: this.generateDailyProbabilities(predictedOvulationDate, fertileWindow),
      },
      bestConceptionDay1: bestDay1,
      bestConceptionDay2: bestDay2,
      daysUntilOvulation: differenceInDays(predictedOvulationDate, new Date()),
    };

    const prediction = existingPrediction
      ? await this.prisma.cyclePrediction.update({
          where: { id: existingPrediction.id },
          data: predictionData,
        })
      : await this.prisma.cyclePrediction.create({
          data: {
            userId,
            ...predictionData,
          },
        });

    const insight = this.generatePredictionInsight(prediction, isRegular, confidence);

    const clinicalMetrics = {
      cyclesAnalyzed: completedCycles.length,
      averageCycleLength: avgCycleLength,
      isRegular,
      confidence,
      confidencePercentage: confidenceLevel,
      method,
      regularityAnalysis,
      updatedExisting: !!existingPrediction,
    };

    return {
      insight,
      clinicalMetrics,
      data: prediction,
    };
  }

  async getCyclePredictions(userId: string) {
    return this.prisma.cyclePrediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  }

  async getFertileWindow(userId: string) {
    const prediction = await this.getLatestPrediction(userId);

    if (!prediction) {
      throw new NotFoundException('No predictions available');
    }

    return {
      start: prediction.fertilityWindowStart,
      end: prediction.fertilityWindowEnd,
      peak: prediction.predictedOvulationDate,
      details: prediction.fertileWindowData,
    };
  }

  async getNextPredictedPeriod(userId: string): Promise<Date> {
    const prediction = await this.getLatestPrediction(userId);

    if (!prediction) {
      throw new NotFoundException('No predictions available');
    }

    return prediction.predictedStartDate;
  }

  /**
   * ============================================================================
   * HELPER METHODS (PRIVATE)
   * ============================================================================
   */

  private async getLatestPrediction(userId: string) {
    return this.prisma.cyclePrediction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getCycleStatistics(userId: string): Promise<CycleStatistics> {
    const [aggregates, lastPeriod] = await Promise.all([
      this.prisma.periodCycle.aggregate({
        where: {
          userId,
          cycleLength: {
            not: null,
            lte: REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH,
          },
        },
        _count: true,
        _avg: {
          cycleLength: true,
          periodDuration: true,
        },
        _min: {
          cycleLength: true,
        },
        _max: {
          cycleLength: true,
        },
      }),
      this.prisma.periodCycle.findFirst({
        where: { userId },
        select: { startDate: true },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const totalCycles = aggregates._count;
    const avgCycleLength = aggregates._avg.cycleLength
      ? Math.round(Number(aggregates._avg.cycleLength))
      : 28;
    const avgPeriodDuration = aggregates._avg.periodDuration
      ? Math.round(Number(aggregates._avg.periodDuration))
      : 5;
    const shortestCycle = aggregates._min.cycleLength || 28;
    const longestCycle = aggregates._max.cycleLength || 28;

    const cycles = await this.prisma.periodCycle.findMany({
      where: {
        userId,
        cycleLength: {
          not: null,
          lte: REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH,
        },
      },
      select: { cycleLength: true },
    });

    const regularCycles = cycles.filter(
      (c) => c.cycleLength && Math.abs(c.cycleLength - 28) <= 7,
    ).length;

    return {
      totalCycles,
      regularCycles,
      irregularCycles: totalCycles - regularCycles,
      averagePeriodDuration: avgPeriodDuration,
      averageCycleLength: avgCycleLength,
      shortestCycle,
      longestCycle,
      lastPeriodDate: lastPeriod?.startDate || null,
    };
  }

  private isDateInFertileWindow(date: Date, prediction: any): boolean {
    if (!prediction || !prediction.fertilityWindowStart || !prediction.fertilityWindowEnd)
      return false;
    return date >= prediction.fertilityWindowStart && date <= prediction.fertilityWindowEnd;
  }

  private generateHealthAlerts(profile: any, stats: CycleStatistics, prediction: any): string[] {
    const alerts: string[] = [];

    if (
      profile.diagnosedConditions.length > 0 &&
      !profile.diagnosedConditions.includes(ReproductiveCondition.NONE)
    ) {
      alerts.push(`alerts.managing_condition`);
    }

    if (profile.isIrregular && stats.totalCycles >= 3) {
      alerts.push('alerts.irregular_cycles');
    }

    const avgLength = profile.averageCycleLength
      ? typeof profile.averageCycleLength === 'number'
        ? profile.averageCycleLength
        : Number(profile.averageCycleLength)
      : 28;

    if (avgLength > 35) {
      alerts.push('alerts.long_cycle');
    }

    if (prediction && prediction.confidenceLevel !== null && prediction.confidenceLevel < 50) {
      alerts.push('alerts.need_more_data');
    }

    return alerts;
  }

  private shouldRunBBTAnalysis(existingLog: any, newTemp: number): boolean {
    if (!existingLog) return true;
    if (!existingLog.basalBodyTemp) return true;
    const tempDiff = Math.abs(Number(existingLog.basalBodyTemp) - newTemp);
    return tempDiff >= 0.1;
  }

  private async runBBTAnalysis(userId: string, currentDate: Date): Promise<BBTAnalysis | null> {
    const thirtyDaysAgo = subDays(currentDate, 30);

    const recentLogs = await this.prisma.dailyHealthLog.findMany({
      where: {
        userId,
        basalBodyTemp: { not: null },
        logDate: { gte: thirtyDaysAgo },
      },
      select: {
        logDate: true,
        basalBodyTemp: true,
      },
      orderBy: { logDate: 'asc' },
    });

    if (recentLogs.length < 10) {
      return null;
    }

    const readings: BBTReading[] = recentLogs.map((log) => ({
      date: log.logDate,
      temperature: Number(log.basalBodyTemp),
    }));

    const currentPeriod = await this.prisma.periodCycle.findFirst({
      where: {
        userId,
        startDate: { lte: currentDate },
      },
      select: { startDate: true },
      orderBy: { startDate: 'desc' },
    });

    if (!currentPeriod) {
      return null;
    }

    const analysis = analyzeBBTPattern(readings, currentPeriod.startDate);

    if (analysis.isBiphasic) {
      await this.prisma.reproductiveProfile.update({
        where: { userId },
        data: {
          lastBBTAnalysis: analysis as any,
          lastBBTAnalysisCalculatedAt: new Date(),
        },
      });
    }

    return analysis;
  }

  private async updateLutealPhaseLearning(userId: string, bbtAnalysis: BBTAnalysis) {
    if (!bbtAnalysis.estimatedOvulationDate) return;

    const nextPeriod = await this.prisma.periodCycle.findFirst({
      where: {
        userId,
        startDate: { gt: bbtAnalysis.estimatedOvulationDate },
      },
      select: { startDate: true },
      orderBy: { startDate: 'asc' },
    });

    if (nextPeriod) {
      const actualLutealLength = differenceInDays(
        nextPeriod.startDate,
        bbtAnalysis.estimatedOvulationDate,
      );

      if (actualLutealLength >= 10 && actualLutealLength <= 17) {
        const profile = await this.prisma.reproductiveProfile.findUnique({
          where: { userId },
          select: { lutealPhaseLength: true },
        });

        const currentLuteal = profile?.lutealPhaseLength
          ? Number(profile.lutealPhaseLength)
          : REPRODUCTIVE_CONSTANTS.LUTEAL_PHASE_LENGTH;

        const newLutealLength = Math.round(currentLuteal * 0.7 + actualLutealLength * 0.3);

        await this.prisma.reproductiveProfile.update({
          where: { userId },
          data: { lutealPhaseLength: newLutealLength },
        });

        this.logger.log(
          `Updated luteal phase for user ${userId}: ${currentLuteal} → ${newLutealLength}`,
        );
      }
    }
  }

  private async updateProfileCycleMetrics(userId: string) {
    const aggregates = await this.prisma.periodCycle.aggregate({
      where: {
        userId,
        cycleLength: {
          not: null,
          lte: REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH,
        },
      },
      _avg: {
        cycleLength: true,
      },
      _min: {
        cycleLength: true,
      },
      _max: {
        cycleLength: true,
      },
    });

    if (!aggregates._avg.cycleLength) return;

    const avgCycleLength = Math.round(Number(aggregates._avg.cycleLength));
    const shortestCycle = aggregates._min.cycleLength || avgCycleLength;
    const longestCycle = aggregates._max.cycleLength || avgCycleLength;

    const cycleLengths = await this.prisma.periodCycle.findMany({
      where: {
        userId,
        cycleLength: {
          not: null,
          lte: REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH,
        },
      },
      select: { cycleLength: true },
      orderBy: { startDate: 'desc' },
      take: 12,
    });

    const lengths = cycleLengths.map((c) => c.cycleLength).filter((l): l is number => l !== null);

    const isRegular = isCycleRegular(lengths);

    await this.prisma.reproductiveProfile.update({
      where: { userId },
      data: {
        averageCycleLength: avgCycleLength,
        shortestCycle,
        longestCycle,
        isIrregular: !isRegular,
      },
    });
  }

  private async recalculateRegularityAnalysis(userId: string) {
    const cycles = await this.prisma.periodCycle.findMany({
      where: {
        userId,
        cycleLength: {
          not: null,
          lte: REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH,
        },
      },
      select: { cycleLength: true },
      orderBy: { startDate: 'desc' },
      take: 12,
    });

    if (cycles.length < 2) return;

    const lengths = cycles
      .map((cycle) => cycle.cycleLength)
      .filter((length): length is number => length !== null);

    if (lengths.length === 0) return;

    const analysis: CycleRegularityAnalysis = analyzeCycleRegularity(lengths);

    await this.prisma.reproductiveProfile.update({
      where: { userId },
      data: {
        lastRegularityAnalysis: analysis as any,
        lastRegularityCalculatedAt: new Date(),
      },
    });
  }

  private isValidCycleLength(length: number): boolean {
    return length > 0 && length <= REPRODUCTIVE_CONSTANTS.MAX_CYCLE_LENGTH;
  }

  private mapFlowTypeToPeriodFlowIntensity(flowType: FlowType): PeriodFlowIntensity {
    switch (flowType) {
      case FlowType.SPOTTING:
        return PeriodFlowIntensity.SPOTTING;
      case FlowType.LIGHT:
        return PeriodFlowIntensity.LIGHT;
      case FlowType.MEDIUM:
        return PeriodFlowIntensity.MEDIUM;
      case FlowType.HEAVY:
      case FlowType.VERY_HEAVY:
        return PeriodFlowIntensity.HEAVY;
      default:
        return PeriodFlowIntensity.MEDIUM;
    }
  }

  /**
   * ============================================================================
   * INSIGHT GENERATION (i18n READY)
   * ============================================================================
   */

  private generateDashboardInsight(dashboard: DashboardData): UserInsight {
    if (dashboard.hasActivePeriod) {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.dashboard.period_active.title',
        descriptionKey: 'insights.dashboard.period_active.description',
        actionKey: 'insights.dashboard.period_active.action',
        color: 'GREEN',
        interpolation: { day: dashboard.activePeriodDay },
      };
    }

    if (dashboard.isFertileWindow) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.dashboard.fertile_window.title',
        descriptionKey: 'insights.dashboard.fertile_window.description',
        actionKey: 'insights.dashboard.fertile_window.action',
        color: 'YELLOW',
      };
    }

    if (dashboard.daysUntilPeriod > 0 && dashboard.daysUntilPeriod <= 7) {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.dashboard.period_soon.title',
        descriptionKey: 'insights.dashboard.period_soon.description',
        actionKey: 'insights.dashboard.period_soon.action',
        color: 'GREEN',
        interpolation: { days: dashboard.daysUntilPeriod },
      };
    }

    if (dashboard.healthAlerts.length > 0) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.dashboard.health_alerts.title',
        descriptionKey: dashboard.healthAlerts[0],
        actionKey: 'insights.dashboard.health_alerts.action',
        color: 'YELLOW',
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.dashboard.all_good.title',
      descriptionKey: 'insights.dashboard.all_good.description',
      actionKey: 'insights.dashboard.all_good.action',
      color: 'GREEN',
      interpolation: { days: dashboard.daysUntilPeriod },
    };
  }

  private generateProfileInsight(profile: any): UserInsight {
    const hasDiagnosedCondition =
      profile.diagnosedConditions.length > 0 &&
      !profile.diagnosedConditions.includes(ReproductiveCondition.NONE);

    if (hasDiagnosedCondition) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.profile.managing_condition.title',
        descriptionKey: 'insights.profile.managing_condition.description',
        actionKey: 'insights.profile.managing_condition.action',
        color: 'YELLOW',
        interpolation: { conditions: profile.diagnosedConditions.join(', ') },
      };
    }

    if (profile.isIrregular) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.profile.irregular.title',
        descriptionKey: 'insights.profile.irregular.description',
        actionKey: 'insights.profile.irregular.action',
        color: 'YELLOW',
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.profile.complete.title',
      descriptionKey: 'insights.profile.complete.description',
      actionKey: 'insights.profile.complete.action',
      color: 'GREEN',
    };
  }

  private generateDailyLogInsight(
    _healthLog: any,
    dto: LogDailyHealthDto,
    bbtAnalysis: BBTAnalysis | null,
  ): UserInsight {
    if (dto.basalBodyTemp && (dto.basalBodyTemp > 38 || dto.basalBodyTemp < 35)) {
      return {
        status: 'CONSULT_DOCTOR',
        titleKey: 'insights.daily_log.abnormal_temperature.title',
        descriptionKey: 'insights.daily_log.abnormal_temperature.description',
        actionKey: 'insights.daily_log.abnormal_temperature.action',
        color: 'RED',
        interpolation: {
          temperature: dto.basalBodyTemp,
        },
      };
    }

    if (dto.painLevel && (dto.painLevel === 'UNBEARABLE' || dto.painLevel === 'SEVERE')) {
      return {
        status: 'CONSULT_DOCTOR',
        titleKey: 'insights.daily_log.severe_pain.title',
        descriptionKey: 'insights.daily_log.severe_pain.description',
        actionKey: 'insights.daily_log.severe_pain.action',
        color: 'RED',
        interpolation: {
          painLevel: dto.painLevel,
        },
      };
    }

    if (dto.painLevel && dto.painLevel === 'MODERATE') {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.daily_log.moderate_pain.title',
        descriptionKey: 'insights.daily_log.moderate_pain.description',
        actionKey: 'insights.daily_log.moderate_pain.action',
        color: 'YELLOW',
      };
    }

    if (bbtAnalysis?.isBiphasic && bbtAnalysis.pattern === 'BIPHASIC') {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.daily_log.ovulation_detected.title',
        descriptionKey: 'insights.daily_log.ovulation_detected.description',
        actionKey: 'insights.daily_log.ovulation_detected.action',
        color: 'GREEN',
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.daily_log.saved.title',
      descriptionKey: 'insights.daily_log.saved.description',
      actionKey: 'insights.daily_log.saved.action',
      color: 'GREEN',
    };
  }

  private generateUpdateLogInsight(
    dto: UpdateDailyHealthDto,
    bbtAnalysis: BBTAnalysis | null,
  ): UserInsight {
    if (dto.basalBodyTemp && (dto.basalBodyTemp > 38 || dto.basalBodyTemp < 35)) {
      return {
        status: 'CONSULT_DOCTOR',
        titleKey: 'insights.daily_log.abnormal_temperature.title',
        descriptionKey: 'insights.daily_log.abnormal_temperature.description',
        actionKey: 'insights.daily_log.abnormal_temperature.action',
        color: 'RED',
        interpolation: {
          temperature: dto.basalBodyTemp,
        },
      };
    }

    if (dto.painLevel && (dto.painLevel === 'UNBEARABLE' || dto.painLevel === 'SEVERE')) {
      return {
        status: 'CONSULT_DOCTOR',
        titleKey: 'insights.daily_log.severe_pain.title',
        descriptionKey: 'insights.daily_log.severe_pain.description',
        actionKey: 'insights.daily_log.severe_pain.action',
        color: 'RED',
        interpolation: {
          painLevel: dto.painLevel,
        },
      };
    }

    if (dto.painLevel && dto.painLevel === 'MODERATE') {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.daily_log.moderate_pain.title',
        descriptionKey: 'insights.daily_log.moderate_pain.description',
        actionKey: 'insights.daily_log.moderate_pain.action',
        color: 'YELLOW',
      };
    }

    if (bbtAnalysis?.isBiphasic && bbtAnalysis.pattern === 'BIPHASIC') {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.daily_log.ovulation_detected.title',
        descriptionKey: 'insights.daily_log.ovulation_detected.description',
        actionKey: 'insights.daily_log.ovulation_detected.action',
        color: 'GREEN',
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.daily_log.updated.title',
      descriptionKey: 'insights.daily_log.updated.description',
      actionKey: 'insights.daily_log.updated.action',
      color: 'GREEN',
    };
  }

  private generateCycleStartInsight(cycle: any, previousCycle: any): UserInsight {
    if (!previousCycle) {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.cycle.first_started.title',
        descriptionKey: 'insights.cycle.first_started.description',
        actionKey: 'insights.cycle.first_started.action',
        color: 'GREEN',
      };
    }

    const cycleLength = calculateCycleLength(previousCycle.startDate, cycle.startDate);

    if (cycleLength < 21 || cycleLength > 35) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.cycle.unusual_length.title',
        descriptionKey: 'insights.cycle.unusual_length.description',
        actionKey: 'insights.cycle.unusual_length.action',
        color: 'YELLOW',
        interpolation: { length: cycleLength },
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.cycle.started.title',
      descriptionKey: 'insights.cycle.started.description',
      actionKey: 'insights.cycle.started.action',
      color: 'GREEN',
      interpolation: { length: cycleLength },
    };
  }

  private generateCycleEndInsight(cycle: any): UserInsight {
    const duration = cycle.periodDuration;

    if (duration > 7) {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.cycle.long_duration.title',
        descriptionKey: 'insights.cycle.long_duration.description',
        actionKey: 'insights.cycle.long_duration.action',
        color: 'YELLOW',
        interpolation: { duration },
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.cycle.ended.title',
      descriptionKey: 'insights.cycle.ended.description',
      actionKey: 'insights.cycle.ended.action',
      color: 'GREEN',
      interpolation: { duration },
    };
  }

  private generatePredictionInsight(
    prediction: any,
    isRegular: boolean,
    confidence: string,
  ): UserInsight {
    const daysUntil = differenceInDays(prediction.predictedStartDate, new Date());

    if (confidence === 'LOW') {
      return {
        status: 'ATTENTION',
        titleKey: 'insights.prediction.low_confidence.title',
        descriptionKey: 'insights.prediction.low_confidence.description',
        actionKey: 'insights.prediction.low_confidence.action',
        color: 'YELLOW',
        interpolation: { days: daysUntil },
      };
    }

    if (!isRegular) {
      return {
        status: 'HEALTHY',
        titleKey: 'insights.prediction.irregular.title',
        descriptionKey: 'insights.prediction.irregular.description',
        actionKey: 'insights.prediction.irregular.action',
        color: 'GREEN',
        interpolation: { days: daysUntil },
      };
    }

    return {
      status: 'HEALTHY',
      titleKey: 'insights.prediction.high_confidence.title',
      descriptionKey: 'insights.prediction.high_confidence.description',
      actionKey: 'insights.prediction.high_confidence.action',
      color: 'GREEN',
      interpolation: { days: daysUntil },
    };
  }

  /**
   * ============================================================================
   * UTILITY METHODS
   * ============================================================================
   */

  private calculateDataCompleteness(dto: CreateReproductiveProfileDto): number {
    const fields = [
      dto.averageCycleLength,
      dto.averagePeriodDuration,
      dto.diagnosedConditions,
      dto.smokingStatus,
      dto.alcoholConsumption,
      dto.stressLevel,
    ];
    const filledFields = fields.filter((f) => f !== undefined).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  private getRecommendedActions(profile: any): string[] {
    const actions: string[] = [];

    if (!profile.averageCycleLength) {
      actions.push('Start tracking period cycles');
    }

    if (!profile.averagePeriodDuration) {
      actions.push('Track period duration');
    }

    actions.push('Log daily health data');

    return actions;
  }

  private assessDataQuality(profile: any): string {
    if (!profile.averageCycleLength) return 'INCOMPLETE';
    if (!profile.lastRegularityCalculatedAt) return 'NEEDS_ANALYSIS';
    return 'GOOD';
  }

  private countDataPoints(dto: LogDailyHealthDto): number {
    const fields = [
      dto.flowType,
      dto.cervicalMucus,
      dto.painLevel,
      dto.basalBodyTemp,
      dto.mood,
      dto.energyLevel,
      dto.sleepQuality,
      dto.waterIntake,
      dto.exerciseMinutes,
    ];
    return fields.filter((f) => f !== undefined).length;
  }

  private mapConfidenceToPercentage(confidence: string): number {
    switch (confidence) {
      case 'HIGH':
        return 85;
      case 'MEDIUM':
        return 70;
      case 'LOW':
        return 50;
      default:
        return 50;
    }
  }

  private generateDailyProbabilities(ovulationDate: Date, fertileWindow: FertileWindow): any[] {
    const probabilities = [];
    let currentDate = fertileWindow.start;

    while (currentDate <= fertileWindow.end) {
      const daysFromPeak = Math.abs(differenceInDays(currentDate, ovulationDate));
      let probability = 0;
      let label = 'Low';

      if (daysFromPeak === 0) {
        probability = 0.33;
        label = 'Peak';
      } else if (daysFromPeak === 1) {
        probability = 0.3;
        label = 'High';
      } else if (daysFromPeak === 2) {
        probability = 0.2;
        label = 'High';
      } else {
        probability = 0.1;
        label = 'Medium';
      }

      probabilities.push({
        date: currentDate.toISOString().split('T')[0],
        probability,
        label,
      });

      currentDate = addDays(currentDate, 1);
    }

    return probabilities;
  }
}
