/**
 * Log Daily Health DTO
 *
 * Data Transfer Object for creating a daily health log entry.
 * Captures symptoms, temperature, mood, and lifestyle factors.
 *
 * CONTEXTUAL VALIDATION:
 * - BBT range validated based on measurement source
 * - Oral/Vaginal: 35.0-42.0°C
 * - Wearable (skin): 32.0-37.0°C
 *
 * DATE HANDLING:
 * - All dates normalized to UTC startOfDay in service layer
 * - Service validates logDate is not in future
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
  IsNumber,
  IsBoolean,
  IsArray,
  IsString,
  Min,
  Max,
  ArrayMaxSize,
  MaxLength,
  ValidateIf,
  type ValidationArguments,
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';
import {
  FlowType,
  CervicalMucus,
  PainLevel,
  MoodLevel,
  BBTSource,
  MenopauseSymptom,
} from '@mimicare/schema';
import { Type, Transform } from 'class-transformer';

/**
 * Custom Validator: BBT Range Based on Source
 *
 * Validates temperature is within acceptable range for measurement source:
 * - ORAL_THERMOMETER / VAGINAL_SENSOR: 35.0-42.0°C
 * - WEARABLE (skin temp): 32.0-37.0°C
 */
function IsBBTInRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBBTInRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as any;
          const source = dto.basalBodyTempSource;
          const temp = value;

          if (temp === null || temp === undefined) return true; // Optional field

          // Wearable devices measure skin temperature (lower range)
          if (source === BBTSource.WEARABLE) {
            return temp >= 32.0 && temp <= 37.0;
          }

          // Oral/Vaginal thermometers measure core temperature
          return temp >= 35.0 && temp <= 42.0;
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as any;
          const source = dto.basalBodyTempSource;

          if (source === BBTSource.WEARABLE) {
            return 'Wearable skin temperature must be between 32.0-37.0°C';
          }
          return 'BBT must be between 35.0-42.0°C (check for fever if >38°C)';
        },
      },
    });
  };
}

/**
 * Log Daily Health Request DTO
 *
 * Validates daily health tracking data with clinical constraints.
 * Date must not be in future (validated in service layer).
 * BBT range varies by measurement source (contextual validation).
 *
 * FRONTEND RESPONSIBILITY:
 * - Display user-friendly symptom summaries (not raw data)
 * - Clinical metrics available in "View Details" expansion
 */
export class LogDailyHealthDto {
  @ApiProperty({
    description:
      'Date of health log (ISO format: YYYY-MM-DD, must not be in future, normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2025-12-16',
  })
  @IsDateString({}, { message: 'Log date must be a valid ISO date (YYYY-MM-DD)' })
  logDate!: string;

  @ApiPropertyOptional({
    description: 'Menstrual flow intensity (SPOTTING does not count as Cycle Day 1)',
    enum: FlowType,
    enumName: 'FlowType',
    example: FlowType.MEDIUM,
  })
  @IsEnum(FlowType, {
    message: 'Invalid flow type. Must be one of: SPOTTING, LIGHT, MEDIUM, HEAVY, VERY_HEAVY',
  })
  @IsOptional()
  flowType?: FlowType;

  @ApiPropertyOptional({
    description: 'Cervical mucus consistency (key fertility indicator: EGGWHITE = peak fertility)',
    enum: CervicalMucus,
    enumName: 'CervicalMucus',
    example: CervicalMucus.EGGWHITE,
  })
  @IsEnum(CervicalMucus, {
    message: 'Invalid cervical mucus type. Must be one of: NONE, STICKY, CREAMY, WATERY, EGGWHITE',
  })
  @IsOptional()
  cervicalMucus?: CervicalMucus;

  @ApiPropertyOptional({
    description: 'Pain intensity level',
    enum: PainLevel,
    enumName: 'PainLevel',
    example: PainLevel.MILD,
  })
  @IsEnum(PainLevel, {
    message: 'Invalid pain level. Must be one of: NONE, MILD, MODERATE, SEVERE, UNBEARABLE',
  })
  @IsOptional()
  painLevel?: PainLevel;

  @ApiPropertyOptional({
    description: 'Body locations experiencing pain (e.g., lower_abdomen, lower_back, breasts)',
    type: [String],
    example: ['lower_abdomen', 'lower_back'],
  })
  @IsArray({ message: 'Pain locations must be an array' })
  @IsString({ each: true, message: 'Each pain location must be a string' })
  @ArrayMaxSize(10, { message: 'Cannot log more than 10 pain locations' })
  @IsOptional()
  painLocations?: string[] = [];

  @ApiPropertyOptional({
    description:
      'Basal body temperature in Celsius (range varies by source: oral 35-42°C, wearable 32-37°C)',
    example: 36.4,
    minimum: 32.0,
    maximum: 42.0,
    type: Number,
  })
  @IsNumber({}, { message: 'BBT must be a valid number' })
  @Type(() => Number)
  @IsBBTInRange()
  @IsOptional()
  basalBodyTemp?: number;

