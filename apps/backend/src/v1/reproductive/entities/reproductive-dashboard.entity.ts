/**
 * Reproductive Dashboard Entity
 *
 * Aggregated reproductive health data optimized for dashboard display.
 * Combines current cycle status, predictions, and historical statistics.
 *
 * @module ReproductiveModule
 * @category Entity
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CyclePhase } from '@mimicare/schema';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Prediction Confidence Level
 *
 * Enum for strict typing of prediction confidence.
 * Based on cycle regularity and data availability.
 */
export enum PredictionConfidence {
  /** 6+ regular cycles (variability ≤4 days) - 85-95% accuracy */
  HIGH = 'HIGH',
  /** 3-5 regular cycles OR 6+ irregular - 70-85% accuracy */
  MEDIUM = 'MEDIUM',
  /** <3 cycles OR highly irregular - 50-70% accuracy */
  LOW = 'LOW',
}

/**
 * Prediction Type
 *
 * Distinguishes between tentative calendar-based predictions
 * and confirmed predictions backed by symptom/BBT data.
 */
export enum PredictionType {
  /** Based on historical averages only (low-medium confidence) */
  TENTATIVE = 'TENTATIVE',
  /** Backed by real-time symptoms, BBT, or LH tests (high confidence) */
  CONFIRMED = 'CONFIRMED',
}

/**
 * Fertile Window Dates
 *
 * Start and end dates of the fertile window for conception tracking.
 */
@Exclude()
export class FertileWindowDates {
  @Expose()
  @ApiProperty({
    description: 'Fertile window start date (typically O-5)',
    type: 'string',
    format: 'date',
    example: '2025-11-21',
  })
  start!: Date;

  @Expose()
  @ApiProperty({
    description: 'Fertile window end date (typically O+1)',
    type: 'string',
    format: 'date',
    example: '2025-11-27',
  })
  end!: Date;
}

/**
 * Cycle Statistics
 *
 * Statistical summary of historical cycle data for insights and trends.
 */
@Exclude()
export class CycleStatistics {
  @Expose()
  @ApiProperty({
    description: 'Total number of logged complete cycles',
    example: 12,
  })
  totalCycles!: number;

  @Expose()
  @ApiProperty({
    description: 'Number of regular cycles (variability ≤7 days)',
    example: 10,
  })
  regularCycles!: number;

  @Expose()
  @ApiProperty({
    description: 'Number of irregular cycles (variability >7 days)',
    example: 2,
  })
  irregularCycles!: number;

  @Expose()
  @ApiProperty({
    description: 'Average period duration in days across all cycles',
    example: 5,
  })
  averagePeriodDuration!: number;

  @Expose()
  @ApiProperty({
    description: 'Average cycle length in days',
    example: 28,
  })
  averageCycleLength!: number;

  @Expose()
  @ApiProperty({
    description: 'Shortest cycle length observed',
    example: 25,
  })
  shortestCycle!: number;

  @Expose()
  @ApiProperty({
    description: 'Longest cycle length observed',
    example: 32,
  })
  longestCycle!: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Date of last logged period',
    type: 'string',
    format: 'date',
    example: '2025-12-01',
  })
  lastPeriodDate?: Date | null;
}

/**
 * Reproductive Dashboard Response Entity
 *
 * Comprehensive dashboard view optimized for single-request data loading.
 * Includes current status, predictions, analytics, and health alerts for UI rendering.
 */
@Exclude()
export class ReproductiveDashboardEntity {
  @Expose()
  @ApiPropertyOptional({
    description: 'Next predicted period start date',
    type: 'string',
    format: 'date',
    example: '2025-12-08',
  })
  nextPredictedPeriod?: Date | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Predicted ovulation date',
    type: 'string',
    format: 'date',
    example: '2025-11-24',
  })
  predictedOvulation?: Date | null;

  @Expose()
  @ApiProperty({
    description: 'Current menstrual cycle phase',
    enum: CyclePhase,
    example: CyclePhase.LUTEAL,
  })
  currentPhase!: CyclePhase;

  @Expose()
  @ApiProperty({
    description: 'Days remaining until next predicted period',
    example: 8,
  })
  daysUntilPeriod!: number;

  @Expose()
  @ApiProperty({
    description: 'Days remaining until predicted ovulation (negative if ovulation has passed)',
    example: -6,
  })
  daysUntilOvulation!: number;

  @Expose()
  @ApiProperty({
    description: 'Whether user is currently in fertile window (O-5 to O+1)',
    example: false,
  })
  isFertileWindow!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Fertile window date range',
    type: FertileWindowDates,
  })
  @Type(() => FertileWindowDates)
  fertileWindowDates?: FertileWindowDates | null;

  @Expose()
  @ApiProperty({
    description: 'Average cycle length across historical data',
    example: 28,
  })
  averageCycleLength!: number;

  @Expose()
  @ApiProperty({
    description: 'Whether cycles are regular (variability ≤7 days)',
    example: true,
  })
  isCycleRegular!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Prediction confidence level based on data quality',
    enum: PredictionConfidence,
    example: PredictionConfidence.HIGH,
  })
  predictionConfidence!: PredictionConfidence;

  @Expose()
  @ApiProperty({
    description: 'Prediction type: TENTATIVE (calendar-based) or CONFIRMED (symptom/BBT-backed)',
    enum: PredictionType,
    example: PredictionType.CONFIRMED,
  })
  predictionType!: PredictionType;

  @Expose()
  @ApiProperty({
    description: 'Whether user has an active period currently',
    example: false,
  })
  hasActivePeriod!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Current day of active period (null if no active period)',
    example: 3,
  })
  activePeriodDay?: number | null;

  @Expose()
  @ApiProperty({
    description: 'Statistical summary of cycle history',
    type: CycleStatistics,
  })
  @Type(() => CycleStatistics)
  statistics!: CycleStatistics;

  @Expose()
  @ApiProperty({
    description: 'Health alerts and important notices (i18n translation keys)',
    type: [String],
    example: ['alerts.irregular_cycles', 'alerts.need_more_data'],
  })
  healthAlerts!: string[];

  @Expose()
  @ApiPropertyOptional({
    description: "User's reproductive health goal",
    example: 'TRACKING_ONLY',
  })
  reproductiveGoal?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Date of last logged daily health data',
    type: 'string',
    format: 'date',
    example: '2025-12-15',
  })
  lastLoggedDate?: Date;

  @Expose()
  @ApiProperty({
    description: 'Whether user has logged data today',
    example: true,
  })
  hasLoggedToday!: boolean;
}
