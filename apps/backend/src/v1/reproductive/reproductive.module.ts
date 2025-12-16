/**
 * ============================================================================
 * REPRODUCTIVE HEALTH MODULE
 * ============================================================================
 *
 * Feature module for comprehensive reproductive health tracking including:
 * - Menstrual cycle tracking and prediction
 * - Ovulation detection and fertile window calculation
 * - Basal body temperature (BBT) analysis
 * - Daily health logging and symptom tracking
 * - PCOS/Endometriosis/fertility condition management
 *
 * ARCHITECTURE:
 * - Controller: RESTful API endpoints
 * - Service: Business logic and data processing
 * - DTOs: Request validation and data transfer
 * - Entities: Response serialization
 * - Helpers: Pure calculation functions
 *
 * AUTHENTICATION:
 * All endpoints require JWT authentication via AccessTokenGuard.
 * User context is injected via @GetCurrentUserId() decorator.
 *
 * GENDER SUPPORT:
 * - FEMALE users: Full reproductive health suite
 * - MALE users: Partner support features
 * - OTHER users: Inclusive tracking options
 *
 * DEPENDENCIES:
 * - PrismaModule: Database access
 * - Global guards: AccessTokenGuard (JWT)
 * - Global interceptors: ResponseInterceptor, ClassSerializerInterceptor
 *
 * @module V1ReproductiveModule
 * @category Feature
 * @since 1.0.0
 * @author Mimicare Development Team
 * @lastUpdated 2025-12-16
 */

import { Module } from '@nestjs/common';
import { V1ReproductiveController } from './reproductive.controller';
import { V1ReproductiveService } from './reproductive.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Reproductive Health Module
 *
 * Provides comprehensive reproductive health tracking capabilities:
 *
 * Features:
 * - Profile Management: Initial setup, medical history, lifestyle factors
 * - Period Tracking: Start/end dates, flow intensity, symptoms
 * - Daily Logging: BBT, cervical mucus, mood, pain, activity
 * - Cycle Prediction: Calendar method, BBT analysis, multi-modal
 * - Ovulation Detection: Thermal shift analysis, fertile window
 * - Statistics: Cycle regularity, average lengths, trends
 * - Health Alerts: Irregular cycles, long cycles, amenorrhea
 *
 * Algorithms:
 * - Calendar Median Method (FIGO 2018 compliant)
 * - BBT Thermal Shift Detection
 * - Luteal Phase Learning (self-adjusting)
 * - Cycle Regularity Analysis
 * - Confidence Scoring (HIGH/MEDIUM/LOW)
 *
 * Performance Optimizations:
 * - Database-level aggregations (Prisma)
 * - Selective field fetching
 * - Pagination support (30/12 items per page)
 * - Upsert strategy for predictions (prevents duplicates)
 * - Transaction-safe multi-step operations
 *
 * Medical Compliance:
 * - FIGO 2018: Menstrual cycle definitions
 * - ACOG: Menstruation as vital sign
 * - ISO 8601: Date/time formatting
 * - GDPR: Privacy-first data handling
 *
 * API Endpoints:
 * - GET    /v1/reproductive/dashboard → Main home screen data
 * - POST   /v1/reproductive/profile → Create profile (onboarding)
 * - GET    /v1/reproductive/profile → Retrieve profile
 * - PATCH  /v1/reproductive/profile → Update profile
 * - POST   /v1/reproductive/daily-logs → Log daily health
 * - GET    /v1/reproductive/daily-logs → Get logs (paginated)
 * - PATCH  /v1/reproductive/daily-logs/:id → Update log
 * - POST   /v1/reproductive/cycles/start → Start period
 * - PATCH  /v1/reproductive/cycles/:id/end → End period
 * - GET    /v1/reproductive/cycles → Get cycle history
 * - GET    /v1/reproductive/cycles/active → Get current period
 * - POST   /v1/reproductive/predictions → Generate prediction
 * - GET    /v1/reproductive/predictions → Get predictions
 * - GET    /v1/reproductive/fertile-window → Get fertile window
 * - GET    /v1/reproductive/next-period → Get next period date
 *
 * @class V1ReproductiveModule
 */
@Module({
  imports: [
    PrismaModule, // Database access
  ],
  controllers: [
    V1ReproductiveController, // REST API endpoints
  ],
  providers: [
    V1ReproductiveService, // Business logic
  ],
  exports: [
    V1ReproductiveService, // Export for other modules (e.g., NotificationsModule, DoctorModule)
  ],
})
export class V1ReproductiveModule {}
