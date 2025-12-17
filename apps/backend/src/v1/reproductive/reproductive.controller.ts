/**
 * ============================================================================
 * REPRODUCTIVE HEALTH CONTROLLER
 * ============================================================================
 *
 * RESTful API endpoints for reproductive health tracking, cycle prediction,
 * and fertility management.
 *
 * Base Path: /v1/reproductive
 *
 * ARCHITECTURE:
 * - Controller: HTTP routing and request/response handling
 * - Service: Business logic and data transformation
 * - Entities: Response serialization and API documentation
 *
 * AUTHENTICATION:
 * All endpoints require JWT authentication via @UseGuards(AccessTokenGuard)
 * User ID is extracted from JWT token via @GetCurrentUserId() decorator
 *
 * RESPONSE FORMAT:
 * All responses follow the global ResponseInterceptor pattern:
 * {
 *   statusCode: 200 | 201,
 *   message: "Success message",
 *   data: { insight, clinicalMetrics, data },
 *   timestamp: "ISO 8601 string"
 * }
 *
 * @module V1ReproductiveModule
 * @category Controller
 * @since 1.0.0
 * @author Mimicare Development Team
 * @lastUpdated 2025-12-16
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { V1ReproductiveService } from './reproductive.service';
import { AccessTokenGuard } from '../../common/guards/auth';
import { GetCurrentUserId } from '../../common/decorators/user';

import { type CreateReproductiveProfileDto } from './dto/create-reproductive-profile.dto';
import { type UpdateReproductiveProfileDto } from './dto/update-reproductive-profile.dto';
import { type LogDailyHealthDto } from './dto/log-daily-health.dto';
import { type UpdateDailyHealthDto } from './dto/update-daily-health.dto';
import { type StartPeriodCycleDto } from './dto/start-period-cycle.dto';
import { type EndPeriodCycleDto } from './dto/end-period-cycle.dto';
import { type GeneratePredictionDto } from './dto/generate-prediction.dto';
import { type CycleHistoryQueryDto, type DailyLogsQueryDto } from './dto/query-filters.dto';

import { ReproductiveProfileEntity } from './entities/reproductive-profile.entity';
import { PeriodCycleEntity } from './entities/period-cycle.entity';
import { DailyHealthLogEntity } from './entities/daily-health-log.entity';
import { CyclePredictionEntity } from './entities/cycle-prediction.entity';
import { ReproductiveDashboardEntity } from './entities/reproductive-dashboard.entity';

/**
 * Reproductive Health Controller
 *
 * Comprehensive API for menstrual cycle tracking, ovulation prediction,
 * and fertility awareness. Supports FEMALE users with full reproductive
 * health suite including period logging, BBT analysis, and cycle predictions.
 *
 * Gender Support:
 * - FEMALE users: Full reproductive health suite (periods, fertility, pregnancy, menopause)
 * - MALE users: Partner support and shared pregnancy tracking
 * - OTHER users: Inclusive health tracking with customizable features
 *
 * @class V1ReproductiveController
 * @version 1.0
 * @tags Reproductive Health
 */
