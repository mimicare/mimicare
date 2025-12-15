import { Module } from '@nestjs/common';
import { V1ProfileController } from './profile.controller';
import { V1ProfileService } from './profile.service';

/**
 * V1 Profile Module
 *
 * Provides user profile management endpoints:
 * - GET /v1/profile → Retrieve profile
 * - PATCH /v1/profile → Update profile
 * - DELETE /v1/profile → Delete account
 *
 * Features:
 * - Gender-aware content personalization
 * - Instagram-style social stats (followers/following)
 * - GDPR-compliant account deletion
 * - Multi-language support (English, Hindi, Tamil)
 * - Comprehensive notification settings
 *
 * @module V1ProfileModule
 */
@Module({
  controllers: [V1ProfileController],
  providers: [V1ProfileService],
  exports: [V1ProfileService],
})
export class V1ProfileModule {}
