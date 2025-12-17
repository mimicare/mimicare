/**
 * ============================================================================
 * CYCLE CALCULATOR HELPER - UNIT TESTS
 * ============================================================================
 *
 * Tests for menstrual cycle calculation functions.
 * Validates mathematical accuracy and clinical compliance.
 *
 * Test Coverage:
 * - Cycle length calculations
 * - Average/median/weighted averages (Float precision validated)
 * - Period predictions (PCOS friendly limits)
 * - Ovulation calculations
 * - Fertile window generation
 * - Date validations (Timezone safe)
 * - Edge case handling
 *
 * Medical References:
 * - FIGO 2018: Cycle length 24-38 days [Ref 5]
 * - Luteal phase: 14 ± 2 days [Ref 2]
 * - Fertile window: 6 days (O-5 to O+1) [Ref 1]
 *
 * @category Testing
 * @since 1.1.1
 */

import {
  calculateCycleLength,
  detectGhostCycle,
  calculateAverageCycleLength,
  calculateMedianCycleLength,
  calculateWeightedAverageCycleLength,
  predictNextPeriodStart,
  calculateOvulationDate,
  calculateFertileWindow,
  calculatePeriodDuration,
  calculateCycleDay,
  isValidLoggingDate,
  generateCycleDays,
  FertileWindow,
} from './cycle-calculator.helper';

