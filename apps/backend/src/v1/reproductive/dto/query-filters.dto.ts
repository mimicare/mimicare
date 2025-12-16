/**
 * Query Filters DTO
 *
 * Common query parameters for filtering and pagination.
 * Used across multiple endpoints for consistent API design.
 *
 * DATE HANDLING:
 * - All date filters normalized to UTC startOfDay/endOfDay in service layer
 * - Inclusive ranges (startDate ≤ x ≤ endDate)
 *
 * @module ReproductiveModule
 * @category DTO
 * @since 1.0.0
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Date Range Filter DTO
 *
 * Filter records by date range (e.g., logs, cycles, predictions).
 * Both dates are inclusive (≤ startDate AND ≤ endDate).
 */
export class DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering (inclusive, ISO format: YYYY-MM-DD, normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2025-11-01',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date (YYYY-MM-DD)' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (inclusive, ISO format: YYYY-MM-DD, normalized to UTC)',
    type: 'string',
    format: 'date',
    example: '2025-11-30',
  })
  @IsDateString({}, { message: 'End date must be a valid ISO date (YYYY-MM-DD)' })
  @IsOptional()
  endDate?: string;
}

/**
 * Pagination Query DTO
 *
 * Standard pagination parameters for list endpoints.
 * Uses page/limit (not offset/limit) for better UX.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed, e.g., page=1 for first page)',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsInt({ message: 'Page must be a whole number' })
  @Type(() => Number)
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100 for performance)',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: Number,
  })
  @IsInt({ message: 'Limit must be a whole number' })
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100 (use pagination for more)' })
  @IsOptional()
  limit?: number = 10;
}

/**
 * Cycle History Query DTO
 *
 * Query parameters for fetching cycle history with date range and pagination.
 * Defaults to last 12 cycles (1 year of data).
 */
export class CycleHistoryQueryDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Maximum number of cycles to return (sorted by startDate DESC)',
    example: 12,
    minimum: 1,
    maximum: 50,
    default: 12,
    type: Number,
  })
  @IsInt({ message: 'Limit must be a whole number' })
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(50, { message: 'Limit cannot exceed 50 (older data less relevant for prediction)' })
  @IsOptional()
  limit?: number = 12;
}

/**
 * Daily Logs Query DTO
 *
 * Query parameters for fetching daily health logs with date range.
 * Includes option to filter out empty logs (no symptoms logged).
 */
export class DailyLogsQueryDto extends DateRangeFilterDto {
  @ApiPropertyOptional({
    description: 'Include logs with no symptoms or measurements (default: false)',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'includeEmpty must be true or false' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  includeEmpty?: boolean = false;
}
