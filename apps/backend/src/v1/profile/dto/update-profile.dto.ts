import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, CountryCode, PreferredLanguage, Theme, LifeStage } from '@mimicare/schema';

/**
 * Nested Settings Update DTO
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    enum: PreferredLanguage,
    description: 'UI language preference',
    example: PreferredLanguage.ENGLISH,
  })
  @IsOptional()
  @IsEnum(PreferredLanguage)
  preferredLanguage?: PreferredLanguage;

  @ApiPropertyOptional({
    enum: Theme,
    description: 'App theme (light/dark/system)',
    example: Theme.SYSTEM,
  })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiPropertyOptional({
    enum: LifeStage,
    description:
      'Reproductive life stage for personalized content. ' +
      'Note: PUBERTY/PERIMENOPAUSE/POSTMENOPAUSE primarily for female users. ' +
      'Male users can use REPRODUCTIVE or leave null.',
    example: LifeStage.REPRODUCTIVE,
  })
  @IsOptional()
  @IsEnum(LifeStage)
  lifeStage?: LifeStage;

  @ApiPropertyOptional({ description: 'Email notifications enabled' })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications enabled' })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Appointment reminders enabled' })
  @IsOptional()
  @IsBoolean()
  appointmentReminders?: boolean;

  @ApiPropertyOptional({ description: 'Health vitals reminders enabled' })
  @IsOptional()
  @IsBoolean()
  vitalsReminders?: boolean;

  @ApiPropertyOptional({
    description: 'Weekly pregnancy updates (for pregnant users)',
  })
  @IsOptional()
  @IsBoolean()
  weeklyPregnancyUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Message notifications enabled' })
  @IsOptional()
  @IsBoolean()
  messageNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Vaccination reminders enabled' })
  @IsOptional()
  @IsBoolean()
  vaccinationReminders?: boolean;

  @ApiPropertyOptional({ description: 'Milestone notifications (for child tracking)' })
  @IsOptional()
  @IsBoolean()
  milestoneNotifications?: boolean;

  @ApiPropertyOptional({
    description: 'Guardian mode for teen users (enables parental oversight)',
  })
  @IsOptional()
  @IsBoolean()
  guardianModeEnabled?: boolean;
}

/**
 * Unified Update Profile DTO
 * All fields are optional - send only what you want to update
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Priya Sharma',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Username (alphanumeric + underscores, auto-lowercased)',
    example: 'priya_health_2024',
    pattern: '^[a-zA-Z0-9_]+$',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'priya@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Phone number (10-digit Indian mobile)',
    example: '9876543210',
    pattern: '^[6-9]\\d{9}$',
  })
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Must be a valid 10-digit Indian mobile number (starting with 6-9)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: CountryCode,
    description: 'Country code for phone number',
    example: CountryCode.IN,
  })
  @IsOptional()
  @IsEnum(CountryCode)
  countryCode?: CountryCode;

  @ApiPropertyOptional({
    description: 'Profile picture URL (AWS S3 presigned URL)',
    example: 'https://mimicare-assets.s3.amazonaws.com/profiles/abc123.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid URL format' })
  profilePictureUrl?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD format)',
    example: '1995-06-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    enum: Gender,
    description:
      'User gender. Affects content personalization: ' +
      'FEMALE users get reproductive health content, ' +
      'MALE users get parenting/wellness content, ' +
      'OTHER for non-binary users.',
    example: Gender.FEMALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Private account (requires follow approval)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivateAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Nested settings object',
    type: () => UpdateSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSettingsDto)
  settings?: UpdateSettingsDto;
}