describe('Cycle Calculator Helper', () => {
  // ============================================================================
  // CYCLE LENGTH CALCULATIONS
  // ============================================================================

  describe('calculateCycleLength', () => {
    it('should calculate correct cycle length for standard 28-day cycle', () => {
      const start1 = new Date('2025-12-01');
      const start2 = new Date('2025-12-29');

      expect(calculateCycleLength(start1, start2)).toBe(28);
    });

    it('should calculate correct cycle length for short cycle (21 days)', () => {
      const start1 = new Date('2025-12-01');
      const start2 = new Date('2025-12-22');

      expect(calculateCycleLength(start1, start2)).toBe(21);
    });

    it('should calculate correct cycle length for long cycle (35 days)', () => {
      const start1 = new Date('2025-12-01');
      const start2 = new Date('2026-01-05');

      expect(calculateCycleLength(start1, start2)).toBe(35);
    });

    it('should calculate correct cycle length for irregular cycle (45 days)', () => {
      const start1 = new Date('2025-12-01');
      const start2 = new Date('2026-01-15');

      expect(calculateCycleLength(start1, start2)).toBe(45);
    });

    it('should throw error if second date is before first date', () => {
      const start1 = new Date('2025-12-29');
      const start2 = new Date('2025-12-01');

      expect(() => calculateCycleLength(start1, start2)).toThrow(
        'Second period start date must be after first period start date',
      );
    });

    it('should throw error if both dates are the same', () => {
      const date = new Date('2025-12-01');

      expect(() => calculateCycleLength(date, date)).toThrow();
    });

    it('should handle dates that span year boundary', () => {
      const start1 = new Date('2025-12-20');
      const start2 = new Date('2026-01-17');

      expect(calculateCycleLength(start1, start2)).toBe(28);
    });

    it('should warn for very short cycles (<21 days)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const start1 = new Date('2025-12-01');
      const start2 = new Date('2025-12-16'); // 15 days

      calculateCycleLength(start1, start2);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('below normal range'));

      consoleSpy.mockRestore();
    });

    it('should warn for very long cycles (>45 days)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const start1 = new Date('2025-12-01');
      const start2 = new Date('2026-02-01'); // 62 days

      calculateCycleLength(start1, start2);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('above normal range'));

      consoleSpy.mockRestore();
    });
  });

  describe('detectGhostCycle', () => {
    it('should detect ghost cycle when length is 2x average', () => {
      expect(detectGhostCycle(56, 28)).toBe(true); // Exactly 2x
    });

    it('should detect ghost cycle when length is 1.9x average', () => {
      expect(detectGhostCycle(53, 28)).toBe(true); // 1.89x
    });

    it('should not detect ghost cycle for normal variation', () => {
      expect(detectGhostCycle(30, 28)).toBe(false); // Within range
      expect(detectGhostCycle(35, 28)).toBe(false);
    });

    it('should not detect ghost cycle when length is 3x average', () => {
      expect(detectGhostCycle(84, 28)).toBe(false); // Too long (3x)
    });

    it('should handle edge case at lower bound (1.7x)', () => {
      expect(detectGhostCycle(48, 28)).toBe(true); // 1.71x (just inside)
      expect(detectGhostCycle(47, 28)).toBe(false); // 1.68x (just outside)
    });

    it('should handle edge case at upper bound (2.3x)', () => {
      expect(detectGhostCycle(64, 28)).toBe(true); // 2.29x (just inside)
      expect(detectGhostCycle(65, 28)).toBe(false); // 2.32x (just outside)
    });
  });

  // ============================================================================
  // AVERAGE CALCULATIONS
  // ============================================================================

  describe('calculateAverageCycleLength', () => {
    it('should calculate correct average for regular cycles', () => {
      expect(calculateAverageCycleLength([28, 29, 27, 30])).toBe(29);
    });

    it('should return default 28 days for empty array', () => {
      expect(calculateAverageCycleLength([])).toBe(28);
    });

    it('should round to nearest integer', () => {
      expect(calculateAverageCycleLength([28, 29, 30])).toBe(29); // 29 exactly
      expect(calculateAverageCycleLength([27, 28, 29, 30])).toBe(29); // 28.5 rounds to 29
    });

    it('should handle single cycle', () => {
      expect(calculateAverageCycleLength([32])).toBe(32);
    });

    it('should be affected by outliers', () => {
      // This demonstrates average is sensitive to outliers
      expect(calculateAverageCycleLength([28, 28, 28, 60])).toBe(36);
    });

    it('should use only last 12 cycles if more provided', () => {
      const manyCycles = Array(20).fill(28);
      manyCycles[0] = 50; // Old outlier
      manyCycles[19] = 30; // Recent cycle

      const result = calculateAverageCycleLength(manyCycles);

      // Should not include the first outlier (50)
      expect(result).toBeCloseTo(28, 0);
    });
  });

  describe('calculateMedianCycleLength', () => {
    it('should calculate correct median for odd number of cycles', () => {
      expect(calculateMedianCycleLength([27, 28, 29])).toBe(28);
    });

    it('should calculate correct median for even number of cycles', () => {
      expect(calculateMedianCycleLength([27, 28, 29, 30])).toBe(29); // Average of 28 & 29
    });

    it('should return default 28 days for empty array', () => {
      expect(calculateMedianCycleLength([])).toBe(28);
    });

    it('should not be affected by outliers (robust)', () => {
      // Median ignores outliers
      expect(calculateMedianCycleLength([28, 28, 28, 60])).toBe(28);
    });

    it('should handle unsorted input correctly', () => {
      expect(calculateMedianCycleLength([30, 27, 29, 28])).toBe(29); // Sorts to [27,28,29,30]
    });

    it('should handle single cycle', () => {
      expect(calculateMedianCycleLength([32])).toBe(32);
    });

    it('should handle two cycles', () => {
      expect(calculateMedianCycleLength([28, 30])).toBe(29); // Average of both
    });
  });

  describe('calculateWeightedAverageCycleLength', () => {
    it('should weight most recent cycle highest (50%)', () => {
      const result = calculateWeightedAverageCycleLength([28, 29, 30]);

      // Expected: 28*0.2 + 29*0.3 + 30*0.5 = 5.6 + 8.7 + 15 = 29.3
      // UPDATED v1.1.1: We now expect 29.3 (float), not 29 (rounded)
      expect(result).toBeCloseTo(29.3, 1);
    });

    it('should return default 28 for empty array', () => {
      expect(calculateWeightedAverageCycleLength([])).toBe(28);
    });

    it('should fall back to median for <3 cycles', () => {
      expect(calculateWeightedAverageCycleLength([28])).toBe(28);
      expect(calculateWeightedAverageCycleLength([28, 30])).toBe(29);
    });

    it('should use only last 3 cycles when more provided', () => {
      const result = calculateWeightedAverageCycleLength([20, 25, 28, 29, 30]);

      // Should only use [28, 29, 30] -> 29.3
      expect(result).toBeCloseTo(29.3, 1);
    });

    it('should favor recent cycles over old cycles', () => {
      const result1 = calculateWeightedAverageCycleLength([30, 29, 28]); // Decreasing trend (Recent 28)
      // 30*0.2 + 29*0.3 + 28*0.5 = 6 + 8.7 + 14 = 28.7

      const result2 = calculateWeightedAverageCycleLength([28, 29, 30]); // Increasing trend (Recent 30)
      // 28*0.2 + 29*0.3 + 30*0.5 = 5.6 + 8.7 + 15 = 29.3

      expect(result1).toBeLessThan(result2); // 28.7 < 29.3
    });
  });

  // ============================================================================
  // PERIOD PREDICTION
  // ============================================================================

  describe('predictNextPeriodStart', () => {
    it('should predict next period correctly for 28-day cycle', () => {
      const lastPeriod = new Date('2025-12-01');
      const predicted = predictNextPeriodStart(lastPeriod, 28);

      expect(predicted).toEqual(new Date('2025-12-29'));
    });

    it('should predict next period correctly for 32-day cycle', () => {
      const lastPeriod = new Date('2025-12-01');
      const predicted = predictNextPeriodStart(lastPeriod, 32);

      expect(predicted).toEqual(new Date('2026-01-02'));
    });

    it('should handle year boundary correctly', () => {
      const lastPeriod = new Date('2025-12-20');
      const predicted = predictNextPeriodStart(lastPeriod, 28);

      expect(predicted).toEqual(new Date('2026-01-17'));
    });

    it('should throw error for cycle length <21 days', () => {
      const lastPeriod = new Date('2025-12-01');

      expect(() => predictNextPeriodStart(lastPeriod, 15)).toThrow('Invalid cycle length');
    });

    it('should throw error for cycle length >90 days', () => {
      const lastPeriod = new Date('2025-12-01');

      expect(() => predictNextPeriodStart(lastPeriod, 100)).toThrow('Invalid cycle length');
    });

    it('should accept minimum valid cycle length (21 days)', () => {
      const lastPeriod = new Date('2025-12-01');
      const predicted = predictNextPeriodStart(lastPeriod, 21);

      expect(predicted).toEqual(new Date('2025-12-22'));
    });

    it('should accept maximum valid cycle length (90 days)', () => {
      // UPDATED v1.1.1: Now supports long cycles (PCOS) up to 90 days
      const lastPeriod = new Date('2025-12-01');
      const predicted = predictNextPeriodStart(lastPeriod, 90);

      // Dec 1 + 90 days = March 1st 2026 (non-leap year)
      expect(predicted).toEqual(new Date('2026-03-01'));
    });
  });

  // ============================================================================
  // OVULATION CALCULATIONS
  // ============================================================================

  describe('calculateOvulationDate', () => {
    it('should calculate ovulation 14 days before period (default luteal phase)', () => {
      const periodStart = new Date('2025-12-29');
      const ovulation = calculateOvulationDate(periodStart);

      expect(ovulation).toEqual(new Date('2025-12-15'));
    });

    it('should accept custom luteal phase length', () => {
      const periodStart = new Date('2025-12-29');
      const ovulation = calculateOvulationDate(periodStart, 12);

      expect(ovulation).toEqual(new Date('2025-12-17')); // 29 - 12
    });

    it('should handle 16-day luteal phase (long but normal)', () => {
      const periodStart = new Date('2025-12-29');
      const ovulation = calculateOvulationDate(periodStart, 16);

      expect(ovulation).toEqual(new Date('2025-12-13')); // 29 - 16
    });

    it('should warn and use default for abnormally short luteal phase (<10)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const periodStart = new Date('2025-12-29');
      const ovulation = calculateOvulationDate(periodStart, 8);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('outside normal range'));
      expect(ovulation).toEqual(new Date('2025-12-15')); // Uses default 14

      consoleSpy.mockRestore();
    });

    it('should warn and use default for abnormally long luteal phase (>18)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const periodStart = new Date('2025-12-29');
      const ovulation = calculateOvulationDate(periodStart, 20);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('outside normal range'));
      expect(ovulation).toEqual(new Date('2025-12-15')); // Uses default 14

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // FERTILE WINDOW CALCULATIONS
  // ============================================================================

  describe('calculateFertileWindow', () => {
    it('should calculate 6-day fertile window correctly', () => {
      const ovulation = new Date('2025-12-15');
      const window: FertileWindow = calculateFertileWindow(ovulation);

      expect(window.start).toEqual(new Date('2025-12-10')); // O-5
      expect(window.end).toEqual(new Date('2025-12-16')); // O+1
      expect(window.peak).toEqual(new Date('2025-12-13')); // O-2
      expect(window.ovulation).toEqual(ovulation);
    });

    it('should calculate peak fertility 2 days before ovulation', () => {
      const ovulation = new Date('2025-12-20');
      const window = calculateFertileWindow(ovulation);

      expect(window.peak).toEqual(new Date('2025-12-18'));
    });

    it('should handle fertile window spanning year boundary', () => {
      const ovulation = new Date('2026-01-03');
      const window = calculateFertileWindow(ovulation);

      expect(window.start).toEqual(new Date('2025-12-29')); // O-5 (last year)
      expect(window.end).toEqual(new Date('2026-01-04')); // O+1 (new year)
    });

    it('should calculate window span of exactly 6 days', () => {
      const ovulation = new Date('2025-12-15');
      const window = calculateFertileWindow(ovulation);

      const windowDays = Math.floor(
        (window.end.getTime() - window.start.getTime()) / (24 * 60 * 60 * 1000),
      );

      expect(windowDays).toBe(6);
    });
  });

  // ============================================================================
  // PERIOD DURATION & CYCLE DAY
  // ============================================================================

  describe('calculatePeriodDuration', () => {
    it('should calculate correct duration for 5-day period', () => {
      const start = new Date('2025-12-01');
      const end = new Date('2025-12-05');

      expect(calculatePeriodDuration(start, end)).toBe(5);
    });

    it('should include both start and end days (inclusive)', () => {
      const start = new Date('2025-12-01');
      const end = new Date('2025-12-01'); // Same day

      expect(calculatePeriodDuration(start, end)).toBe(1);
    });

    it('should throw error if end date is before start date', () => {
      const start = new Date('2025-12-05');
      const end = new Date('2025-12-01');

      expect(() => calculatePeriodDuration(start, end)).toThrow(
        'Period end date cannot be before start date',
      );
    });

    it('should warn for abnormally long periods (>8 days)', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const start = new Date('2025-12-01');
      const end = new Date('2025-12-10'); // 10 days

      calculatePeriodDuration(start, end);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Heavy Menstrual Bleeding'));

      consoleSpy.mockRestore();
    });

    it('should handle normal 7-day period without warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const start = new Date('2025-12-01');
      const end = new Date('2025-12-07');

      const duration = calculatePeriodDuration(start, end);

      expect(duration).toBe(7);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('calculateCycleDay', () => {
    it('should return 1 for period start date', () => {
      const periodStart = new Date('2025-12-01');
      const cycleDay = calculateCycleDay(periodStart, new Date('2025-12-01'));

      expect(cycleDay).toBe(1);
    });

    it('should calculate correct cycle day 15', () => {
      const periodStart = new Date('2025-12-01');
      const cycleDay = calculateCycleDay(periodStart, new Date('2025-12-15'));

      expect(cycleDay).toBe(15);
    });

    it('should calculate cycle day 28 (last day of cycle)', () => {
      const periodStart = new Date('2025-12-01');
      const cycleDay = calculateCycleDay(periodStart, new Date('2025-12-28'));

      expect(cycleDay).toBe(28);
    });

    it('should use today as default current date', () => {
      const periodStart = new Date();
      const cycleDay = calculateCycleDay(periodStart);

      expect(cycleDay).toBe(1); // Today is cycle day 1
    });

    it('should throw error if current date is before period start', () => {
      const periodStart = new Date('2025-12-15');
      const currentDate = new Date('2025-12-01');

      expect(() => calculateCycleDay(periodStart, currentDate)).toThrow(
        'Current date cannot be before period start date',
      );
    });

    it('should handle cycle day calculation across month boundary', () => {
      const periodStart = new Date('2025-12-20');
      const cycleDay = calculateCycleDay(periodStart, new Date('2026-01-05'));

      expect(cycleDay).toBe(17); // 20-31 (12 days) + 1-5 (5 days) = 17
    });
  });

  // ============================================================================
  // DATE VALIDATION (Timezone-Fixed)
  // ============================================================================

  describe('isValidLoggingDate', () => {
    // FIXED: Use Local Time constructors (new Date(y,m,d)) instead of ISO strings (UTC)
    // This aligns with `startOfDay()` logic in the helper which uses local system time.
    // Month is 0-indexed (11 = Dec, 0 = Jan).
    const today = new Date(2025, 11, 17); // Dec 17 2025 Local

    it('should accept today as valid', () => {
      expect(isValidLoggingDate(today, today)).toBe(true);
    });

    it('should accept recent past dates (within 365 days)', () => {
      const recent = new Date(2025, 11, 1); // Dec 1 2025 Local
      expect(isValidLoggingDate(recent, today)).toBe(true);
    });

    it('should accept dates exactly 365 days ago', () => {
      const oneYearAgo = new Date(2024, 11, 17); // Dec 17 2024 Local
      // 365 days exactly. Should pass.
      expect(isValidLoggingDate(oneYearAgo, today)).toBe(true);
    });

    it('should reject future dates', () => {
      const future = new Date(2025, 11, 25); // Dec 25 2025 Local
      expect(isValidLoggingDate(future, today)).toBe(false);
    });

    it('should reject dates >365 days ago', () => {
      const tooOld = new Date(2024, 10, 1); // Nov 1 2024 Local
      expect(isValidLoggingDate(tooOld, today)).toBe(false);
    });

    it('should use current date as default reference', () => {
      const now = new Date();
      // Ensure we subtract more than a few ms to be safe from execution delays
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      expect(isValidLoggingDate(yesterday)).toBe(true);
    });

    it('should handle year boundary correctly', () => {
      const current = new Date(2026, 0, 15); // Jan 15 2026
      const lastYear = new Date(2025, 1, 1); // Feb 1 2025 (Within 1 year)
      expect(isValidLoggingDate(lastYear, current)).toBe(true);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('generateCycleDays', () => {
    it('should generate correct number of days for 28-day cycle', () => {
      const start = new Date('2025-12-01');
      const days = generateCycleDays(start, 28);

      expect(days).toHaveLength(28);
      expect(days[0]).toEqual(new Date('2025-12-01'));
      expect(days[27]).toEqual(new Date('2025-12-28'));
    });

    it('should generate correct dates in sequence', () => {
      const start = new Date('2025-12-01');
      const days = generateCycleDays(start, 5);

      expect(days[0]).toEqual(new Date('2025-12-01'));
      expect(days[1]).toEqual(new Date('2025-12-02'));
      expect(days[2]).toEqual(new Date('2025-12-03'));
      expect(days[3]).toEqual(new Date('2025-12-04'));
      expect(days[4]).toEqual(new Date('2025-12-05'));
    });

    it('should handle cycle spanning year boundary', () => {
      const start = new Date('2025-12-25');
      const days = generateCycleDays(start, 10);

      expect(days[0]).toEqual(new Date('2025-12-25'));
      expect(days[6]).toEqual(new Date('2025-12-31')); // Last day of year
      expect(days[7]).toEqual(new Date('2026-01-01')); // First day of new year
      expect(days[9]).toEqual(new Date('2026-01-03'));
    });

    it('should return empty array for 0-day cycle', () => {
      const start = new Date('2025-12-01');
      const days = generateCycleDays(start, 0);

      expect(days).toHaveLength(0);
    });

    it('should handle single-day cycle', () => {
      const start = new Date('2025-12-01');
      const days = generateCycleDays(start, 1);

      expect(days).toHaveLength(1);
      expect(days[0]).toEqual(start);
    });
  });
});
