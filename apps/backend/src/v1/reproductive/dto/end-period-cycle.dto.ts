/**
 * End Period Cycle DTO
 *
 * Data Transfer Object for marking the end of a menstrual period.
 * Validates end date is after start date.
 *
 * DATE HANDLING:
 * - End date normalized to UTC startOfDay in service layer
 * - Service validates endDate > startDate
 * - Service calculates periodDuration automatically
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { PeriodFlowIntensity, CervicalMucus } from '@mimicare/schema';

/**
 * End Period Cycle Request DTO
 *
 * Used to mark the last day of bleeding and summarize the period.
 * Service validates that endDate > startDate and calculates period duration.
 *
 * FRONTEND RESPONSIBILITY:
 * - Show period summary (duration, symptoms) after ending cycle
 * - Prompt for cervical mucus observation during follicular phase
 */
export class EndPeriodCycleDto {
  @ApiProperty({
    description:
      'Period end date (last day of bleeding, ISO format: YYYY-MM-DD, must be after start date, normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2025-11-15',
  })
  @IsDateString({}, { message: 'End date must be a valid ISO date (YYYY-MM-DD)' })
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Overall flow intensity for the period',
    enum: PeriodFlowIntensity,
    enumName: 'PeriodFlowIntensity',
    example: PeriodFlowIntensity.MEDIUM,
  })
  @IsEnum(PeriodFlowIntensity, {
    message: 'Invalid flow intensity. Must be one of: SPOTTING, LIGHT, MEDIUM, HEAVY',
  })
  @IsOptional()
  flowIntensity?: PeriodFlowIntensity;

  @ApiPropertyOptional({
    description: 'Cervical mucus observed during cycle (fertility tracking for next ovulation)',
    enum: CervicalMucus,
    enumName: 'CervicalMucus',
    example: CervicalMucus.CREAMY,
  })
  @IsEnum(CervicalMucus, {
    message: 'Invalid cervical mucus type. Must be one of: NONE, STICKY, CREAMY, WATERY, EGGWHITE',
  })
  @IsOptional()
  cervicalMucus?: CervicalMucus;

  @ApiPropertyOptional({
    description: 'Symptoms and mood descriptors experienced during period',
    type: [String],
    example: ['cramps', 'fatigue', 'irritable', 'bloating'],
  })
  @IsArray({ message: 'Symptoms and mood must be an array' })
  @IsString({ each: true, message: 'Each symptom must be a string' })
  @ArrayMaxSize(20, { message: 'Cannot log more than 20 symptoms' })
  @IsOptional()
  symptomsAndMood?: string[] = [];

  @ApiPropertyOptional({
    description: 'Summary notes for this period',
    example: 'Heavy flow on day 2, needed pain relief. Overall manageable.',
    maxLength: 1000,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes too long (max 1000 characters)' })
  @IsOptional()
  notes?: string;
}
