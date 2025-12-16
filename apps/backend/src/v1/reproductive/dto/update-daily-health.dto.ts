/**
 * Update Daily Health DTO
 *
 * Data Transfer Object for updating an existing daily health log.
 * All fields optional to support partial updates.
 *
 * IMMUTABLE FIELDS (excluded):
 * - logDate: Cannot change the date of an existing log (delete and recreate instead)
 * - userId: Log ownership never changes
 * - createdAt: Historical record
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { PartialType, OmitType } from '@nestjs/swagger';
import { LogDailyHealthDto } from './log-daily-health.dto';

/**
 * Update Daily Health Request DTO
 *
 * Extends LogDailyHealthDto but omits logDate (cannot change the date of an existing log).
 * Supports PATCH /reproductive/daily-log/:id for updating symptoms/notes.
 *
 * FRONTEND RESPONSIBILITY:
 * - If user wants to change the date, delete and recreate the log
 * - Only send fields that changed (not the entire log)
 */
export class UpdateDailyHealthDto extends PartialType(
  OmitType(LogDailyHealthDto, ['logDate'] as const),
) {
  // All fields inherited as optional except logDate
  // logDate is omitted because you can't change the date of an existing log
  // All validation decorators preserved from LogDailyHealthDto
}
