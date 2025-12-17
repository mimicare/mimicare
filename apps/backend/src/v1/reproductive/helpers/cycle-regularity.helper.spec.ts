import {
  analyzeCycleRegularity,
  isCycleRegular,
  getRegularityDescription,
  getCycleRegularityClinicalSummary,
} from './cycle-regularity.helper';

// Mock constants to ensure test determinism regardless of external config changes
jest.mock('../constants/reproductive.constants', () => ({
  REPRODUCTIVE_CONSTANTS: {
    CYCLE_VARIABILITY_THRESHOLD: 7,
    AVERAGE_CYCLE_LENGTH: 28,
    IDEAL_CYCLES_FOR_PREDICTION: 6, // Threshold for HIGH confidence
    MAX_CYCLES_FOR_ANALYSIS: 12,
    PCOS_MARKERS: {
      minCycleLength: 35,
    },
  },
}));

describe('Cycle Regularity Analysis Helper', () => {
  // ==========================================================================
  // 1. INPUT VALIDATION & DEFAULTS
  // ==========================================================================
  describe('Input Validation', () => {
    it('should return default analysis for empty input', () => {
      const result = analyzeCycleRegularity([]);
      expect(result.cycleCount).toBe(0);
      expect(result.classification).toBe('REGULAR'); // Optimistic default
      expect(result.predictionConfidence).toBe('LOW');
    });

    it('should filter out biologically impossible cycles (<15 or >90 days)', () => {
      // Input includes 10 (too short) and 100 (too long)
      const input = [28, 29, 10, 100, 30];
      const result = analyzeCycleRegularity(input);

      expect(result.cycleCount).toBe(3); // Only 28, 29, 30 are valid
      expect(result.averageCycle).toBe(29);
      expect(result.shortestCycle).toBe(28);
      expect(result.longestCycle).toBe(30);
    });
  });

  // ==========================================================================
  // 2. STATISTICAL CALCULATIONS
  // ==========================================================================
  describe('Statistical Metrics', () => {
    it('should calculate correct Mean, Median, and SD', () => {
      // Data: 26, 28, 30
      // Mean: 28
      // Median: 28
      // SD: sqrt(((26-28)^2 + (28-28)^2 + (30-28)^2)/3) = sqrt((4+0+4)/3) = sqrt(2.66) ≈ 1.63
      const result = analyzeCycleRegularity([26, 28, 30]);

      expect(result.averageCycle).toBe(28);
      expect(result.medianCycle).toBe(28);
      expect(result.standardDeviation).toBeCloseTo(1.63, 2);
    });

    it('should calculate correct Median for even number of cycles', () => {
      // Data: 28, 30. Median = (28+30)/2 = 29
      const result = analyzeCycleRegularity([28, 30]);
      expect(result.medianCycle).toBe(29);
    });
  });

  // ==========================================================================
  // 3. OUTLIER HANDLING (The "Trim" Logic)
  // ==========================================================================
  describe('Outlier-Robust Variability', () => {
    it('should uses raw max-min for < 6 cycles', () => {
      // 5 cycles. Range 28-35. Variability should be 7.
      const result = analyzeCycleRegularity([28, 28, 28, 28, 35]);
      expect(result.variability).toBe(7);
      expect(result.cycleCount).toBe(5);
    });

    it('should trim the largest outlier for >= 6 cycles', () => {
      // 6 cycles. Sorted: 28, 28, 28, 28, 29, 45 (Stress cycle)
      // Logic: Trim 45. New Max 29. Min 28. Variability = 1.
      const result = analyzeCycleRegularity([28, 45, 28, 28, 29, 28]);

      expect(result.cycleCount).toBe(6);
      expect(result.longestCycle).toBe(45); // Metric keeps raw data
      expect(result.variability).toBe(1); // Calculation uses trimmed data
      expect(result.isRegular).toBe(true);
    });
  });

  // ==========================================================================
  // 4. AGE-ADJUSTED THRESHOLDS (FIGO 2020)
  // ==========================================================================
  describe('Age-Adjusted Regularity Thresholds', () => {
    // Standard Threshold: 7 days
    // Adolescent/Perimenopause Threshold: 9 days

    it('should use 7-day threshold for prime reproductive age (30)', () => {
      // Variability 8 days (28 to 36).
      // For age 30, limit is 7. Should be IRREGULAR.
      const result = analyzeCycleRegularity([28, 36], 30);
      expect(result.variability).toBe(8);
      expect(result.isRegular).toBe(false);
      expect(result.classification).toBe('IRREGULAR');
    });

    it('should use 9-day threshold for adolescents (16)', () => {
      // Variability 8 days (28 to 36).
      // For age 16, limit is 9. Should be REGULAR.
      const result = analyzeCycleRegularity([28, 36], 16);
      expect(result.variability).toBe(8);
      expect(result.isRegular).toBe(true);
      expect(result.classification).toBe('REGULAR'); // Falls into 5-9 bucket, but passes boolean check
    });

    it('should use 9-day threshold for perimenopause (44)', () => {
      // Variability 9 days (25 to 34).
      // For age 44, limit is 9. Should be REGULAR.
      const result = analyzeCycleRegularity([25, 34], 44);
      expect(result.variability).toBe(9);
      expect(result.isRegular).toBe(true);
    });
  });

  // ==========================================================================
  // 5. REGULARITY CLASSIFICATION TIERS
  // ==========================================================================
  describe('Classification Tiers', () => {
    it('should classify VERY_REGULAR (<= 4 days)', () => {
      const result = analyzeCycleRegularity([28, 30]); // Var: 2
      expect(result.classification).toBe('VERY_REGULAR');
    });

    it('should classify REGULAR (5-7 days)', () => {
      const result = analyzeCycleRegularity([28, 34]); // Var: 6
      expect(result.classification).toBe('REGULAR');
    });

    it('should classify IRREGULAR (8-19 days)', () => {
      const result = analyzeCycleRegularity([25, 35]); // Var: 10
      expect(result.classification).toBe('IRREGULAR');
    });

    it('should classify HIGHLY_IRREGULAR (>= 20 days)', () => {
      const result = analyzeCycleRegularity([25, 50]); // Var: 25
      expect(result.classification).toBe('HIGHLY_IRREGULAR');
    });
  });

  // ==========================================================================
  // 6. HEALTH FLAG DETECTION (FIGO 2018)
  // ==========================================================================
  describe('Health Flag Detection', () => {
    it('should detect Possible PCOS (High Variability + Long Cycles)', () => {
      // Var: 20 (30 to 50). 50% of cycles > 35.
      const result = analyzeCycleRegularity([30, 50, 32, 45]);
      expect(result.healthFlags.possiblePCOS).toBe(true);
      expect(result.healthFlags.infrequentBleeding).toBe(false);
    });

    it('should detect Infrequent Bleeding (>38 days)', () => {
      // 75% cycles > 38 days
      const result = analyzeCycleRegularity([40, 42, 45, 28]);
      expect(result.healthFlags.infrequentBleeding).toBe(true);
      expect(result.healthFlags.possiblePCOS).toBe(true); // Usually overlaps
    });

    it('should detect Frequent Bleeding (<24 days)', () => {
      // 75% cycles < 24 days
      const result = analyzeCycleRegularity([21, 22, 23, 28]);
      expect(result.healthFlags.frequentBleeding).toBe(true);
    });

    it('should detect Absent Bleeding (Amenorrhea)', () => {
      // >90 days since last period provided as 3rd arg
      const result = analyzeCycleRegularity([28, 28], 30, 95);
      expect(result.healthFlags.absentBleeding).toBe(true);
    });

    it('should NOT flag amenorrhea if <90 days', () => {
      const result = analyzeCycleRegularity([28, 28], 30, 45);
      expect(result.healthFlags.absentBleeding).toBe(false);
    });
  });

  // ==========================================================================
  // 7. PREDICTION CONFIDENCE
  // ==========================================================================
  describe('Prediction Confidence', () => {
    it('should have HIGH confidence for >=6 regular cycles', () => {
      // 6 cycles, very regular
      const result = analyzeCycleRegularity([28, 28, 28, 28, 28, 28]);
      expect(result.predictionConfidence).toBe('HIGH');
    });

    it('should have MEDIUM confidence for <6 regular cycles', () => {
      const result = analyzeCycleRegularity([28, 28, 28]);
      expect(result.predictionConfidence).toBe('MEDIUM');
    });

    it('should have MEDIUM confidence for >=6 irregular cycles', () => {
      // 6 cycles, irregular (var 10)
      const result = analyzeCycleRegularity([28, 38, 28, 38, 28, 38]);
      expect(result.predictionConfidence).toBe('MEDIUM');
    });

    it('should have LOW confidence for highly irregular cycles', () => {
      // High irregularity
      const result = analyzeCycleRegularity([28, 60]);
      expect(result.predictionConfidence).toBe('LOW');
    });
  });

  // ==========================================================================
  // 8. TEXT GENERATORS
  // ==========================================================================
  describe('Text Generators', () => {
    describe('isCycleRegular (Utility)', () => {
      it('should return true for regular patterns', () => {
        expect(isCycleRegular([28, 29, 30], 30)).toBe(true);
      });

      it('should return false for irregular patterns', () => {
        expect(isCycleRegular([25, 40], 30)).toBe(false);
      });

      it('should default to true if insufficient data', () => {
        expect(isCycleRegular([28])).toBe(true);
      });
    });

    describe('getRegularityDescription', () => {
      it('should return specific message for Amenorrhea', () => {
        const result = analyzeCycleRegularity([], 30, 95); // 95 days late
        const text = getRegularityDescription(result);
        expect(text).toContain('over 90 days');
        expect(text).toContain('indicate amenorrhea');
      });

      it('should return CVD risk warning for Highly Irregular', () => {
        const result = analyzeCycleRegularity([25, 60]);
        const text = getRegularityDescription(result);
        expect(text).toContain('cardiovascular risk');
        expect(text).toContain('JAMA 2022');
      });
    });

    describe('getCycleRegularityClinicalSummary', () => {
      it('should format clinical string correctly', () => {
        const result = analyzeCycleRegularity([28, 29, 30, 31, 28, 45]);
        // 6 cycles -> outlier robust -> trim 45. Max 31, Min 28. Var = 3.
        const summary = getCycleRegularityClinicalSummary(result);

        expect(summary).toContain('Classification: VERY_REGULAR');
        expect(summary).toContain('Variability: 3d (outlier-robust)');
        expect(summary).toContain('Cycles: 6');
      });

      it('should list health flags', () => {
        const result = analyzeCycleRegularity([20, 21, 22, 23]);
        const summary = getCycleRegularityClinicalSummary(result);
        expect(summary).toContain('Flags: frequent bleeding (<24d)');
      });
    });
  });
});
