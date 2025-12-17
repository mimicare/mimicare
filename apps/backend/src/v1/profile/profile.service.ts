import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ActivityType, CountryCode, Prisma, Gender, LifeStage } from '@mimicare/schema';
import { type UpdateProfileDto, type ConfirmDeleteDto, UserProfileDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * V1 Profile Service
 *
 * Handles all user profile management operations including:
 * - Profile retrieval with settings
 * - Partial profile updates (name, username, email, phone, avatar, DOB, gender)
 * - Settings management (language, theme, notifications, privacy)
 * - GDPR-compliant account deletion (soft delete with PII anonymization)
 *
 * Security Features:
 * - Username/email/phone uniqueness validation
 * - Case-insensitive username matching
 * - Phone reverification on update
 * - Activity logging for audit trails
 * - Gender-aware life stage validation
 *
 * @class V1ProfileService
 * @injectable
 */
@Injectable()
export class V1ProfileService {
  private readonly logger = new Logger(V1ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get authenticated user's complete profile
   *
   * Retrieves user profile including all settings. Excludes soft-deleted accounts.
   * Uses class-transformer to exclude sensitive fields (passwordHash, googleId, etc.)
   *
   * @param {string} userId - Authenticated user's unique identifier from JWT
   * @returns {Promise<UserProfileDto>} Complete user profile with settings
   * @throws {NotFoundException} When user not found or account deleted
   * @throws {InternalServerErrorException} When database query fails
   *
   * @example
   * const profile = await profileService.getMyProfile('abc123xyz789');
   * // Returns: { id, name, email, followerCount, settings: { theme, language, ... }, ... }
   */
  async getMyProfile(userId: string): Promise<UserProfileDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        include: { settings: true },
      });

      if (!user) {
        this.logger.warn(`Profile not found for user: ${userId}`);
        throw new NotFoundException('User profile not found or has been deleted');
      }

      this.logger.log(`Profile retrieved successfully for user: ${userId}`);
      return plainToInstance(UserProfileDto, user, { excludeExtraneousValues: true });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Failed to retrieve profile for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile and/or settings
   *
   * Performs partial update - only provided fields are updated.
   * Validates uniqueness constraints for username, email, and phone.
   * Automatically lowercases username and requires phone reverification.
   *
   * Gender-Aware Validation:
   * - Blocks male users from setting PERIMENOPAUSE/POSTMENOPAUSE/PUBERTY
   * - Allows flexibility for non-binary users
   *
   * Supported Fields:
   * - Basic: name, username, email, phone, countryCode, avatar, DOB, gender, isPrivateAccount
   * - Settings: language, theme, lifeStage, notifications (9 types), guardianMode
   *
   * @param {string} userId - Authenticated user's unique identifier
   * @param {UpdateProfileDto} dto - Fields to update (all optional)
   * @returns {Promise<UserProfileDto>} Updated user profile with settings
   *
   * @throws {ConflictException} When username/email/phone already in use
   * @throws {BadRequestException} When validation fails (invalid format or gender mismatch)
   * @throws {InternalServerErrorException} When database operation fails
   *
   * @example
   * // Update name only
   * await profileService.updateProfile(userId, { name: 'Priya Sharma' });
   *
   * @example
   * // Update multiple fields + settings
   * await profileService.updateProfile(userId, {
   *   name: 'Priya',
   *   username: 'priya2024',
   *   gender: 'FEMALE',
   *   settings: { theme: 'DARK', lifeStage: 'REPRODUCTIVE', pushNotifications: false }
   * });
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileDto> {
    const {
      settings,
      dateOfBirth,
      username,
      email,
      phoneNumber,
      countryCode,
      gender,
      ...profileFields
    } = dto;

    try {
      // ===== FETCH CURRENT USER (for gender validation) =====

      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { gender: true },
      });

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // ===== GENDER-AWARE LIFE STAGE VALIDATION =====

      if (settings?.lifeStage) {
        const userGender = gender || currentUser.gender; // Use new gender or existing

        // Define female-specific life stages (typed as LifeStage[] to fix TypeScript error)
        const femaleOnlyStages: LifeStage[] = [
          LifeStage.PERIMENOPAUSE,
          LifeStage.POSTMENOPAUSE,
          LifeStage.PUBERTY,
        ];

        // Block male users from setting female-specific life stages
        if (userGender === Gender.MALE && femaleOnlyStages.includes(settings.lifeStage)) {
          this.logger.warn(
            `Male user ${userId} attempted to set life stage: ${settings.lifeStage}`,
          );
          throw new BadRequestException(
            `Life stage "${settings.lifeStage}" is not applicable for male users. ` +
              `Please use "REPRODUCTIVE" or leave blank.`,
          );
        }
      }

      // ===== UNIQUENESS VALIDATIONS =====

      // Username uniqueness check (case-insensitive)
      if (username) {
        const existing = await this.prisma.user.findFirst({
          where: {
            username: { equals: username, mode: 'insensitive' },
            id: { not: userId },
            deletedAt: null,
          },
        });

        if (existing) {
          this.logger.warn(`Username conflict: ${username} already taken`);
          throw new ConflictException(
            `Username "${username}" is already taken. Please choose another one.`,
          );
        }
      }

      // Email uniqueness check
      if (email) {
        const existing = await this.prisma.user.findFirst({
          where: {
            email,
            id: { not: userId },
            deletedAt: null,
          },
        });

        if (existing) {
          this.logger.warn(`Email conflict: ${email} already in use`);
          throw new ConflictException(
            'This email address is already associated with another account.',
          );
        }
      }

      // Phone number uniqueness check (with country code)
      if (phoneNumber) {
        const targetCountryCode = countryCode || CountryCode.IN;
        const existing = await this.prisma.user.findFirst({
          where: {
            countryCode: targetCountryCode,
            phoneNumber,
            id: { not: userId },
            deletedAt: null,
          },
        });

        if (existing) {
          this.logger.warn(
            `Phone conflict: +${targetCountryCode} ${phoneNumber} already registered`,
          );
          throw new ConflictException(
            'This phone number is already registered with another account.',
          );
        }
      }

      // ===== BUILD UPDATE DATA =====

      const updateData: any = {
        ...profileFields,
        ...(username && { username: username.toLowerCase() }), // Normalize to lowercase
        ...(email && { email }),
        ...(gender && { gender }),
        ...(phoneNumber && {
          phoneNumber,
          isPhoneVerified: false, // Require reverification for security
        }),
        ...(countryCode && { countryCode }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      };

      // ===== UPDATE USER PROFILE =====

      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      this.logger.log(`Profile updated for user ${userId}: ${Object.keys(dto).join(', ')}`);

      // ===== UPDATE SETTINGS (IF PROVIDED) =====

      if (settings && Object.keys(settings).length > 0) {
        await this.prisma.userSetting.upsert({
          where: { userId },
          create: { userId, ...settings },
          update: settings,
        });

        this.logger.log(`Settings updated for user ${userId}: ${Object.keys(settings).join(', ')}`);
      }

      // ===== ACTIVITY LOGGING =====

      await this.logActivity(userId, ActivityType.LOGIN, {
        action: 'profile_updated',
        updatedFields: Object.keys(dto),
        timestamp: new Date().toISOString(),
      });

      // ===== FETCH & RETURN UPDATED PROFILE =====

      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true },
      });

      if (!updatedUser) {
        throw new InternalServerErrorException('Failed to retrieve updated profile');
      }

      return plainToInstance(UserProfileDto, updatedUser, { excludeExtraneousValues: true });
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation (fallback)
          this.logger.error(`Unique constraint violation during profile update:`, error);
          throw new ConflictException('A field with this value already exists');
        }
      }

      this.logger.error(`Failed to update profile for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to update profile. Please try again.');
    }
  }

  /**
   * Delete user account (GDPR-compliant soft delete)
   *
   * Performs soft deletion by:
   * 1. Anonymizing PII (name, email, phone, DOB, avatar, credentials)
   * 2. Setting deletedAt timestamp
   * 3. Deactivating account (isActive = false)
   * 4. Preserving activity logs for compliance
   *
   * IMPORTANT: This is irreversible. User must type "DELETE" exactly to confirm.
   *
   * @param {string} userId - User ID to delete
   * @param {ConfirmDeleteDto} dto - Must contain confirmationPhrase: "DELETE"
   * @returns {Promise<{ message: string }>} Success confirmation message
   *
   * @throws {BadRequestException} When confirmation phrase is incorrect
   * @throws {NotFoundException} When user not found
   * @throws {InternalServerErrorException} When deletion fails
   *
   * @example
   * await profileService.deleteAccount(userId, { confirmationPhrase: 'DELETE' });
   * // Returns: { message: 'Account successfully deleted' }
   */
  async deleteAccount(userId: string, dto: ConfirmDeleteDto): Promise<{ message: string }> {
    // Validate confirmation phrase (case-sensitive)
    if (dto.confirmationPhrase !== 'DELETE') {
      this.logger.warn(`Invalid delete confirmation for user ${userId}`);
      throw new BadRequestException(
        'Account deletion failed. Please type "DELETE" exactly (all caps) to confirm.',
      );
    }

    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User account not found');
      }

      if (user.deletedAt) {
        this.logger.warn(`Attempted to delete already deleted account: ${userId}`);
        throw new BadRequestException('This account has already been deleted');
      }

      // Perform GDPR-compliant anonymization
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted User',
          username: null,
          email: null,
          phoneNumber: null,
          profilePictureUrl: null,
          dateOfBirth: null,
          passwordHash: null,
          googleId: null,
          abhaAddress: null,
          abhaId: null,
          deletedAt: new Date(),
          isActive: false,
        },
      });

      this.logger.log(`Account deleted successfully for user: ${userId}`);

      // Log deletion for audit trail
      await this.logActivity(userId, ActivityType.LOGIN, {
        action: 'account_deleted',
        timestamp: new Date().toISOString(),
        reason: 'user_initiated',
      });

      return { message: 'Account successfully deleted' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete account for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to delete account. Please contact support.');
    }
  }

  /**
   * Log user activity for audit trail
   *
   * Creates activity log entry with timestamp and details.
   * Used for compliance, debugging, and user behavior analytics.
   *
   * @private
   * @param {string} userId - User ID performing the action
   * @param {ActivityType} activityType - Type of activity (enum from schema)
   * @param {any} details - Additional context (stored as JSONB)
   * @returns {Promise<void>}
   *
   * @example
   * await this.logActivity(userId, ActivityType.LOGIN, {
   *   action: 'profile_updated',
   *   updatedFields: ['name', 'email', 'gender']
   * });
   */
  private async logActivity(
    userId: string,
    activityType: ActivityType,
    details: any,
  ): Promise<void> {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId,
          activityType,
          details,
        },
      });
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.error(`Failed to log activity for user ${userId}:`, error);
    }
  }
}