  @ApiPropertyOptional({
    description: 'Source of BBT measurement (affects valid temperature range)',
    enum: BBTSource,
    enumName: 'BBTSource',
    example: BBTSource.MANUAL_ENTRY,
  })
  @IsEnum(BBTSource, {
    message:
      'Invalid BBT source. Must be one of: MANUAL_ENTRY, ORAL_THERMOMETER, WEARABLE, VAGINAL_SENSOR',
  })
  @IsOptional()
  basalBodyTempSource?: BBTSource = BBTSource.MANUAL_ENTRY;

  @ApiPropertyOptional({
    description: 'Mood/emotional state (hormone-correlated across cycle phases)',
    enum: MoodLevel,
    enumName: 'MoodLevel',
    example: MoodLevel.HAPPY,
  })
  @IsEnum(MoodLevel, {
    message:
      'Invalid mood level. Must be one of: VERY_HAPPY, HAPPY, NEUTRAL, SAD, VERY_SAD, ANXIOUS, IRRITABLE',
  })
  @IsOptional()
  mood?: MoodLevel;

  @ApiPropertyOptional({
    description: 'Energy level on 1-10 scale (1=exhausted, 10=extremely energetic)',
    example: 7,
    minimum: 1,
    maximum: 10,
    type: Number,
  })
  @IsNumber({}, { message: 'Energy level must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Energy level must be at least 1' })
  @Max(10, { message: 'Energy level must not exceed 10' })
  @IsOptional()
  energyLevel?: number;

  @ApiPropertyOptional({
    description: 'Sleep quality on 1-10 scale (1=very poor, 10=excellent)',
    example: 8,
    minimum: 1,
    maximum: 10,
    type: Number,
  })
  @IsNumber({}, { message: 'Sleep quality must be a number' })
  @Type(() => Number)
  @Min(1, { message: 'Sleep quality must be at least 1' })
  @Max(10, { message: 'Sleep quality must not exceed 10' })
  @IsOptional()
  sleepQuality?: number;

  @ApiPropertyOptional({
    description: 'Total hours of sleep',
    example: 7.5,
    minimum: 0,
    maximum: 24,
    type: Number,
  })
  @IsNumber({}, { message: 'Sleep hours must be a number' })
  @Type(() => Number)
  @Min(0, { message: 'Sleep hours cannot be negative' })
  @Max(24, { message: 'Sleep hours cannot exceed 24' })
  @IsOptional()
  sleepHours?: number;

  @ApiPropertyOptional({
    description: 'Menopause-related symptoms (for perimenopause/menopause users)',
    enum: MenopauseSymptom,
    enumName: 'MenopauseSymptom',
    isArray: true,
    example: [],
  })
  @IsArray({ message: 'Menopause symptoms must be an array' })
  @IsEnum(MenopauseSymptom, {
    each: true,
    message:
      'Invalid menopause symptom. Must be one of: HOT_FLASHES, NIGHT_SWEATS, INSOMNIA, MOOD_SWINGS, BRAIN_FOG, VAGINAL_DRYNESS, JOINT_PAIN, WEIGHT_GAIN',
  })
  @ArrayMaxSize(20, { message: 'Cannot log more than 20 symptoms' })
  @IsOptional()
  menopauseSymptoms?: MenopauseSymptom[] = [];

  @ApiPropertyOptional({
    description: 'Whether sexual intercourse occurred (fertility tracking)',
    example: false,
  })
  @IsBoolean({ message: 'hadIntercourse must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hadIntercourse?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether protection was used during intercourse',
    example: false,
  })
  @IsBoolean({ message: 'usedProtection must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @ValidateIf((o) => o.hadIntercourse === true)
  @IsOptional()
  usedProtection?: boolean = false;

  @ApiPropertyOptional({
    description: 'Number of glasses/cups of water consumed',
    example: 8,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'Water intake must be a number' })
  @Type(() => Number)
  @Min(0, { message: 'Water intake cannot be negative' })
  @IsOptional()
  waterIntake?: number;

  @ApiPropertyOptional({
    description: 'Minutes of exercise performed',
    example: 30,
    minimum: 0,
    type: Number,
  })
  @IsNumber({}, { message: 'Exercise minutes must be a number' })
  @Type(() => Number)
  @Min(0, { message: 'Exercise minutes cannot be negative' })
  @IsOptional()
  exerciseMinutes?: number;

  @ApiPropertyOptional({
    description: 'Type of exercise performed (e.g., Yoga, Running, Gym)',
    example: 'Yoga',
    maxLength: 100,
  })
  @IsString({ message: 'Exercise type must be a string' })
  @MaxLength(100, { message: 'Exercise type too long' })
  @ValidateIf((o) => o.exerciseMinutes && o.exerciseMinutes > 0)
  @IsOptional()
  exerciseType?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Feeling bloated today, had mild cramps in the evening',
    maxLength: 1000,
  })
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes too long (max 1000 characters)' })
  @IsOptional()
  notes?: string;
}
