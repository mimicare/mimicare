import {
  calculateFertileWindow,
  isDateInFertileWindow,
  getConceptionProbability,
  daysUntilOvulation,
  getCurrentCyclePhase,
  getBestConceptionDays,
  getExtendedSafetyWindow,
  FertileWindow,
} from './fertile-window.helper';

// Mock constants to ensure test stability
jest.mock('../constants/reproductive.constants', () => ({
  REPRODUCTIVE_CONSTANTS: {
    FERTILE_WINDOW_BEFORE_OVULATION: 5,
    FERTILE_WINDOW_AFTER_OVULATION: 1,
    FERTILE_WINDOW_TOTAL_DAYS: 6,
  },
}));

describe('Fertile Window Helper', () => {
  // Reference dates for testing
  // Cycle Start: Dec 1st
  // Ovulation: Dec 15th (Day 15)
  const periodStart = new Date('2025-12-01T00:00:00.000Z');
  const ovulationDate = new Date('2025-12-15T00:00:00.000Z');

  // ==========================================================================
  // 1. CORE CALCULATION & WILCOX DISTRIBUTION
  // ==========================================================================
  describe('calculateFertileWindow (Standard)', () => {
    let result: FertileWindow;

    beforeAll(() => {
      result = calculateFertileWindow(ovulationDate, periodStart, 'TRACKING_ONLY');
    });

    it('should calculate correct start and end dates (O-5 to O+1)', () => {
      // O-5: Dec 10
      // O+1: Dec 16
      expect(result.start).toEqual(new Date('2025-12-10T00:00:00.000Z'));
      expect(result.end).toEqual(new Date('2025-12-16T00:00:00.000Z'));
    });

    it('should identify peak fertile days (O-2, O-1, O)', () => {
      expect(result.peakFertileDays).toHaveLength(3);
      expect(result.peakFertileDays[0]).toEqual(new Date('2025-12-13T00:00:00.000Z')); // O-2
      expect(result.peakFertileDays[2]).toEqual(ovulationDate); // O
    });

    it('should map daily probabilities correctly (Wilcox Distribution)', () => {
      // O-2 (Dec 13) should be 30%
      const oMinus2 = result.dailyProbabilities.find(
        (d) => d.date.toISOString() === '2025-12-13T00:00:00.000Z',
      );
      expect(oMinus2?.probability).toBe(30);
      expect(oMinus2?.label).toBe('Peak');

      // O-5 (Dec 10) should be 10%
      const oMinus5 = result.dailyProbabilities.find(
        (d) => d.date.toISOString() === '2025-12-10T00:00:00.000Z',
      );
      expect(oMinus5?.probability).toBe(10);
      expect(oMinus5?.label).toBe('Low');
    });

    it('should not flag menstrual overlap for standard cycle', () => {
      expect(result.hasMenstrualOverlap).toBe(false);
    });
  });

  // ==========================================================================
  // 2. USER GOAL CONTEXT (v1.1.0)
  // ==========================================================================
  describe('User Goal Context Labels', () => {
    it('should generate "Risk Labels" when avoiding pregnancy', () => {
      const result = calculateFertileWindow(ovulationDate, periodStart, 'AVOIDING_PREGNANCY');

      const peakDay = result.dailyProbabilities.find((d) => d.probability === 30);
      expect(peakDay?.riskLabel).toBe('Very High Risk');

      const lowDay = result.dailyProbabilities.find((d) => d.probability === 10);
      expect(lowDay?.riskLabel).toBe('Caution');
    });

    it('should NOT generate "Risk Labels" when trying to conceive', () => {
      const result = calculateFertileWindow(ovulationDate, periodStart, 'TRYING_TO_CONCEIVE');

      const peakDay = result.dailyProbabilities.find((d) => d.probability === 30);
      expect(peakDay?.riskLabel).toBeUndefined();
      expect(peakDay?.label).toBe('Peak'); // Positive framing
    });
  });

  // ==========================================================================
  // 3. NEW v1.1.0 FEATURES
  // ==========================================================================
  describe('v1.1.0 New Features', () => {
    it('getBestConceptionDays should return exactly O-2 and O-1', () => {
      const bestDays = getBestConceptionDays(calculateFertileWindow(ovulationDate, periodStart));

      expect(bestDays).toHaveLength(2);
      expect(bestDays[0]).toEqual(new Date('2025-12-13T00:00:00.000Z')); // O-2
      expect(bestDays[1]).toEqual(new Date('2025-12-14T00:00:00.000Z')); // O-1
    });

    it('getExtendedSafetyWindow should return O-7 to O+2', () => {
      const safety = getExtendedSafetyWindow(ovulationDate);

      // O-7: Dec 8
      // O+2: Dec 17
      expect(safety.start).toEqual(new Date('2025-12-08T00:00:00.000Z'));
      expect(safety.end).toEqual(new Date('2025-12-17T00:00:00.000Z'));
    });

    it('should detect Menstrual Overlap for short cycles', () => {
      // Scenario: Short cycle (21 days), Ovulation Day 7
      // Fertile Window Starts: O-5 = Day 2
      // Period Duration: 5 days
      // Overlap: Days 2, 3, 4, 5

      const shortCycleOvulation = new Date('2025-12-07T00:00:00.000Z');
      const result = calculateFertileWindow(
        shortCycleOvulation,
        periodStart, // Dec 1
        'TRACKING_ONLY',
        5, // Period lasts until Dec 5
      );

      expect(result.start).toEqual(new Date('2025-12-02T00:00:00.000Z')); // Day 2
      expect(result.hasMenstrualOverlap).toBe(true);

      // Contextual trigger
    });
  });

  // ==========================================================================
  // 4. UTILITIES
  // ==========================================================================
  describe('Utilities', () => {
    const window = calculateFertileWindow(ovulationDate, periodStart);

    it('isDateInFertileWindow should return correct boolean', () => {
      const inside = new Date('2025-12-13T00:00:00.000Z');
      const outside = new Date('2025-12-01T00:00:00.000Z');

      expect(isDateInFertileWindow(inside, window)).toBe(true);
      expect(isDateInFertileWindow(outside, window)).toBe(false);
    });

    it('getConceptionProbability should return correct %', () => {
      const peakDay = new Date('2025-12-13T00:00:00.000Z'); // O-2
      const randomDay = new Date('2025-12-01T00:00:00.000Z');

      expect(getConceptionProbability(peakDay, window)).toBe(30);
      expect(getConceptionProbability(randomDay, window)).toBe(0);
    });

    it('daysUntilOvulation should calculate difference', () => {
      const today = new Date('2025-12-10T00:00:00.000Z');
      expect(daysUntilOvulation(today, ovulationDate)).toBe(5);
    });
  });

  // ==========================================================================
  // 5. CYCLE PHASE DETECTION
  // ==========================================================================
  describe('getCurrentCyclePhase', () => {
    // Period: Dec 1-5 (5 days)
    // Ovulation: Dec 15
    // Window: Dec 14-16 (O-1 to O+1)

    it('should detect Menstrual phase (Day 3)', () => {
      const date = new Date('2025-12-03T00:00:00.000Z');
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 5)).toBe('menstrual');
    });

    it('should detect Follicular phase (Day 10)', () => {
      const date = new Date('2025-12-10T00:00:00.000Z');
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 5)).toBe('follicular');
    });

    it('should detect Ovulation phase (Day 14 / O-1)', () => {
      const date = new Date('2025-12-14T00:00:00.000Z');
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 5)).toBe('ovulation');
    });

    it('should detect Luteal phase (Day 17 / O+2)', () => {
      const date = new Date('2025-12-17T00:00:00.000Z');
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 5)).toBe('luteal');
    });

    it('should respect dynamic period duration', () => {
      // If period is 7 days, Day 6 is menstrual
      const date = new Date('2025-12-06T00:00:00.000Z');
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 7)).toBe('menstrual');

      // If period is 3 days, Day 6 is follicular
      expect(getCurrentCyclePhase(date, periodStart, ovulationDate, 3)).toBe('follicular');
    });
  });
});
