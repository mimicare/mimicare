/**
 * Create Reproductive Profile DTO
 *
 * Data Transfer Object for creating a new reproductive health profile.
 * Validates initial profile setup with cycle history and medical information.
 *
 * IMPORTANT: All date inputs are normalized to UTC startOfDay in service layer
 * to prevent timezone-related "off-by-one-day" errors.
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  IsInt,
  IsBoolean,
  IsString,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ReproductiveUserGoal, ReproductiveCondition } from '@mimicare/schema';
import { Type, Transform } from 'class-transformer';

/**
 * Create Reproductive Profile Request DTO
 *
 * Used when user first sets up their reproductive health tracking.
 * Captures baseline cycle characteristics and medical history.
 *
 * FRONTEND RESPONSIBILITY:
 * - Frontend displays user-friendly insights from service response
 * - Raw clinical metrics available in "clinicalMetrics" block
 * - See ReproductiveProfileEntity for response structure
 */
export class CreateReproductiveProfileDto {
  @ApiProperty({
    description: "User's reproductive health goal (affects UI notifications)",
    enum: ReproductiveUserGoal,
    enumName: 'ReproductiveUserGoal',
    example: ReproductiveUserGoal.TRACKING_ONLY,
    default: ReproductiveUserGoal.TRACKING_ONLY,
  })
  @IsEnum(ReproductiveUserGoal, {
    message: 'Goal must be one of: TRYING_TO_CONCEIVE, AVOIDING_PREGNANCY, TRACKING_ONLY',
  })
  @IsOptional()
  reproductiveGoal?: ReproductiveUserGoal = ReproductiveUserGoal.TRACKING_ONLY;

  @ApiPropertyOptional({
    description:
      'Average menstrual cycle length in days (FIGO 2018: 24-38 normal, 21-45 trackable)',
    example: 28,
    minimum: 21,
    maximum: 45,
    type: Number,
  })
  @IsInt({ message: 'Average cycle length must be a whole number' })
  @Type(() => Number)
  @Min(21, { message: 'Cycle length must be at least 21 days' })
  @Max(45, { message: 'Cycle length cannot exceed 45 days (consult doctor if longer)' })
  @IsOptional()
  averageCycleLength?: number;

  @ApiPropertyOptional({
    description: 'Average period duration in days (typical: 3-7 days)',
    example: 5,
    minimum: 1,
    maximum: 14,
    type: Number,
  })
  @IsInt({ message: 'Period duration must be a whole number' })
  @Type(() => Number)
  @Min(1, { message: 'Period duration must be at least 1 day' })
  @Max(14, { message: 'Period duration cannot exceed 14 days (consult doctor if longer)' })
  @IsOptional()
  averagePeriodDuration?: number;

  @ApiPropertyOptional({
    description: 'User-specific luteal phase length (standard: 14 days, range: 10-17)',
    example: 14,
    minimum: 10,
    maximum: 17,
    type: Number,
  })
  @IsInt({ message: 'Luteal phase length must be a whole number' })
  @Type(() => Number)
  @Min(10, { message: 'Luteal phase must be at least 10 days (shorter may indicate defect)' })
  @Max(17, { message: 'Luteal phase cannot exceed 17 days' })
  @IsOptional()
  lutealPhaseLength?: number = 14;

  @ApiPropertyOptional({
    description: 'Whether user has irregular menstrual cycles (auto-calculated if not provided)',
    example: false,
  })
  @IsBoolean({ message: 'isIrregular must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isIrregular?: boolean = false;

  @ApiPropertyOptional({
    description: 'Diagnosed reproductive conditions (multiple selections allowed)',
    enum: ReproductiveCondition,
    enumName: 'ReproductiveCondition',
    isArray: true,
    example: [ReproductiveCondition.NONE],
  })
  @IsArray({ message: 'Diagnosed conditions must be an array' })
  @IsEnum(ReproductiveCondition, {
    each: true,
    message:
      'Invalid condition. Must be one of: PCOS, ENDOMETRIOSIS, THYROID_DISORDER, FIBROIDS, ADENOMYOSIS, PREMATURE_OVARIAN_FAILURE, NONE',
  })
  @ArrayMinSize(1, {
    message: 'At least one condition must be selected (use NONE if no conditions)',
  })
  @ArrayMaxSize(10, { message: 'Cannot select more than 10 conditions' })
  @IsOptional()
  diagnosedConditions?: ReproductiveCondition[] = [ReproductiveCondition.NONE];

  @ApiPropertyOptional({
    description:
      'Date when reproductive condition was diagnosed (ISO format: YYYY-MM-DD, will be normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2024-06-15',
  })
  @IsDateString({}, { message: 'Diagnosis date must be a valid ISO date (YYYY-MM-DD)' })
  @ValidateIf(
    (o) => o.diagnosedConditions && !o.diagnosedConditions.includes(ReproductiveCondition.NONE),
  )
  @IsOptional()
  diagnosisDate?: string;

  @ApiPropertyOptional({
    description: 'Doctor ID of treating physician (verified OBGYN)',
    example: 'cm4doc123xyz',
    maxLength: 50,
  })
  @IsString({ message: 'Doctor ID must be a string' })
  @MaxLength(50, { message: 'Doctor ID too long' })
  @IsOptional()
  treatingDoctorId?: string;

  @ApiPropertyOptional({
    description: 'Whether currently on birth control (affects ovulation prediction)',
    example: false,
  })
  @IsBoolean({ message: 'isOnBirthControl must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isOnBirthControl?: boolean = false;

  @ApiPropertyOptional({
    description: 'Type of birth control method (required if isOnBirthControl=true)',
    example: 'Combined Oral Contraceptive',
    maxLength: 100,
  })
  @IsString({ message: 'Birth control type must be a string' })
  @MaxLength(100, { message: 'Birth control type too long' })
  @ValidateIf((o) => o.isOnBirthControl === true)
  @IsOptional()
  birthControlType?: string;

  @ApiPropertyOptional({
    description: 'Whether undergoing fertility treatment (IVF, IUI, etc.)',
    example: false,
  })
  @IsBoolean({ message: 'isOnFertilityTreatment must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isOnFertilityTreatment?: boolean = false;

  @ApiPropertyOptional({
    description: 'Smoking status (affects fertility and pregnancy risk)',
    example: 'NON_SMOKER',
    maxLength: 50,
  })
  @IsString({ message: 'Smoking status must be a string' })
  @MaxLength(50, { message: 'Smoking status too long' })
  @IsOptional()
  smokingStatus?: string;

  @ApiPropertyOptional({
    description: 'Alcohol consumption level',
    example: 'MODERATE',
    maxLength: 50,
  })
  @IsString({ message: 'Alcohol consumption must be a string' })
  @MaxLength(50, { message: 'Alcohol consumption too long' })
  @IsOptional()
  alcoholConsumption?: string;

  @ApiPropertyOptional({
    description: 'Current stress level (affects cycle regularity)',
    example: 'LOW',
    maxLength: 50,
  })
  @IsString({ message: 'Stress level must be a string' })
  @MaxLength(50, { message: 'Stress level too long' })
  @IsOptional()
  stressLevel?: string;
}
