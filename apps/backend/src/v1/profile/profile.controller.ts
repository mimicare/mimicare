import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetCurrentUserId } from '../../common/decorators/user';
import { type UpdateProfileDto, type ConfirmDeleteDto, UserProfileDto } from './dto';
import { type V1ProfileService } from './profile.service';
import { AccessTokenGuard } from '../../common/guards/auth';

/**
 * V1 Profile Controller
 *
 * RESTful API endpoints for user profile management.
 * All endpoints require JWT authentication (Bearer token).
 *
 * Base Path: /v1/profile
 *
 * Endpoints:
 * - GET    /       → Get authenticated user's profile
 * - PATCH  /       → Update profile fields (partial update)
 * - DELETE /       → Delete account (GDPR-compliant)
 *
 * Gender Support:
 * - FEMALE users: Full reproductive health suite (periods, fertility, pregnancy, menopause)
 * - MALE users: Parenting, wellness, partner support features
 * - OTHER users: Inclusive health tracking with customizable features
 *
 * @class V1ProfileController
 * @version 1.0
 * @tags Profile
 */
@ApiTags('Profile')
@ApiBearerAuth()
@Controller({ path: 'profile', version: '1' })
@UseGuards(AccessTokenGuard)
export class V1ProfileController {
  constructor(private readonly profileService: V1ProfileService) {}

  /**
   * Get My Profile
   *
   * Retrieves the authenticated user's complete profile including:
   * - Basic info (name, username, email, phone, avatar, DOB, gender)
   * - Account metadata (points, streak, verification status, follower counts)
   * - Settings (language, theme, notifications, privacy)
   *
   * Sensitive fields are automatically excluded (passwordHash, googleId, tokens).
   *
   * @route GET /v1/profile
   * @auth Bearer Token (JWT)
   * @returns {UserProfileDto} Complete user profile with settings
   *
   * @example
   * GET /v1/profile
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * Response 200:
   * {
   *   "id": "abc123",
   *   "name": "Priya Sharma",
   *   "username": "priya2024",
   *   "email": "priya@example.com",
   *   "gender": "FEMALE",
   *   "followerCount": 150,
   *   "followingCount": 89,
   *   "points": 1250,
   *   "dailyLoginStreak": 7,
   *   "settings": {
   *     "preferredLanguage": "ENGLISH",
   *     "theme": "SYSTEM",
   *     "lifeStage": "REPRODUCTIVE",
   *     "pushNotifications": true
   *   }
   * }
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my profile',
    description:
      'Retrieve authenticated user profile with settings. ' +
      'Returns complete profile excluding sensitive fields like passwordHash. ' +
      'Includes social stats (follower/following counts) and gamification data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found - User may have been deleted',
  })
  async getMyProfile(@GetCurrentUserId() userId: string): Promise<UserProfileDto> {
    return this.profileService.getMyProfile(userId);
  }

  /**
   * Update Profile
   *
   * Flexible partial update endpoint - send only fields you want to change.
   * Supports updating basic profile fields and nested settings object.
   *
   * Updatable Fields:
   * - Basic: name, username, email, phoneNumber, countryCode, gender, isPrivateAccount
   * - Media: profilePictureUrl
   * - Personal: dateOfBirth
   * - Settings: language, theme, lifeStage, notifications (9 types), guardianMode
   *
   * Automatic Behaviors:
   * - Username: Normalized to lowercase
   * - Phone: Requires reverification (isPhoneVerified set to false)
   * - Uniqueness: Validates username/email/phone aren't already taken
   *
   * Gender-Aware Validation:
   * - MALE users cannot set PERIMENOPAUSE/POSTMENOPAUSE life stages
   * - FEMALE users get full reproductive health features
   * - OTHER users have flexible settings
   *
   * @route PATCH /v1/profile
   * @auth Bearer Token (JWT)
   * @body {UpdateProfileDto} Fields to update (all optional)
   * @returns {UserProfileDto} Updated profile
   *
   * @example
   * PATCH /v1/profile
   * Content-Type: application/json
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   *
   * Body (Female User):
   * {
   *   "name": "Priya Sharma",
   *   "gender": "FEMALE",
   *   "settings": {
   *     "theme": "DARK",
   *     "lifeStage": "REPRODUCTIVE",
   *     "weeklyPregnancyUpdates": true
   *   }
   * }
   *
   * Body (Male User):
   * {
   *   "name": "Rahul Sharma",
   *   "gender": "MALE",
   *   "settings": {
   *     "theme": "LIGHT",
   *     "lifeStage": "REPRODUCTIVE",
   *     "milestoneNotifications": true
   *   }
   * }
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update profile',
    description:
      'Update profile fields and/or settings. ' +
      'Partial update - send only fields you want to change. ' +
      'Validates uniqueness of username, email, and phone number. ' +
      'Enforces gender-appropriate life stage settings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid field format, validation failed, or gender mismatch for life stage',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Username, email, or phone number already in use',
  })
  async updateProfile(
    @GetCurrentUserId() userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.profileService.updateProfile(userId, dto);
  }

  /**
   * Delete Account
   *
   * Permanently deletes user account with GDPR-compliant anonymization.
   *
   * Deletion Process:
   * 1. Requires confirmation phrase "DELETE" (case-sensitive)
   * 2. Anonymizes PII: name → "Deleted User", nullifies email/phone/DOB
   * 3. Removes credentials: passwordHash, googleId, ABHA IDs
   * 4. Soft deletes: Sets deletedAt timestamp, isActive = false
   * 5. Preserves activity logs for compliance
   *
   * What Gets Deleted:
   * - Name, username, email, phone, avatar
   * - Date of birth, gender
   * - All credentials (password, Google OAuth, ABHA)
   *
   * What's Preserved:
   * - User ID (for referential integrity)
   * - Activity logs (for compliance)
   * - Posts/comments (shown as "Deleted User")
   *
   * ⚠️ WARNING: This action is irreversible!
   *
   * @route DELETE /v1/profile
   * @auth Bearer Token (JWT)
   * @body {ConfirmDeleteDto} Must contain confirmationPhrase: "DELETE"
   * @returns {{ message: string }} Success confirmation
   *
   * @example
   * DELETE /v1/profile
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   * Content-Type: application/json
   *
   * Body:
   * {
   *   "confirmationPhrase": "DELETE"
   * }
   *
   * Response 200:
   * {
   *   "message": "Account successfully deleted"
   * }
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete account',
    description:
      'Permanently delete user account (GDPR-compliant). ' +
      'Anonymizes personal data while preserving activity logs. ' +
      'Requires typing "DELETE" exactly to confirm. ' +
      '⚠️ This action is irreversible!',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid confirmation phrase or account already deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User account not found',
  })
  async deleteAccount(
    @GetCurrentUserId() userId: string,
    @Body() dto: ConfirmDeleteDto,
  ): Promise<{ message: string }> {
    return this.profileService.deleteAccount(userId, dto);
  }
}
