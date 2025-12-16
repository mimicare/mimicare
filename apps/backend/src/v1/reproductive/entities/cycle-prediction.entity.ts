/**
 * Cycle Prediction Entity
 *
 * Represents a predicted menstrual cycle with ovulation date,
 * fertile window, and confidence metrics based on historical data.
 *
 * @module ReproductiveModule
 * @category Entity
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CyclePhase } from '@mimicare/schema';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Daily Conception Probability
 *
 * Represents conception probability for a specific date within the fertile window.
 * Used to render fertility charts on the frontend.
 */
export class DailyProbability {
  @ApiProperty({
    description: 'Date in ISO format',
    example: '2025-11-22',
  })
  date!: string;

  @ApiProperty({
    description: 'Conception probability (0.0 to 1.0)',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  probability!: number;

  @ApiProperty({
    description: 'Human-readable fertility level (Low, Medium, High, Peak)',
    example: 'High',
  })
  label!: string;
}

/**
 * Fertile Window Details
 *
 * Structured fertile window data with daily conception probabilities.
 * Replaces generic Record<string, any> for type-safe frontend integration.
 */
export class FertileWindowDetails {
  @ApiProperty({
    description: 'Fertile window start date (typically O-5)',
    type: 'string',
    format: 'date',
    example: '2025-11-21',
  })
  start!: Date;

  @ApiProperty({
    description: 'Fertile window end date (typically O+1)',
    type: 'string',
    format: 'date',
    example: '2025-11-27',
  })
  end!: Date;

  @ApiProperty({
    description: 'Peak fertility date (ovulation day)',
    type: 'string',
    format: 'date',
    example: '2025-11-24',
  })
  peak!: Date;

  @ApiProperty({
    description: 'Daily conception probabilities for charting',
    type: [DailyProbability],
  })
  @Type(() => DailyProbability)
  dailyProbabilities!: DailyProbability[];
}

/**
 * Cycle Prediction Response Entity
 *
 * Predictive analysis of the next menstrual cycle including ovulation timing,
 * fertile window, and accuracy metrics for continuous improvement.
 */
@Exclude()
export class CyclePredictionEntity {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the prediction',
    example: 'cm4pred123xyz456',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID this prediction belongs to',
    example: 'cm4user123xyz',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Predicted period start date',
    type: 'string',
    format: 'date',
    example: '2025-12-08',
  })
  predictedStartDate!: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Predicted ovulation date (14 days before next period)',
    type: 'string',
    format: 'date',
    example: '2025-11-24',
  })
  predictedOvulationDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Predicted period end date (startDate + avg period duration)',
    type: 'string',
    format: 'date',
    example: '2025-12-13',
  })
  predictedEndDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Actual period start date (filled when period starts)',
    type: 'string',
    format: 'date',
    example: '2025-12-09',
  })
  actualStartDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Actual ovulation date (filled when detected via BBT/LH)',
    type: 'string',
    format: 'date',
    example: '2025-11-25',
  })
  actualOvulationDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Actual period end date',
    type: 'string',
    format: 'date',
    example: '2025-12-14',
  })
  actualEndDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Prediction confidence level (0-100%)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  confidenceLevel?: number;

  @Expose()
  @ApiProperty({
    description: 'Method used for prediction (CALENDAR_MEDIAN, BBT_ANALYSIS, etc.)',
    example: 'CALENDAR_MEDIAN',
  })
  predictionMethod!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Fertile window start date',
    type: 'string',
    format: 'date',
    example: '2025-11-21',
  })
  fertilityWindowStart?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Fertile window end date',
    type: 'string',
    format: 'date',
    example: '2025-11-27',
  })
  fertilityWindowEnd?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Detailed fertile window data with daily conception probabilities',
    type: FertileWindowDetails,
  })
  @Type(() => FertileWindowDetails)
  fertileWindowData?: FertileWindowDetails;

  @Expose()
  @ApiPropertyOptional({
    description: 'Best conception day #1 (typically O-2)',
    type: 'string',
    format: 'date',
    example: '2025-11-22',
  })
  bestConceptionDay1?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Best conception day #2 (typically O-1)',
    type: 'string',
    format: 'date',
    example: '2025-11-23',
  })
  bestConceptionDay2?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Current cycle phase',
    enum: CyclePhase,
    example: CyclePhase.FOLLICULAR,
  })
  currentCyclePhase?: CyclePhase;

  @Expose()
  @ApiPropertyOptional({
    description: 'Days remaining until predicted ovulation (negative if ovulation passed)',
    example: 8,
  })
  daysUntilOvulation?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Prediction error in days (actual - predicted start date)',
    example: 2,
  })
  startDateError?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Ovulation prediction error in days (actual - predicted ovulation)',
    example: 1,
  })
  ovulationDateError?: number;

  @Expose()
  @ApiProperty({
    description: 'Prediction creation timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-11-10T10:00:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Prediction last update timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-12-09T09:00:00.000Z',
  })
  updatedAt!: Date;
}
