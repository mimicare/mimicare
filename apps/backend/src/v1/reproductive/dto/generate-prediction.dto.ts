/**
 * Generate Prediction DTO
 *
 * Data Transfer Object for manually triggering cycle prediction generation.
 * Allows override of default prediction parameters.
 *
 * PREDICTION STRATEGY:
 * - CALENDAR_MEDIAN: Use median cycle length (default, most stable)
 * - BBT_ANALYSIS: Use BBT thermal shift (requires BBT data)
 * - MULTI_MODAL: Combine calendar + BBT + cervical mucus (highest accuracy)
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Prediction Method Enum
 *
 * Algorithm used for cycle prediction.
 * Service auto-selects best method based on available data.
 */
export enum PredictionMethod {
  /** Use median of historical cycle lengths (most stable, default) */
  CALENDAR_MEDIAN = 'CALENDAR_MEDIAN',
  /** Use BBT thermal shift data if available (higher accuracy) */
  BBT_ANALYSIS = 'BBT_ANALYSIS',
  /** Combine calendar + BBT + cervical mucus (highest accuracy, requires all data) */
  MULTI_MODAL = 'MULTI_MODAL',
  /** Use machine learning model (future implementation) */
  ML_MODEL = 'ML_MODEL',
}

/**
 * Generate Prediction Request DTO
 *
 * Optional parameters to customize prediction generation.
 * If not provided, service uses default algorithm and ideal cycle count.
 *
 * FRONTEND RESPONSIBILITY:
 * - Display prediction with confidence level (HIGH/MEDIUM/LOW)
 * - Show "clinicalMetrics" only in "View Details" section
 * - Use "insight" block for user-friendly messaging
 */
export class GeneratePredictionDto {
  @ApiPropertyOptional({
    description:
      'Number of historical cycles to analyze (more cycles = higher confidence, but older data less relevant)',
    example: 6,
    minimum: 2,
    maximum: 12,
    type: Number,
  })
  @IsInt({ message: 'Cycles to analyze must be a whole number' })
  @Type(() => Number)
  @Min(2, { message: 'Must analyze at least 2 cycles (need cycle length data)' })
  @Max(12, { message: 'Cannot analyze more than 12 cycles (older data less predictive)' })
  @IsOptional()
  cyclesToAnalyze?: number = 6;

  @ApiPropertyOptional({
    description: 'Prediction method to use (service auto-selects best method if not specified)',
    enum: PredictionMethod,
    enumName: 'PredictionMethod',
    example: PredictionMethod.CALENDAR_MEDIAN,
  })
  @IsEnum(PredictionMethod, {
    message:
      'Invalid prediction method. Must be one of: CALENDAR_MEDIAN, BBT_ANALYSIS, MULTI_MODAL, ML_MODEL',
  })
  @IsOptional()
  method?: PredictionMethod = PredictionMethod.CALENDAR_MEDIAN;

  @ApiPropertyOptional({
    description:
      'Force regeneration even if recent prediction exists (useful after manual cycle end)',
    example: false,
  })
  @IsBoolean({ message: 'forceRegenerate must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  forceRegenerate?: boolean = false;
}
