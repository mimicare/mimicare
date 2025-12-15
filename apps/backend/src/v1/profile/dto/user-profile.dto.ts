import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Gender,
  UserRole,
  CountryCode,
  PreferredLanguage,
  Theme,
  LifeStage,
} from '@mimicare/schema';

/**
 * User Settings Response DTO
 */
@Exclude()
export class UserSettingsDto {
  @Expose()
  @ApiProperty({
    enum: PreferredLanguage,
    description: 'UI language preference',
    example: PreferredLanguage.ENGLISH,
  })
  preferredLanguage!: PreferredLanguage;

  @Expose()
  @ApiProperty({
    enum: Theme,
    description: 'App theme',
    example: Theme.SYSTEM,
  })
  theme!: Theme;

  @Expose()
  @ApiPropertyOptional({
    enum: LifeStage,
    description: 'Reproductive life stage',
    nullable: true,
  })
  lifeStage!: LifeStage | null;

  @Expose()
  @ApiProperty({ description: 'Email notifications enabled' })
  emailNotifications!: boolean;

  @Expose()
  @ApiProperty({ description: 'Push notifications enabled' })
  pushNotifications!: boolean;

  @Expose()
  @ApiProperty({ description: 'Appointment reminders enabled' })
  appointmentReminders!: boolean;

  @Expose()
  @ApiProperty({ description: 'Vitals reminders enabled' })
  vitalsReminders!: boolean;

  @Expose()
  @ApiProperty({ description: 'Weekly pregnancy updates enabled' })
  weeklyPregnancyUpdates!: boolean;

  @Expose()
  @ApiProperty({ description: 'Message notifications enabled' })
  messageNotifications!: boolean;

  @Expose()
  @ApiProperty({ description: 'Vaccination reminders enabled' })
  vaccinationReminders!: boolean;

  @Expose()
  @ApiProperty({ description: 'Milestone notifications enabled' })
  milestoneNotifications!: boolean;

  @Expose()
  @ApiProperty({ description: 'Guardian mode enabled (for teen users)' })
  guardianModeEnabled!: boolean;
}

/**
 * User Profile Response DTO
 * Excludes sensitive fields (passwordHash, googleId, tokens)
 */
@Exclude()
export class UserProfileDto {
  @Expose()
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'abc123xyz789',
  })
  id!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Priya Sharma',
    nullable: true,
  })
  name!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Unique username',
    example: 'priya_health_2024',
    nullable: true,
  })
  username!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'priya@example.com',
    nullable: true,
  })
  email!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Phone number',
    example: '9876543210',
    nullable: true,
  })
  phoneNumber!: string | null;

  @Expose()
  @ApiPropertyOptional({
    enum: CountryCode,
    example: CountryCode.IN,
    nullable: true,
  })
  countryCode!: CountryCode | null;

  @Expose()
  @ApiProperty({
    description: 'Phone verification status',
    example: true,
  })
  isPhoneVerified!: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Profile picture URL',
    example: 'https://mimicare-assets.s3.amazonaws.com/profiles/priya.jpg',
    nullable: true,
  })
  profilePictureUrl!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1995-06-15',
    type: Date,
    nullable: true,
  })
  dateOfBirth!: Date | null;

  @Expose()
  @ApiPropertyOptional({
    enum: Gender,
    description: 'User gender',
    example: Gender.FEMALE,
    nullable: true,
  })
  gender!: Gender | null;

  @Expose()
  @ApiProperty({
    enum: UserRole,
    description: 'User role',
    example: UserRole.PATIENT,
  })
  role!: UserRole;

  @Expose()
  @ApiProperty({
    description: 'Private account status (requires follow approval)',
    example: false,
  })
  isPrivateAccount!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Follower count (denormalized)',
    example: 150,
  })
  followerCount!: number;

  @Expose()
  @ApiProperty({
    description: 'Following count (denormalized)',
    example: 89,
  })
  followingCount!: number;

  @Expose()
  @ApiProperty({
    description: 'Gamification points',
    example: 1250,
  })
  points!: number;

  @Expose()
  @ApiProperty({
    description: 'Daily login streak',
    example: 7,
  })
  dailyLoginStreak!: number;

  @Expose()
  @ApiProperty({
    description: 'Account verification status',
    example: false,
  })
  isVerified!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Account active status',
    example: true,
  })
  isActive!: boolean;

  @Expose()
  @ApiProperty({
    description: 'Account created timestamp',
    example: '2025-01-10T08:30:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-12-15T14:45:00.000Z',
  })
  updatedAt!: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'User settings object',
    type: () => UserSettingsDto,
  })
  settings?: UserSettingsDto;
}
