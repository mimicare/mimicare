/**
 * Reproductive Profile Entity
 *
 * Represents a user's complete reproductive health profile with cycle characteristics,
 * medical history, and cached analytical results.
 *
 * This entity uses class-transformer for proper serialization and provides
 * strict typing for frontend code generation.
 *
 * @module ReproductiveModule
 * @category Entity
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReproductiveUserGoal, ReproductiveCondition } from '@mimicare/schema';
import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Cycle Regularity Analysis Result
 *
 * Structured result from cycle regularity analysis algorithm.
 * Used to determine prediction confidence and identify PCOS risk.
 */
export class RegularityAnalysisResult {
  @ApiProperty({
    description: 'Whether cycles are regular (variability ≤7 days)',
    example: true,
  })
  isRegular!: boolean;

  @ApiProperty({
    description: 'Prediction confidence level based on cycle history',
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    example: 'HIGH',
  })
  confidenceLevel!: string;

  @ApiProperty({
    description: 'Cycle length variability in days (max - min)',
    example: 3,
    minimum: 0,
  })
  cycleVariability!: number;

  @ApiProperty({
    description: 'Number of cycles analyzed',
    example: 6,
  })
  cyclesAnalyzed!: number;

  @ApiProperty({
    description: 'Median cycle length in days',
    example: 28,
  })
  medianCycleLength!: number;
}

/**
 * Basal Body Temperature Analysis Result
 *
 * Structured result from BBT thermal shift detection.
 * Used to confirm ovulation retrospectively.
 */
export class BBTAnalysisResult {
  @ApiProperty({
    description: 'Whether ovulation was detected via thermal shift',
    example: true,
  })
  ovulationDetected!: boolean;

  @ApiProperty({
    description: 'Temperature shift magnitude in Celsius',
    example: 0.3,
    minimum: 0.2,
    maximum: 0.5,
  })
  thermalShift!: number;

  @ApiProperty({
    description: 'Detected ovulation day (cycle day number)',
    example: 14,
    minimum: 8,
    maximum: 21,
  })
  ovulationDay!: number;

  @ApiProperty({
    description: 'Average follicular phase temperature (°C)',
    example: 36.2,
  })
  follicularPhaseTemp!: number;

  @ApiProperty({
    description: 'Average luteal phase temperature (°C)',
    example: 36.5,
  })
  lutealPhaseTemp!: number;

  @ApiProperty({
    description: 'Number of temperature readings analyzed',
    example: 21,
  })
  readingsAnalyzed!: number;
}

/**
 * Reproductive Profile Response Entity
 *
 * Complete reproductive health profile returned by the API.
 * Includes cycle characteristics, medical history, and cached analysis.
 *
 * Uses @Exclude() at class level and @Expose() on individual properties
 * to ensure only intended fields are serialized.
 */
@Exclude()
export class ReproductiveProfileEntity {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the reproductive profile',
    example: 'cm4abc123xyz456def',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID this profile belongs to',
    example: 'cm4user123xyz',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Whether the user has irregular menstrual cycles',
    example: false,
    default: false,
  })
  isIrregular!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Average menstrual cycle length in days (FIGO 2018: 24-38 normal)',
    example: 28.5,
    minimum: 21,
    maximum: 45,
  })
  averageCycleLength?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Shortest observed cycle length in days',
    example: 25,
  })
  shortestCycle?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Longest observed cycle length in days',
    example: 32,
  })
  longestCycle?: number;

  @Expose()
  @ApiProperty({
    description: "User's reproductive health goal (affects UI and notifications)",
    enum: ReproductiveUserGoal,
    example: ReproductiveUserGoal.TRACKING_ONLY,
    default: ReproductiveUserGoal.TRACKING_ONLY,
  })
  reproductiveGoal!: ReproductiveUserGoal;

  @Expose()
  @ApiPropertyOptional({
    description: 'User-specific luteal phase length in days (10-17 typical, 14 standard)',
    example: 14,
    minimum: 10,
    maximum: 17,
  })
  lutealPhaseLength?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Average period duration in days (3-7 typical)',
    example: 5,
    minimum: 1,
    maximum: 14,
  })
  averagePeriodDuration?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Cached cycle regularity analysis with structured result',
    type: RegularityAnalysisResult,
  })
  @Type(() => RegularityAnalysisResult)
  lastRegularityAnalysis?: RegularityAnalysisResult;

  @Expose()
  @ApiPropertyOptional({
    description: 'Timestamp when regularity analysis was last calculated',
    type: 'string',
    format: 'date-time',
    example: '2025-12-16T11:30:00.000Z',
  })
  lastRegularityCalculatedAt?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Cached BBT analysis with thermal shift detection',
    type: BBTAnalysisResult,
  })
  @Type(() => BBTAnalysisResult)
  lastBBTAnalysis?: BBTAnalysisResult;

  @Expose()
  @ApiPropertyOptional({
    description: 'Timestamp when BBT analysis was last calculated',
    type: 'string',
    format: 'date-time',
    example: '2025-12-16T11:30:00.000Z',
  })
  lastBBTAnalysisCalculatedAt?: Date;

  @Expose()
  @ApiProperty({
    description: 'Array of diagnosed reproductive conditions',
    enum: ReproductiveCondition,
    isArray: true,
    example: [ReproductiveCondition.NONE],
    default: [ReproductiveCondition.NONE],
  })
  diagnosedConditions!: ReproductiveCondition[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Date when reproductive condition was diagnosed',
    type: 'string',
    format: 'date',
    example: '2024-06-15',
  })
  diagnosisDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Doctor ID of treating physician',
    example: 'cm4doc123xyz',
  })
  treatingDoctorId?: string;

  @Expose()
  @ApiProperty({
    description: 'Whether user is currently on birth control',
    example: false,
    default: false,
  })
  isOnBirthControl!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Type of birth control method (e.g., Combined Oral Contraceptive, IUD)',
    example: 'Combined Oral Contraceptive',
  })
  birthControlType?: string;

  @Expose()
  @ApiProperty({
    description: 'Whether user is undergoing fertility treatment (IVF, IUI, etc.)',
    example: false,
    default: false,
  })
  isOnFertilityTreatment!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Smoking status (affects fertility and pregnancy risk)',
    example: 'NON_SMOKER',
  })
  smokingStatus?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Alcohol consumption level',
    example: 'MODERATE',
  })
  alcoholConsumption?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Current stress level (affects cycle regularity)',
    example: 'LOW',
  })
  stressLevel?: string;

  @Expose()
  @ApiProperty({
    description: 'Profile creation timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Profile last update timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-12-16T11:30:00.000Z',
  })
  updatedAt!: Date;
}
