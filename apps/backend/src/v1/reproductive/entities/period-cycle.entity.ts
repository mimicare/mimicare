/**
 * Period Cycle Entity
 *
 * Represents a complete menstrual cycle from period start to end,
 * including flow characteristics, symptoms, and ovulation detection.
 *
 * @module ReproductiveModule
 * @category Entity
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PeriodFlowIntensity, CervicalMucus, OvulationMethod } from '@mimicare/schema';
import { Exclude, Expose } from 'class-transformer';

/**
 * Period Cycle Response Entity
 *
 * Complete menstrual cycle record with flow tracking, symptom logging,
 * and ovulation detection for fertility awareness and cycle pattern analysis.
 */
@Exclude()
export class PeriodCycleEntity {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the period cycle',
    example: 'cm4cycle123xyz456',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID this cycle belongs to',
    example: 'cm4user123xyz',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Period start date (Cycle Day 1)',
    type: 'string',
    format: 'date',
    example: '2025-11-10',
  })
  startDate!: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Period end date (last day of bleeding)',
    type: 'string',
    format: 'date',
    example: '2025-11-15',
  })
  endDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Cycle length in days (from this period start to next period start)',
    example: 28,
    minimum: 21,
    maximum: 45,
  })
  cycleLength?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Period duration in days (number of bleeding days)',
    example: 5,
    minimum: 1,
    maximum: 14,
  })
  periodDuration?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Overall flow intensity for the period',
    enum: PeriodFlowIntensity,
    example: PeriodFlowIntensity.MEDIUM,
  })
  flowIntensity?: PeriodFlowIntensity;

  @Expose()
  @ApiProperty({
    description: 'Whether flow meets minimum threshold for Cycle Day 1 (≥LIGHT flow)',
    example: true,
    default: true,
  })
  flowMeetsDay1Threshold!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Array of symptoms and mood descriptors for this cycle',
    type: [String],
    example: ['cramps', 'fatigue', 'irritable', 'bloating'],
    default: [],
  })
  symptomsAndMood!: string[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Cervical mucus observation during cycle (fertility tracking)',
    enum: CervicalMucus,
    example: CervicalMucus.CREAMY,
  })
  cervicalMucus?: CervicalMucus;

  @Expose()
  @ApiPropertyOptional({
    description: 'Basal body temperature recorded during cycle in Celsius',
    example: 36.5,
    type: Number,
  })
  basalBodyTemperature?: number;

  @Expose()
  @ApiProperty({
    description: 'Whether ovulation was detected during this cycle',
    example: false,
    default: false,
  })
  ovulationDetected!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Date when ovulation was detected',
    type: 'string',
    format: 'date',
    example: '2025-11-24',
  })
  ovulationDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Method used to detect ovulation',
    enum: OvulationMethod,
    example: OvulationMethod.BBT,
  })
  ovulationMethod?: OvulationMethod;

  @Expose()
  @ApiPropertyOptional({
    description: 'Additional notes about this cycle',
    example: 'Heavy flow on day 2, used heating pad for cramps',
  })
  notes?: string;

  @Expose()
  @ApiProperty({
    description: 'Cycle record creation timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-11-10T09:00:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Cycle record last update timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-11-15T22:00:00.000Z',
  })
  updatedAt!: Date;
}
