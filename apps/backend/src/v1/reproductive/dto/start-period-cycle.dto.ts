/**
 * Start Period Cycle DTO
 *
 * Data Transfer Object for marking the start of a menstrual period (Cycle Day 1).
 * Validates flow intensity meets minimum threshold (SPOTTING doesn't count as Day 1).
 *
 * DATE HANDLING:
 * - Start date normalized to UTC startOfDay in service layer
 * - Service validates startDate is not in future
 * - Service checks no overlapping active period exists
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PeriodFlowIntensity } from '@mimicare/schema';

/**
 * Start Period Cycle Request DTO
 *
 * Used to mark Cycle Day 1 (first day of period with flow ≥LIGHT).
 * Flow must be at least LIGHT to count as Day 1 (spotting doesn't count).
 *
 * FRONTEND RESPONSIBILITY:
 * - Prompt user to confirm if they marked spotting as Day 1
 * - Show "Your cycle will start when flow reaches LIGHT intensity"
 */
export class StartPeriodCycleDto {
  @ApiProperty({
    description:
      'Period start date (Cycle Day 1, ISO format: YYYY-MM-DD, must not be in future, normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2025-11-10',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date (YYYY-MM-DD)' })
  startDate!: string;

  @ApiPropertyOptional({
    description:
      'Flow intensity on Day 1 (SPOTTING does not count as Cycle Day 1 per FHIR standards)',
    enum: PeriodFlowIntensity,
    enumName: 'PeriodFlowIntensity',
    example: PeriodFlowIntensity.LIGHT,
  })
  @IsEnum(PeriodFlowIntensity, {
    message: 'Invalid flow intensity. Must be one of: SPOTTING, LIGHT, MEDIUM, HEAVY',
  })
  @IsOptional()
  flowIntensity?: PeriodFlowIntensity = PeriodFlowIntensity.LIGHT;

  @ApiPropertyOptional({
    description: 'Initial symptoms or notes for Day 1',
    example: 'Mild cramps, started in the morning',
    maxLength: 500,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes too long (max 500 characters)' })
  @IsOptional()
  notes?: string;
}
