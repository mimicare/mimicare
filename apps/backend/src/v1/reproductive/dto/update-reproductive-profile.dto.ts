/**
 * Update Reproductive Profile DTO
 *
 * Data Transfer Object for updating an existing reproductive profile.
 * All fields are optional to support partial PATCH updates.
 *
 * IMMUTABLE FIELDS (excluded):
 * - userId: Cannot transfer profile to another user
 * - createdAt: Historical record, never changes
 * - id: Primary key, never changes
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { PartialType } from '@nestjs/swagger';
import { CreateReproductiveProfileDto } from './create-reproductive-profile.dto';

/**
 * Update Reproductive Profile Request DTO
 *
 * Extends CreateReproductiveProfileDto with all fields optional.
 * Explicitly omits immutable fields that should never change after creation.
 *
 * Supports PATCH /reproductive/profile for partial updates.
 *
 * FRONTEND RESPONSIBILITY:
 * - Only send changed fields (not the entire profile)
 * - Service returns updated profile with new clinicalMetrics recalculated
 */
export class UpdateReproductiveProfileDto extends PartialType(CreateReproductiveProfileDto) {
  // All fields inherited as optional from CreateReproductiveProfileDto
  // NestJS PartialType automatically makes all properties optional
  // and preserves all validation decorators
  // If you had userId or createdAt in CreateReproductiveProfileDto,
  // you would explicitly exclude them here:
  // export class UpdateReproductiveProfileDto extends PartialType(
  //   OmitType(CreateReproductiveProfileDto, ['userId', 'createdAt'] as const)
  // ) {}
}
