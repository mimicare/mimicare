/**
 * Daily Health Log Entity
 *
 * Represents a single day's comprehensive health data entry including
 * menstrual flow, symptoms, basal body temperature, mood, and lifestyle factors.
 *
 * @module ReproductiveModule
 * @category Entity
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FlowType,
  CervicalMucus,
  PainLevel,
  MoodLevel,
  BBTSource,
  MenopauseSymptom,
} from '@mimicare/schema';
import { Exclude, Expose } from 'class-transformer';

/**
 * Daily Health Log Response Entity
 *
 * Complete daily health tracking data with validation-friendly structure.
 * Used for symptom correlation, ovulation detection, and cycle pattern analysis.
 */
@Exclude()
export class DailyHealthLogEntity {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier for the daily health log',
    example: 'cm4log123xyz456def',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID this log belongs to',
    example: 'cm4user123xyz',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Date of the health log entry (must not be in future)',
    type: 'string',
    format: 'date',
    example: '2025-12-16',
  })
  logDate!: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Menstrual flow intensity (Cycle Day 1 requires ≥LIGHT)',
    enum: FlowType,
    example: FlowType.MEDIUM,
  })
  flowType?: FlowType;

  @Expose()
  @ApiPropertyOptional({
    description: 'Cervical mucus consistency (key fertility indicator)',
    enum: CervicalMucus,
    example: CervicalMucus.EGGWHITE,
  })
  cervicalMucus?: CervicalMucus;

  @Expose()
  @ApiPropertyOptional({
    description: 'Pain intensity level',
    enum: PainLevel,
    example: PainLevel.MILD,
  })
  painLevel?: PainLevel;

  @Expose()
  @ApiProperty({
    description: 'Body locations experiencing pain (e.g., lower_abdomen, lower_back, breasts)',
    type: [String],
    example: ['lower_abdomen', 'lower_back'],
    default: [],
  })
  painLocations!: string[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Basal body temperature in Celsius (must be taken upon waking)',
    example: 36.4,
    minimum: 35.0,
    maximum: 42.0,
    type: Number,
  })
  basalBodyTemp?: number;

  @Expose()
  @ApiProperty({
    description: 'Source of BBT measurement (affects accuracy)',
    enum: BBTSource,
    example: BBTSource.MANUAL_ENTRY,
    default: BBTSource.MANUAL_ENTRY,
  })
  basalBodyTempSource!: BBTSource;

  @Expose()
  @ApiPropertyOptional({
    description: 'Mood/emotional state (hormone-correlated)',
    enum: MoodLevel,
    example: MoodLevel.HAPPY,
  })
  mood?: MoodLevel;

  @Expose()
  @ApiPropertyOptional({
    description: 'Energy level on 1-10 scale',
    example: 7,
    minimum: 1,
    maximum: 10,
  })
  energyLevel?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Sleep quality on 1-10 scale',
    example: 8,
    minimum: 1,
    maximum: 10,
  })
  sleepQuality?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Total hours of sleep',
    example: 7.5,
    minimum: 0,
    maximum: 24,
  })
  sleepHours?: number;

  @Expose()
  @ApiProperty({
    description: 'Menopause-related symptoms experienced (for perimenopause/menopause users)',
    enum: MenopauseSymptom,
    isArray: true,
    example: [],
    default: [],
  })
  menopauseSymptoms!: MenopauseSymptom[];

  @Expose()
  @ApiProperty({
    description: 'Whether sexual intercourse occurred (fertility tracking)',
    example: false,
    default: false,
  })
  hadIntercourse!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether protection was used during intercourse',
    example: false,
    default: false,
  })
  usedProtection!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Number of glasses/cups of water consumed',
    example: 8,
    minimum: 0,
  })
  waterIntake?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Minutes of exercise performed',
    example: 30,
    minimum: 0,
  })
  exerciseMinutes?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Type of exercise performed (e.g., Yoga, Running, Gym)',
    example: 'Yoga',
  })
  exerciseType?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Feeling bloated today, had mild cramps in the evening',
  })
  notes?: string;

  @Expose()
  @ApiProperty({
    description: 'Log creation timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-12-16T08:00:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Log last update timestamp',
    type: 'string',
    format: 'date-time',
    example: '2025-12-16T20:00:00.000Z',
  })
  updatedAt!: Date;
}
