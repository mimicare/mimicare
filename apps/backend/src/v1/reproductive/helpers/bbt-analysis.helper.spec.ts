/**
 * ============================================================================
 * BBT ANALYSIS HELPER - UNIT TESTS
 * ============================================================================
 *
 * Tests for basal body temperature pattern analysis and ovulation detection.
 * Validates Sensiplan-compliant algorithm implementation.
 *
 * Test Coverage:
 * - Thermal shift detection (3 over 6 rule)
 * - Pattern classification (biphasic, monophasic, atypical)
 * - Confidence calculation
 * - Source-aware validation (oral, vaginal, wearable)
 * - Edge case handling (insufficient data, invalid inputs)
 * - Statistical calculations (average, standard deviation)
 * - User-facing descriptions
 * - Clinical summaries
 *
 * Medical References:
 * - Sensiplan 99.6% effectiveness [Ref 7]
 * - 70% biphasic detection rate [Ref 1]
 * - 84.8% positive predictive value [Ref 4]
 *
 * @category Testing
 * @since 1.0.0
 */

import {
  analyzeBBTPattern,
  isValidBBT,
  getBBTPatternDescription,
  getBBTClinicalSummary,
  BBTReading,
} from './bbt-analysis.helper';

describe('BBT Analysis Helper', () => {
  // ============================================================================
  // TEST DATA FIXTURES
  // ============================================================================

  /**
   * Generate typical biphasic cycle (28 days with ovulation on day 14)
   * Follicular phase: 36.2-36.3°C
   * Luteal phase: 36.6-36.7°C (0.4°C shift)
   */
  const generateBiphasicCycle = (): BBTReading[] => {
    const readings: BBTReading[] = [];
    const baseDate = new Date('2025-12-01');

    // Follicular phase (Days 1-13): Lower temperatures
    for (let i = 0; i < 13; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 36.2 + Math.random() * 0.1, // 36.2-36.3°C
      });
    }

    // Thermal shift (Days 14-28): Higher temperatures
    for (let i = 13; i < 28; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 36.6 + Math.random() * 0.1, // 36.6-36.7°C
      });
    }

    return readings;
  };

  /**
   * Generate monophasic cycle (no temperature shift - anovulatory)
   * Flat pattern: 36.2-36.3°C throughout
   */
  const generateMonophasicCycle = (): BBTReading[] => {
    const readings: BBTReading[] = [];
    const baseDate = new Date('2025-12-01');

    for (let i = 0; i < 28; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 36.2 + Math.random() * 0.1, // Flat 36.2-36.3°C
      });
    }

    return readings;
  };

  /**
   * Generate atypical cycle (shift detected but classified as ATYPICAL due to short luteal phase)
   *
   * Sensiplan "3 over 6" rule requirements:
   * - 6-day baseline must all be BELOW the shift
   * - Day 1 of shift: > MAX(baseline)
   * - Day 2 of shift: > MAX(baseline)
   * - Day 3 of shift: ≥ MAX(baseline) + 0.2°C
   *
   * Classification as ATYPICAL:
   * - Thermal shift IS detected (satisfies 3-over-6)
   * - BUT luteal phase < 10 days (short luteal phase defect)
   */
  const generateAtypicalCycle = (): BBTReading[] => {
    const readings: BBTReading[] = [];
    const baseDate = new Date('2025-12-01');

    // Follicular phase (Days 1-14): Consistent 36.0°C baseline
    // Need at least 6 consistent readings before shift for proper baseline
    for (let i = 0; i < 14; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 36.0, // Fixed baseline (no random variation)
      });
    }

    // Thermal shift detected (Days 15-17): Must satisfy "3 over 6" rule
    // maxBaseline = 36.0 (from readings 8-13)
    // Coverline = 36.0 + 0.05 = 36.05

    // Day 1 of shift (index 14): Must be > 36.0
    readings.push({
      date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      temperature: 36.3, // > 36.0 ✓
    });

    // Day 2 of shift (index 15): Must be > 36.0
    readings.push({
      date: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
      temperature: 36.3, // > 36.0 ✓
    });

    // Day 3 of shift (index 16): Must be ≥ 36.0 + 0.2 = 36.2
    readings.push({
      date: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000),
      temperature: 36.5, // ≥ 36.2 ✓ (well above threshold)
    });

    // Short luteal phase continues (Days 18-21): Only 8 days total luteal phase
    // This triggers ATYPICAL classification (< 10 days minimum)
    for (let i = 17; i < 22; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 36.4, // Sustained elevation
      });
    }

    // Total: 22 readings
    // Follicular: 14 readings (indices 0-13) at 36.0°C
    // Luteal: 8 readings (indices 14-21) at 36.3-36.5°C
    // Shift detected at index 14, luteal phase = 8 days < 10 → ATYPICAL

    return readings;
  };

  /**
   * Generate wearable device readings (Apple Watch/Oura Ring)
   * Distal skin temperature: 1-2°C lower than oral BBT
   */
  const generateWearableCycle = (): BBTReading[] => {
    const readings: BBTReading[] = [];
    const baseDate = new Date('2025-12-01');

    // Follicular: 34.5-34.6°C
    for (let i = 0; i < 13; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 34.5 + Math.random() * 0.1,
      });
    }

    // Luteal: 34.9-35.0°C (0.4°C shift)
    for (let i = 13; i < 28; i++) {
      readings.push({
        date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
        temperature: 34.9 + Math.random() * 0.1,
      });
    }

    return readings;
  };

  // ============================================================================
  // MAIN ANALYSIS FUNCTION TESTS
  // ============================================================================

  describe('analyzeBBTPattern', () => {
    describe('Biphasic Pattern Detection', () => {
      it('should detect biphasic pattern with clear thermal shift (≥0.2°C)', () => {
        const readings = generateBiphasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.isBiphasic).toBe(true);
        expect(result.pattern).toBe('BIPHASIC');
        expect(result.temperatureShift).toBeGreaterThanOrEqual(0.2);
        expect(result.confidence).toMatch(/HIGH|MEDIUM/);
        expect(result.estimatedOvulationDate).toBeDefined();
        expect(result.thermalShiftDay).toBeDefined();
        expect(result.coverline).toBeGreaterThan(0);
      });

      it('should calculate ovulation date as 1 day before thermal shift', () => {
        const readings = generateBiphasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        // Thermal shift should be around day 14 (index 13)
        const dayDiff = Math.abs(
          (result.thermalShiftDay!.getTime() - result.estimatedOvulationDate!.getTime()) /
            (24 * 60 * 60 * 1000),
        );

        expect(dayDiff).toBe(1); // Ovulation 1 day before thermal shift
      });

      it('should calculate follicular and luteal phase averages correctly', () => {
        const readings = generateBiphasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.follicularPhaseAvg).toBeLessThan(result.lutealPhaseAvg!);
        expect(result.follicularPhaseAvg).toBeGreaterThanOrEqual(36.0);
        expect(result.follicularPhaseAvg).toBeLessThanOrEqual(36.5);
        expect(result.lutealPhaseAvg).toBeGreaterThanOrEqual(36.4);
        expect(result.lutealPhaseAvg).toBeLessThanOrEqual(37.0);
      });

      it('should calculate coverline as MAX(baseline) + 0.05°C (Sensiplan)', () => {
        const readings = generateBiphasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        // Coverline should be slightly above follicular average
        expect(result.coverline).toBeGreaterThan(result.follicularPhaseAvg!);
        expect(result.coverline! - result.follicularPhaseAvg!).toBeGreaterThanOrEqual(0.05);
      });

      it('should mark clear shift in quality flags', () => {
        const readings = generateBiphasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.qualityFlags.clearShift).toBe(true);
        expect(result.qualityFlags.sufficientReadings).toBe(true);
      });
    });

    describe('Monophasic Pattern Detection', () => {
      it('should detect monophasic pattern when no thermal shift exists', () => {
        const readings = generateMonophasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.isBiphasic).toBe(false);
        expect(result.pattern).toBe('MONOPHASIC');
        expect(result.temperatureShift).toBeNull();
        expect(result.estimatedOvulationDate).toBeNull();
        expect(result.thermalShiftDay).toBeNull();
        expect(result.coverline).toBeNull();
      });

      it('should return LOW confidence for monophasic pattern', () => {
        const readings = generateMonophasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.confidence).toBe('LOW');
      });

      it('should mark no clear shift in quality flags', () => {
        const readings = generateMonophasicCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.qualityFlags.clearShift).toBe(false);
      });
    });

    describe('Atypical Pattern Detection', () => {
      it('should detect atypical pattern for weak thermal shift or short luteal phase', () => {
        const readings = generateAtypicalCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.isBiphasic).toBe(false);
        expect(result.pattern).toBe('ATYPICAL');

        // Thermal shift IS detected (satisfies 3-over-6), but pattern is ATYPICAL
        // due to short luteal phase (8 days < 10 day minimum)
        expect(result.thermalShiftDay).toBeDefined();
        expect(result.estimatedOvulationDate).toBeDefined();
      });

      it('should return MEDIUM or LOW confidence for atypical pattern', () => {
        const readings = generateAtypicalCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.confidence).toMatch(/MEDIUM|LOW/);
      });
    });

    describe('Edge Cases & Error Handling', () => {
      it('should return INSUFFICIENT_DATA for empty readings array', () => {
        const result = analyzeBBTPattern([], new Date('2025-12-01'), 'ORAL');

        expect(result.pattern).toBe('INSUFFICIENT_DATA');
        expect(result.isBiphasic).toBe(false);
        expect(result.qualityFlags.sufficientReadings).toBe(false);
      });

      it('should return INSUFFICIENT_DATA for <10 readings', () => {
        const readings = generateBiphasicCycle().slice(0, 9); // Only 9 readings
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.pattern).toBe('INSUFFICIENT_DATA');
        expect(result.qualityFlags.sufficientReadings).toBe(false);
      });

      it('should handle null/undefined readings array gracefully', () => {
        const result1 = analyzeBBTPattern(null as any, new Date('2025-12-01'), 'ORAL');
        const result2 = analyzeBBTPattern(undefined as any, new Date('2025-12-01'), 'ORAL');

        expect(result1.pattern).toBe('INSUFFICIENT_DATA');
        expect(result2.pattern).toBe('INSUFFICIENT_DATA');
      });

      it('should filter out invalid readings (NaN temperature)', () => {
        const readings = generateBiphasicCycle();
        readings[5].temperature = NaN; // Inject invalid reading
        readings[10].temperature = NaN;

        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        // Should still analyze remaining valid readings
        expect(result.pattern).not.toBe('INSUFFICIENT_DATA');
      });

      it('should filter out invalid dates', () => {
        const readings = generateBiphasicCycle();
        readings[5].date = new Date('invalid'); // Invalid date

        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        // Should continue with valid readings only
        expect(result.pattern).not.toBe('INSUFFICIENT_DATA');
      });

      it('should sort readings chronologically before analysis', () => {
        const readings = generateBiphasicCycle();
        // Shuffle readings (simulate out-of-order data entry)
        const shuffled = [...readings].sort(() => Math.random() - 0.5);

        const result1 = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
        const result2 = analyzeBBTPattern(shuffled, new Date('2025-12-01'), 'ORAL');

        // Results should be identical regardless of input order
        expect(result1.pattern).toBe(result2.pattern);
        expect(result1.isBiphasic).toBe(result2.isBiphasic);
      });
    });

    describe('Confidence Scoring', () => {
      it('should return HIGH confidence for strong shift (≥0.3°C) with 10+ day luteal phase', () => {
        const readings: BBTReading[] = [];
        const baseDate = new Date('2025-12-01');

        // Follicular: 36.0°C (13 days)
        for (let i = 0; i < 13; i++) {
          readings.push({
            date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
            temperature: 36.0,
          });
        }

        // Luteal: 36.4°C (15 days) - 0.4°C shift
        for (let i = 13; i < 28; i++) {
          readings.push({
            date: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
            temperature: 36.4,
          });
        }

        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.confidence).toBe('HIGH');
        expect(result.temperatureShift).toBeGreaterThanOrEqual(0.3);
      });

      it('should return LOW confidence when abnormal readings detected', () => {
        const readings = generateBiphasicCycle();
        // Inject fever readings
        readings[5].temperature = 38.5; // Fever
        readings[10].temperature = 39.0; // High fever
        readings[15].temperature = 38.8;

        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');

        expect(result.confidence).toBe('LOW');
        expect(result.qualityFlags.abnormalValues.length).toBeGreaterThan(0);
      });
    });

    describe('Source-Aware Validation (Wearable Devices)', () => {
      it('should accept lower temperatures for wearable devices', () => {
        const readings = generateWearableCycle(); // 34.5-35.0°C range
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'WEARABLE');

        expect(result.pattern).not.toBe('INSUFFICIENT_DATA');
        expect(result.qualityFlags.abnormalValues.length).toBe(0);
      });

      it('should detect biphasic pattern in wearable device data', () => {
        const readings = generateWearableCycle();
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'WEARABLE');

        expect(result.isBiphasic).toBe(true);
        expect(result.pattern).toBe('BIPHASIC');
      });

      it('should flag oral-range temperatures as abnormal for wearable source', () => {
        const readings = generateBiphasicCycle(); // Oral temps (36.2-36.7°C)
        const result = analyzeBBTPattern(readings, new Date('2025-12-01'), 'WEARABLE');

        // Oral temps are too high for wearable (skin temp should be 33-36°C)
        expect(result.qualityFlags.abnormalValues.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // VALIDATION HELPER TESTS
  // ============================================================================

  describe('isValidBBT', () => {
    describe('Oral/Vaginal/Rectal Validation', () => {
      it('should accept normal oral BBT range (35.0-38.0°C)', () => {
        expect(isValidBBT(35.0, 'ORAL')).toBe(true);
        expect(isValidBBT(36.2, 'ORAL')).toBe(true);
        expect(isValidBBT(36.8, 'ORAL')).toBe(true);
        expect(isValidBBT(38.0, 'ORAL')).toBe(true);
      });

      it('should reject temperatures below 35.0°C for oral', () => {
        expect(isValidBBT(34.9, 'ORAL')).toBe(false);
        expect(isValidBBT(30.0, 'ORAL')).toBe(false);
      });

      it('should reject temperatures above 38.0°C for oral (fever)', () => {
        expect(isValidBBT(38.1, 'ORAL')).toBe(false);
        expect(isValidBBT(40.0, 'ORAL')).toBe(false);
      });

      it('should default to ORAL validation when no source specified', () => {
        expect(isValidBBT(36.5)).toBe(true); // No source = ORAL
        expect(isValidBBT(34.5)).toBe(false); // Too low for oral
      });
    });

    describe('Wearable Device Validation', () => {
      it('should accept normal wearable range (33.0-36.0°C)', () => {
        expect(isValidBBT(33.0, 'WEARABLE')).toBe(true);
        expect(isValidBBT(34.5, 'WEARABLE')).toBe(true);
        expect(isValidBBT(35.5, 'WEARABLE')).toBe(true);
        expect(isValidBBT(36.0, 'WEARABLE')).toBe(true);
      });

      it('should reject temperatures below 33.0°C for wearable', () => {
        expect(isValidBBT(32.9, 'WEARABLE')).toBe(false);
        expect(isValidBBT(30.0, 'WEARABLE')).toBe(false);
      });

      it('should reject temperatures above 36.0°C for wearable', () => {
        expect(isValidBBT(36.1, 'WEARABLE')).toBe(false);
        expect(isValidBBT(37.0, 'WEARABLE')).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should reject NaN', () => {
        expect(isValidBBT(NaN, 'ORAL')).toBe(false);
        expect(isValidBBT(NaN, 'WEARABLE')).toBe(false);
      });

      it('should reject non-number types', () => {
        expect(isValidBBT('36.5' as any, 'ORAL')).toBe(false);
        expect(isValidBBT(null as any, 'ORAL')).toBe(false);
        expect(isValidBBT(undefined as any, 'ORAL')).toBe(false);
      });

      it('should reject Infinity', () => {
        expect(isValidBBT(Infinity, 'ORAL')).toBe(false);
        expect(isValidBBT(-Infinity, 'ORAL')).toBe(false);
      });
    });
  });

  // ============================================================================
  // USER-FACING DESCRIPTION TESTS
  // ============================================================================

  describe('getBBTPatternDescription', () => {
    it('should return detailed description for biphasic pattern', () => {
      const readings = generateBiphasicCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const description = getBBTPatternDescription(analysis);

      expect(description).toContain('Biphasic pattern detected');
      expect(description).toContain('temperature shift');
      expect(description).toContain('ovulation');
      expect(description).toContain('Confidence');
      expect(description).toContain('Coverline');
      expect(description).toContain('84.8%'); // Positive predictive value
      expect(description).toContain('99.6%'); // Sensiplan effectiveness
    });

    it('should return guidance for monophasic pattern', () => {
      const readings = generateMonophasicCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const description = getBBTPatternDescription(analysis);

      expect(description).toContain('Monophasic pattern');
      expect(description).toContain('anovulatory');
      expect(description).toContain('consult a healthcare provider');
      expect(description).toContain('20%'); // False negative rate
    });

    it('should return actionable advice for atypical pattern', () => {
      const readings = generateAtypicalCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const description = getBBTPatternDescription(analysis);

      expect(description).toContain('Atypical');
      expect(description).toContain('not a clear biphasic pattern');
      expect(description).toContain('ovulation predictor kits');
      expect(description).toContain('3+ hours of uninterrupted sleep');
    });

    it('should return tracking instructions for insufficient data', () => {
      const analysis = analyzeBBTPattern([], new Date('2025-12-01'), 'ORAL');
      const description = getBBTPatternDescription(analysis);

      expect(description).toContain('Not enough BBT readings');
      expect(description).toContain('Minimum 10 readings required');
      expect(description).toContain('same time each morning');
      expect(description).toContain('wearable devices');
    });

    it('should handle null/undefined analysis gracefully', () => {
      const description = getBBTPatternDescription(null as any);

      expect(description).toBe('BBT pattern analysis unavailable.');
    });
  });

  // ============================================================================
  // CLINICAL SUMMARY TESTS
  // ============================================================================

  describe('getBBTClinicalSummary', () => {
    it('should return pipe-delimited clinical data for biphasic pattern', () => {
      const readings = generateBiphasicCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const summary = getBBTClinicalSummary(analysis);

      expect(summary).toContain('Pattern: BIPHASIC');
      expect(summary).toContain('Follicular:');
      expect(summary).toContain('Luteal:');
      expect(summary).toContain('Shift:');
      expect(summary).toContain('Coverline:');
      expect(summary).toContain('Confidence:');
      expect(summary).toContain('°C');
      expect(summary).toContain('|'); // Pipe delimiter
    });

    it('should include quality issues in summary when present', () => {
      const readings = generateBiphasicCycle();
      readings[5].temperature = 39.0; // Fever
      readings[10].temperature = 38.5;
      readings[15].temperature = 40.0;

      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const summary = getBBTClinicalSummary(analysis);

      expect(summary).toContain('Quality Issues:');
      expect(summary).toContain('abnormal readings');
      expect(summary).toContain('fever');
    });

    it('should show "Data Quality: Good" when no issues', () => {
      const readings = generateBiphasicCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const summary = getBBTClinicalSummary(analysis);

      expect(summary).toContain('Data Quality: Good');
    });

    it('should indicate insufficient data in summary', () => {
      const analysis = analyzeBBTPattern([], new Date('2025-12-01'), 'ORAL');
      const summary = getBBTClinicalSummary(analysis);

      expect(summary).toContain('Pattern: INSUFFICIENT_DATA');
      expect(summary).toContain('insufficient data (<10)');
    });

    it('should handle null/undefined analysis gracefully', () => {
      const summary = getBBTClinicalSummary(null as any);

      expect(summary).toBe('No BBT data available for clinical review.');
    });

    it('should mention Sensiplan method in coverline reference', () => {
      const readings = generateBiphasicCycle();
      const analysis = analyzeBBTPattern(readings, new Date('2025-12-01'), 'ORAL');
      const summary = getBBTClinicalSummary(analysis);

      expect(summary).toContain('Sensiplan');
    });
  });
});