@ApiTags('Reproductive Health')
@ApiBearerAuth()
@Controller({ path: 'reproductive', version: '1' })
@UseGuards(AccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class V1ReproductiveController {
  private readonly logger = new Logger(V1ReproductiveController.name);

  constructor(private readonly reproductiveService: V1ReproductiveService) {}

  /**
   * ============================================================================
   * DASHBOARD ENDPOINT
   * ============================================================================
   */

  /**
   * Get Reproductive Dashboard
   *
   * Retrieves complete dashboard data for the home screen including:
   * - Next period prediction with confidence level
   * - Current cycle phase (Menstrual, Follicular, Ovulation, Luteal)
   * - Fertile window status and dates
   * - Cycle statistics (average length, regularity)
   * - Health alerts and recommendations
   *
   * This is the primary endpoint called on app launch. Returns both
   * user-friendly insights and clinical metrics for doctor dashboard.
   *
   * Prediction Types:
   * - TENTATIVE: Based on calendar averages (low-medium confidence)
   * - CONFIRMED: Backed by BBT/symptoms (high confidence)
   *
   * @route GET /v1/reproductive/dashboard
   * @auth Bearer Token (JWT)
   * @returns Complete dashboard with predictions and statistics
   *
   * @example
   * GET /v1/reproductive/dashboard
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * Response 200:
   * {
   *   "statusCode": 200,
   *   "message": "Dashboard retrieved successfully",
   *   "data": {
   *     "insight": {
   *       "status": "HEALTHY",
   *       "titleKey": "insights.dashboard.period_soon.title",
   *       "descriptionKey": "insights.dashboard.period_soon.description",
   *       "actionKey": "insights.dashboard.period_soon.action",
   *       "color": "GREEN",
   *       "interpolation": { "days": 8 }
   *     },
   *     "clinicalMetrics": {
   *       "profileId": "abc123",
   *       "dataQuality": "GOOD",
   *       "predictionAccuracy": 85,
   *       "cyclesAnalyzed": 12
   *     },
   *     "data": {
   *       "nextPredictedPeriod": "2025-12-24",
   *       "currentPhase": "LUTEAL",
   *       "daysUntilPeriod": 8,
   *       "isFertileWindow": false,
   *       "predictionConfidence": "HIGH",
   *       "predictionType": "CONFIRMED",
   *       "hasActivePeriod": false,
   *       "statistics": {
   *         "totalCycles": 12,
   *         "averageCycleLength": 28,
   *         "regularCycles": 10
   *       }
   *     }
   *   }
   * }
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get reproductive dashboard',
    description:
      'Retrieves complete dashboard data for home screen including next period prediction, ' +
      'current cycle phase, fertile window status, cycle statistics, and health alerts. ' +
      'Returns both user-friendly insights (i18n keys) and clinical metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: ReproductiveDashboardEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Reproductive profile not found - User needs to complete onboarding',
  })
  async getDashboard(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Dashboard request from user: ${userId}`);

    const result = await this.reproductiveService.getDashboard(userId);

    return {
      message: 'Dashboard retrieved successfully',
      data: result,
    };
  }

  /**
   * ============================================================================
   * PROFILE MANAGEMENT
   * ============================================================================
   */

  /**
   * Create Reproductive Profile
   *
   * Creates initial reproductive health profile during onboarding.
   * This is the first step before users can start tracking cycles.
   *
   * Required Fields:
   * - reproductiveGoal: User's tracking objective (TRACKING_ONLY, CONCEIVE, AVOID_PREGNANCY)
   * - averageCycleLength: If known from past experience
   * - averagePeriodDuration: Typical period length in days
   *
   * Optional Fields:
   * - diagnosedConditions: PCOS, Endometriosis, etc.
   * - isOnBirthControl: Affects prediction algorithms
   * - lutealPhaseLength: For advanced users
   *
   * Auto-Detects:
   * - Cycle regularity (if sufficient historical data provided)
   * - Data completeness score
   *
   * @route POST /v1/reproductive/profile
   * @auth Bearer Token (JWT)
   * @body {CreateReproductiveProfileDto} Profile data
   * @returns Created profile with recommendations
   *
   * @example
   * POST /v1/reproductive/profile
   * Content-Type: application/json
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * Body:
   * {
   *   "reproductiveGoal": "TRACKING_ONLY",
   *   "averageCycleLength": 28,
   *   "averagePeriodDuration": 5,
   *   "isIrregular": false,
   *   "diagnosedConditions": ["NONE"],
   *   "isOnBirthControl": false
   * }
   */
  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create reproductive profile',
    description:
      'Creates initial reproductive health profile during onboarding. ' +
      'Collects cycle characteristics, medical history, and lifestyle factors. ' +
      'Auto-detects cycle regularity if sufficient data provided.',
  })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: ReproductiveProfileEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid field format or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Profile already exists for this user',
  })
  async createProfile(
    @GetCurrentUserId() userId: string,
    @Body() dto: CreateReproductiveProfileDto,
  ): Promise<any> {
    this.logger.log(`Creating profile for user: ${userId}`);

    const result = await this.reproductiveService.createReproductiveProfile(userId, dto);

    return {
      message: 'Reproductive profile created successfully',
      data: result,
    };
  }

  /**
   * Get Reproductive Profile
   *
   * Retrieves user's complete reproductive profile including:
   * - Cycle characteristics (average length, regularity)
   * - Medical history (diagnosed conditions, medications)
   * - Current cycle status (active period, day count)
   * - Latest prediction
   * - Cached analysis results (BBT, regularity)
   *
   * @route GET /v1/reproductive/profile
   * @auth Bearer Token (JWT)
   * @returns Complete profile with current status
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get reproductive profile',
    description:
      'Retrieves complete reproductive profile including cycle characteristics, ' +
      'medical history, current cycle status, and latest prediction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ReproductiveProfileEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getProfile(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Fetching profile for user: ${userId}`);

    const result = await this.reproductiveService.getReproductiveProfile(userId);

    return {
      message: 'Profile retrieved successfully',
      data: result,
    };
  }

  /**
   * Update Reproductive Profile
   *
   * Flexible partial update - send only fields you want to change.
   * Automatically recalculates regularity analysis if cycle metrics changed.
   *
   * Updatable Fields:
   * - Cycle metrics: averageCycleLength, averagePeriodDuration, lutealPhaseLength
   * - Medical: diagnosedConditions, diagnosisDate, treatingDoctorId
   * - Lifestyle: smokingStatus, alcoholConsumption, stressLevel
   * - Medications: isOnBirthControl, birthControlType, isOnFertilityTreatment
   *
   * Triggers Re-Analysis:
   * - Updating averageCycleLength or isIrregular triggers regularity recalculation
   *
   * @route PATCH /v1/reproductive/profile
   * @auth Bearer Token (JWT)
   * @body {UpdateReproductiveProfileDto} Fields to update
   * @returns Updated profile
   */
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update reproductive profile',
    description:
      'Update profile fields. Partial update - send only fields to change. ' +
      'Recalculates regularity analysis if cycle metrics updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ReproductiveProfileEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid field format or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async updateProfile(
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateReproductiveProfileDto,
  ): Promise<any> {
    this.logger.log(`Updating profile for user: ${userId}`);

    const result = await this.reproductiveService.updateReproductiveProfile(userId, dto);

    return {
      message: 'Profile updated successfully',
      data: result,
    };
  }

  /**
   * ============================================================================
   * DAILY HEALTH LOGGING
   * ============================================================================
   */

  /**
   * Log Daily Health Data
   *
   * Creates comprehensive daily health entry for specific date.
   *
   * Loggable Data (All Optional):
   * - Menstrual: flowType, cervicalMucus
   * - Pain: painLevel, painLocations[]
   * - BBT: basalBodyTemp, basalBodyTempSource
   * - Mood: mood, energyLevel
   * - Sleep: sleepQuality, sleepHours
   * - Activity: waterIntake, exerciseMinutes, exerciseType
   * - Fertility: hadIntercourse, usedProtection
   * - Menopause: menopauseSymptoms[]
   *
   * Automatic Behaviors:
   * - Auto-starts period if flow >= LIGHT and no active period
   * - Auto-closes stale periods (>14 days) before starting new one
   * - Runs BBT pattern analysis if temperature logged (detects ovulation)
   * - Validates date is not in future
   *
   * BBT Analysis:
   * - Requires 10+ temperature readings for analysis
   * - Detects biphasic pattern (ovulation confirmation)
   * - Updates profile with luteal phase learning
   *
   * @route POST /v1/reproductive/daily-logs
   * @auth Bearer Token (JWT)
   * @body {LogDailyHealthDto} Daily health data
   * @returns Created log with BBT analysis (if applicable)
   *
   * @example
   * POST /v1/reproductive/daily-logs
   * Content-Type: application/json
   *
   * Body:
   * {
   *   "logDate": "2025-12-16",
   *   "flowType": "MEDIUM",
   *   "painLevel": "MILD",
   *   "painLocations": ["lower_abdomen"],
   *   "basalBodyTemp": 36.5,
   *   "mood": "HAPPY",
   *   "energyLevel": 7,
   *   "sleepQuality": 8,
   *   "waterIntake": 8
   * }
   */
  @Post('daily-logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log daily health data',
    description:
      'Creates daily health log for specific date. Auto-starts period if flow detected. ' +
      'Runs BBT pattern analysis if temperature logged. Validates date is not in future.',
  })
  @ApiResponse({
    status: 201,
    description: 'Daily log created successfully',
    type: DailyHealthLogEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or future date',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Log already exists for this date. Use PATCH to update.',
  })
  async logDailyHealth(
    @GetCurrentUserId() userId: string,
    @Body() dto: LogDailyHealthDto,
  ): Promise<any> {
    this.logger.log(`Logging daily health for user: ${userId}, date: ${dto.logDate}`);

    const result = await this.reproductiveService.logDailyHealth(userId, dto);

    return {
      message: 'Daily health logged successfully',
      data: result,
    };
  }

  /**
   * Get Daily Health Logs
   *
   * Retrieves daily logs within date range with pagination.
   *
   * Query Parameters:
   * - startDate: Filter logs from this date (ISO 8601, optional)
   * - endDate: Filter logs until this date (ISO 8601, optional)
   *
   * Pagination:
   * - 30 logs per page (default)
   * - Sorted by logDate descending (newest first)
   *
   * Performance:
   * - Uses selective field fetching (not full objects)
   * - Optimized for mobile bandwidth
   *
   * @route GET /v1/reproductive/daily-logs
   * @auth Bearer Token (JWT)
   * @query {DailyLogsQueryDto} Date range filters
   * @returns Paginated array of daily logs
   */
  @Get('daily-logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get daily health logs',
    description:
      'Retrieves daily logs within date range with pagination (30 per page). ' +
      'Returns newest logs first. Uses selective fetching for performance.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-11-01',
    description: 'Filter logs from this date (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-12-16',
    description: 'Filter logs until this date (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily logs retrieved successfully',
    type: [DailyHealthLogEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getDailyLogs(
    @GetCurrentUserId() userId: string,
    @Query() query: DailyLogsQueryDto,
  ): Promise<any> {
    this.logger.log(`Fetching daily logs for user: ${userId}`);

    const result = await this.reproductiveService.getDailyHealthLogs(userId, query);

    return {
      message: 'Daily logs retrieved successfully',
      ...result,
    };
  }

  /**
   * Update Daily Health Log
   *
   * Updates existing daily log. Log date cannot be changed.
   * All fields are optional - send only fields to update.
   *
   * @route PATCH /v1/reproductive/daily-logs/:logId
   * @auth Bearer Token (JWT)
   * @param {string} logId - Daily health log ID
   * @body {UpdateDailyHealthDto} Fields to update
   * @returns Updated log
   */
  @Patch('daily-logs/:logId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update daily health log',
    description:
      'Updates existing daily log. Log date cannot be changed. ' +
      'Partial update - send only fields to change.',
  })
  @ApiParam({
    name: 'logId',
    description: 'Daily health log ID',
    type: String,
    example: 'cm4log123xyz456def',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily log updated successfully',
    type: DailyHealthLogEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid field format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Daily log not found',
  })
  async updateDailyLog(
    @GetCurrentUserId() userId: string,
    @Param('logId') logId: string,
    @Body() dto: UpdateDailyHealthDto,
  ): Promise<any> {
    this.logger.log(`Updating daily log: ${logId} for user: ${userId}`);

    const result = await this.reproductiveService.updateDailyHealthLog(userId, logId, dto);

    return {
      message: 'Daily log updated successfully',
      data: result,
    };
  }

  /**
   * ============================================================================
   * PERIOD CYCLE TRACKING
   * ============================================================================
   */

  /**
   * Start Period Cycle
   *
   * Marks Cycle Day 1 (first day of period).
   *
   * Business Rules:
   * - Validates no overlapping active period exists
   * - Calculates cycle length if previous cycle exists
   * - Filters out "ghost cycles" (>50 days, likely missed logs)
   * - Updates profile cycle metrics (average, shortest, longest)
   * - Auto-generates/updates prediction
   *
   * Transaction Safety:
   * - All steps wrapped in database transaction
   * - Ensures data consistency across related entities
   *
   * @route POST /v1/reproductive/cycles/start
   * @auth Bearer Token (JWT)
   * @body {StartPeriodCycleDto} Period start data
   * @returns Created cycle with insights
   *
   * @example
   * POST /v1/reproductive/cycles/start
   * Content-Type: application/json
   *
   * Body:
   * {
   *   "startDate": "2025-12-16",
   *   "flowIntensity": "MEDIUM",
   *   "notes": "Mild cramps"
   * }
   */
  @Post('cycles/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start period cycle',
    description:
      'Marks Cycle Day 1 (period start). Validates no overlapping period. ' +
      'Calculates cycle length from previous period. Updates profile metrics. ' +
      'Transaction-safe multi-step operation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Period cycle started successfully',
    type: PeriodCycleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid date or future date',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Active period already exists. End it first.',
  })
  async startCycle(
    @GetCurrentUserId() userId: string,
    @Body() dto: StartPeriodCycleDto,
  ): Promise<any> {
    this.logger.log(`Starting cycle for user: ${userId}, date: ${dto.startDate}`);

    const result = await this.reproductiveService.startPeriodCycle(userId, dto);

    return {
      message: 'Period cycle started successfully',
      data: result,
    };
  }

  /**
   * End Period Cycle
   *
   * Marks last day of bleeding.
   *
   * Features:
   * - Calculates period duration (days between start and end)
   * - Updates cycle with summary data (symptoms, flow intensity)
   * - Recalculates profile metrics
   * - Validates end date is after start date
   *
   * @route PATCH /v1/reproductive/cycles/:cycleId/end
   * @auth Bearer Token (JWT)
   * @param {string} cycleId - Period cycle ID
   * @body {EndPeriodCycleDto} Period end data
   * @returns Updated cycle with duration
   */
  @Patch('cycles/:cycleId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End period cycle',
    description:
      'Marks last day of bleeding. Calculates period duration. ' +
      'Updates cycle with summary data. Validates end date is after start.',
  })
  @ApiParam({
    name: 'cycleId',
    description: 'Period cycle ID',
    type: String,
    example: 'cm4cycle123xyz456',
  })
  @ApiResponse({
    status: 200,
    description: 'Period cycle ended successfully',
    type: PeriodCycleEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - End date must be after start date',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Cycle not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cycle already ended',
  })
  async endCycle(
    @GetCurrentUserId() userId: string,
    @Param('cycleId') cycleId: string,
    @Body() dto: EndPeriodCycleDto,
  ): Promise<any> {
    this.logger.log(`Ending cycle: ${cycleId} for user: ${userId}`);

    const result = await this.reproductiveService.endPeriodCycle(userId, cycleId, dto);

    return {
      message: 'Period cycle ended successfully',
      data: result,
    };
  }

  /**
   * Get Period Cycles
   *
   * Retrieves cycle history with optional filters and pagination.
   *
   * Query Parameters:
   * - startDate: Filter cycles from this date (optional)
   * - endDate: Filter cycles until this date (optional)
   * - limit: Number of cycles per page (default: 12)
   *
   * Returns cycles ordered by start date (newest first).
   * Uses selective field fetching for performance.
   *
   * @route GET /v1/reproductive/cycles
   * @auth Bearer Token (JWT)
   * @query {CycleHistoryQueryDto} Date range filters
   * @returns Paginated array of cycles
   */
  @Get('cycles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get period cycles',
    description:
      'Retrieves cycle history with optional date filters and pagination (12 per page). ' +
      'Returns newest cycles first. Uses selective fetching for performance.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2025-01-01',
    description: 'Filter cycles from this date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2025-12-16',
    description: 'Filter cycles until this date',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 12,
    description: 'Number of cycles per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Cycles retrieved successfully',
    type: [PeriodCycleEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getCycles(
    @GetCurrentUserId() userId: string,
    @Query() query: CycleHistoryQueryDto,
  ): Promise<any> {
    this.logger.log(`Fetching cycles for user: ${userId}`);

    const result = await this.reproductiveService.getPeriodCycles(userId, query);

    return {
      message: 'Cycles retrieved successfully',
      ...result,
    };
  }

  /**
   * Get Current Active Period
   *
   * Retrieves currently active period (no end date).
   * Returns null if no active period exists.
   *
   * Used by frontend to:
   * - Show "Day X of Period" indicator
   * - Disable "Start Period" button if active
   * - Prompt user to end period
   *
   * @route GET /v1/reproductive/cycles/active
   * @auth Bearer Token (JWT)
   * @returns Active period or null
   */
  @Get('cycles/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current active period',
    description:
      'Retrieves currently active period (no end date). ' +
      'Returns null if no active period exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active period retrieved (or null)',
    type: PeriodCycleEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getActivePeriod(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Fetching active period for user: ${userId}`);

    const result = await this.reproductiveService.getCurrentActivePeriod(userId);

    return {
      message: result ? 'Active period found' : 'No active period',
      data: result,
    };
  }

  /**
   * ============================================================================
   * CYCLE PREDICTION & OVULATION
   * ============================================================================
   */

  /**
   * Generate/Update Cycle Prediction
   *
   * Creates or updates prediction for next menstrual cycle using advanced algorithms.
   *
   * Prediction Methods:
   * - CALENDAR_MEDIAN: Uses median of last 6 cycles (most accurate for regular cycles)
   * - BBT_ANALYSIS: Incorporates basal body temperature shifts (confirms ovulation)
   * - MULTI_MODAL: Combines calendar + BBT + cervical mucus (highest accuracy)
   *
   * Requirements:
   * - Minimum 3 completed cycles for prediction
   * - Filters out invalid cycles (>50 days "ghost cycles")
   *
   * Algorithm Features:
   * - Upsert strategy: Updates existing future prediction instead of creating duplicates
   * - Luteal phase learning: Adjusts based on BBT-confirmed ovulation
   * - Confidence scoring: HIGH (85%+), MEDIUM (70-85%), LOW (<70%)
   * - Prediction types: TENTATIVE (calendar-based) vs CONFIRMED (symptom-backed)
   *
   * Returns:
   * - Predicted period start/end dates
   * - Ovulation date
   * - Fertile window (O-5 to O+1)
   * - Daily conception probabilities
   * - Best conception days (O-2, O-1)
   *
   * @route POST /v1/reproductive/predictions
   * @auth Bearer Token (JWT)
   * @body {GeneratePredictionDto} Prediction parameters
   * @returns Generated prediction with confidence metrics
   *
   * @example
   * POST /v1/reproductive/predictions
   * Content-Type: application/json
   *
   * Body:
   * {
   *   "method": "CALENDAR_MEDIAN",
   *   "cyclesToAnalyze": 6
   * }
   */
  @Post('predictions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate/update cycle prediction',
    description:
      'Creates or updates prediction for next cycle. Uses calendar median, BBT, or multi-modal. ' +
      'Requires 3+ completed cycles. Upsert strategy prevents duplicates. ' +
      'Returns predicted dates, fertile window, and confidence scoring.',
  })
  @ApiResponse({
    status: 201,
    description: 'Prediction generated successfully',
    type: CyclePredictionEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Insufficient cycles (need at least 3)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Reproductive profile not found',
  })
  async generatePrediction(
    @GetCurrentUserId() userId: string,
    @Body() dto: GeneratePredictionDto,
  ): Promise<any> {
    this.logger.log(`Generating prediction for user: ${userId}`);

    const result = await this.reproductiveService.upsertCyclePrediction(userId, dto);

    return {
      message: 'Cycle prediction generated successfully',
      data: result,
    };
  }

  /**
   * Get Cycle Predictions
   *
   * Retrieves recent predictions for user.
   * Returns last 3 predictions ordered by creation date (newest first).
   *
   * Used for:
   * - Showing prediction history
   * - Comparing predicted vs actual dates (accuracy tracking)
   * - Learning from past predictions
   *
   * @route GET /v1/reproductive/predictions
   * @auth Bearer Token (JWT)
   * @returns Array of recent predictions
   */
  @Get('predictions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get cycle predictions',
    description:
      'Retrieves recent predictions (last 3). ' +
      'Used for showing prediction history and accuracy tracking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Predictions retrieved successfully',
    type: [CyclePredictionEntity],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getPredictions(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Fetching predictions for user: ${userId}`);

    const result = await this.reproductiveService.getCyclePredictions(userId);

    return {
      message: 'Predictions retrieved successfully',
      data: result,
    };
  }

  /**
   * Get Fertile Window
   *
   * Retrieves current fertile window from latest prediction.
   *
   * Fertile Window Calculation (Evidence-Based):
   * - Start: 5 days before ovulation (O-5)
   * - End: 1 day after ovulation (O+1)
   * - Peak: Ovulation day (O)
   *
   * Includes:
   * - Daily conception probabilities for charting
   * - Best conception days (O-2: 30%, O-1: 30%, O: 33%)
   *
   * Used for:
   * - Showing fertile window on calendar
   * - Color-coding days by conception probability
   * - Timing intercourse for conception
   * - Natural family planning
   *
   * @route GET /v1/reproductive/fertile-window
   * @auth Bearer Token (JWT)
   * @returns Fertile window dates and probabilities
   */
  @Get('fertile-window')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get fertile window',
    description:
      'Retrieves current fertile window (O-5 to O+1) with daily conception probabilities. ' +
      'Based on latest prediction. Used for conception timing and calendar visualization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Fertile window retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'No predictions available',
  })
  async getFertileWindow(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Fetching fertile window for user: ${userId}`);

    const result = await this.reproductiveService.getFertileWindow(userId);

    return {
      message: 'Fertile window retrieved successfully',
      data: result,
    };
  }

  /**
   * Get Next Predicted Period
   *
   * Simple endpoint for quick access to primary prediction data.
   * Returns just the next predicted period start date.
   *
   * Used for:
   * - Home screen "Your period in X days" display
   * - Push notification scheduling
   * - Quick API check
   *
   * @route GET /v1/reproductive/next-period
   * @auth Bearer Token (JWT)
   * @returns Predicted period start date
   */
  @Get('next-period')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get next predicted period',
    description:
      'Simple endpoint returning just the next predicted period start date. ' +
      'Used for home screen display and notification scheduling.',
  })
  @ApiResponse({
    status: 200,
    description: 'Next period date retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'No predictions available',
  })
  async getNextPeriod(@GetCurrentUserId() userId: string): Promise<any> {
    this.logger.log(`Fetching next period for user: ${userId}`);

    const result = await this.reproductiveService.getNextPredictedPeriod(userId);

    return {
      message: 'Next period prediction retrieved successfully',
      data: { predictedDate: result },
    };
  }
}
