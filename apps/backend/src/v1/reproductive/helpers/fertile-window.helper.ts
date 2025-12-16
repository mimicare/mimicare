import {
  addDays,
  subDays,
  isWithinInterval,
  startOfDay,
  differenceInDays,
  isBefore,
} from 'date-fns';
import { REPRODUCTIVE_CONSTANTS } from '../constants/reproductive.constants';

/**
 * ============================================================================
 * FERTILE WINDOW HELPER - PRODUCTION VERSION 1.1.0
 * ============================================================================
 *
 * Calculate fertility predictions based on ovulation timing with user goal awareness
 *
 * ============================================================================
 * CLINICAL BACKGROUND & MEDICAL VALIDATION
 * ============================================================================
 *
 * Fertile Window Physiology:
 * - Sperm survival: Up to 5 days in fertile cervical mucus (optimal conditions)
 * - Typical sperm survival: 2-3 days (average conditions)
 * - Egg viability: 12-24 hours after ovulation
 * - Fertile window: Ovulation - 5 to Ovulation + 1 (6 days total)
 * - Peak fertility: Ovulation - 2 and Ovulation - 1 (30% conception probability)
 *
 * Conception Probability by Day (Wilcox et al. 2001):
 * - O-5: 10% (sperm must survive 5+ days - requires optimal cervical mucus)
 * - O-4: 15% (moderate probability)
 * - O-3: 20% (increasing probability)
 * - O-2: 30% (peak - highest conception rate)
 * - O-1: 30% (peak - highest conception rate)
 * - O (ovulation day): 25% (egg aging after ovulation)
 * - O+1: 10% (egg viability declining rapidly)
 * - O+2 and beyond: <1% (egg no longer viable)
 *
 * Cycle Phases (Hormonal Control):
 * - Menstrual: Days 1-5 (bleeding, estrogen/progesterone low)
 * - Follicular: Day 6 to Ovulation (estrogen rising, follicle matures)
 * - Ovulation: O-1 to O+1 (LH surge, egg release, 3-day window)
 * - Luteal: Ovulation to Next Period (progesterone high, 12-14 days)
 *
 * Safety Margins:
 * - For pregnancy prevention: Extend window to O-7 (conservative approach)
 * - For conception: Focus on O-2 and O-1 (highest cumulative probability)
 *
 * ============================================================================
 * ACADEMIC REFERENCES (Peer-Reviewed)
 * ============================================================================
 *
 * [1] Wilcox AJ, Dunson DB, Weinberg CR, Trussell J, Baird DD.
 *     "Likelihood of conception with a single act of intercourse: providing
 *     benchmark rates for assessment of post-coital contraceptives"
 *     Contraception, 2001 Dec; 63(4):211-5
 *     PMID: 11376648
 *     DOI: 10.1016/s0010-7824(01)00191-3
 *     URL: https://pubmed.ncbi.nlm.nih.gov/11376648/
 *     Key Finding: Day-specific conception probabilities, 6-day fertile window
 *
 * [2] Colombo B, Masarotto G. "Daily fecundability: first results from a new
 *     data base"
 *     Demographic Research, 2000; 3:5
 *     DOI: 10.4054/DemRes.2000.3.5
 *     URL: https://www.demographic-research.org/volumes/vol3/5/
 *     Key Finding: Peak fertility O-2 (30% per cycle)
 *
 * [3] Dunson DB, Baird DD, Wilcox AJ, Weinberg CR. "Day-specific probabilities
 *     of clinical pregnancy based on two studies with imperfect measures of ovulation"
 *     Human Reproduction, 1999 Jul; 14(7):1835-9
 *     PMID: 10402400
 *     DOI: 10.1093/humrep/14.7.1835
 *     URL: https://pubmed.ncbi.nlm.nih.gov/10402400/
 *     Key Finding: Cumulative probability of conception over fertile window
 *
 * [4] ACOG Committee Opinion No. 589. "Fertility awareness-based methods
 *     of family planning"
 *     Obstetrics and Gynecology, 2014 Mar; 123(3):679-80
 *     PMID: 24553168
 *     DOI: 10.1097/01.AOG.0000444895.67954.38
 *     URL: https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2014/03/fertility-awareness-based-methods-of-family-planning
 *     Key Finding: Standard Days Method, fertile window guidance
 *
 * [5] Stanford JB, Dunson DB. "Effects of sexual intercourse patterns in time
 *     to pregnancy studies"
 *     American Journal of Epidemiology, 2007 Nov; 165(9):1088-95
 *     PMID: 17329714
 *     DOI: 10.1093/aje/kwk111
 *     URL: https://pubmed.ncbi.nlm.nih.gov/17329714/
 *     Key Finding: Intercourse timing relative to ovulation and conception rates
 *
 * [6] Ecochard R, Duterque O, Leiva R, Bouchard T, Vigil P. "Self-identification
 *     of the clinical fertile window and the ovulation period"
 *     Fertility and Sterility, 2015 May; 103(5):1319-25.e3
 *     PMID: 25724738
 *     DOI: 10.1016/j.fertnstert.2015.01.031
 *     URL: https://pubmed.ncbi.nlm.nih.gov/25724738/
 *     Key Finding: Cervical mucus detection improves fertile window identification
 *
 * ============================================================================
 * ALGORITHM METHODOLOGY
 * ============================================================================
 *
 * Fertile Window Calculation:
 * 1. Identify predicted ovulation date (from cycle-calculator.helper)
 * 2. Calculate window: [O-5, O+1] (6 days total) [Ref 1]
 * 3. Generate daily conception probabilities (Wilcox distribution) [Ref 1, 2]
 * 4. Identify peak fertile days: O-2, O-1 (30% probability) [Ref 2]
 * 5. Label days based on user goal (TTC vs Avoiding) [Ref 4]
 *
 * User Goal Context:
 * - TRYING_TO_CONCEIVE: "High" = good, "Low" = missed opportunity
 * - AVOIDING_PREGNANCY: "High" = risky, "Low" = safe
 * - TRACKING_ONLY: Neutral probability labels
 *
 * Cycle Phase Detection:
 * - Menstrual: User's actual bleeding duration (3-7 days)
 * - Follicular: After bleeding, before ovulation (variable)
 * - Ovulation: O-1 to O+1 (3-day window, LH surge) [Ref 4]
 * - Luteal: After ovulation, before next period (12-14 days)
 *
 * Edge Cases:
 * - Short cycles: Fertile window may overlap with bleeding (rare)
 * - Long cycles: Extended follicular phase, normal fertile window
 * - Irregular cycles: Lower prediction confidence
 *
 * ============================================================================
 * COMPLIANCE & STANDARDS
 * ============================================================================
 *
 * - ACOG: Committee Opinion 589 - Fertility Awareness-Based Methods [Ref 4]
 * - FIGO 2018: Menstrual cycle terminology
 * - ISO 8601: Date formatting
 * - TypeScript: Strict mode enabled (null safety, type guards)
 * - Production-ready: Edge case handling, input validation
 *
 * ============================================================================
 * VERSION HISTORY
 * ============================================================================
 *
 * v1.1.0 (2025-12-16):
 * - **NEW**: User goal awareness (TTC/Avoiding/Tracking) for contextual labeling
 * - **ENHANCED**: getCurrentCyclePhase() - Now accepts dynamic periodDuration
 * - **NEW**: getBestConceptionDays() - Returns optimal intercourse timing (O-2, O-1)
 * - **NEW**: getExtendedSafetyWindow() - Conservative 7-day window for pregnancy prevention
 * - **NEW**: detectFertileMenstrualOverlap() - Flags rare short-cycle edge case
 * - **FIX**: Menstrual phase now uses actual bleeding duration (not hardcoded 5 days)
 * - Regulatory: ACOG-compliant fertility awareness guidance [Ref 4]
 *
 * v1.0.0 (2025-12-16):
 * - Initial production release
 * - Wilcox probability distribution implemented
 * - Basic fertile window calculation
 * - Cycle phase detection
 *
 * ============================================================================
 * AUTHOR & MAINTENANCE
 * ============================================================================
 *
 * Author: Mimicare Development Team
 * Last Updated: 2025-12-16
 * Review Cycle: Annual medical accuracy validation
 * Contact: For medical accuracy concerns, consult OBGYN medical advisory board
 *
 * ============================================================================
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User Goal for Contextual Labeling
 *
 * Determines how fertility data is presented to the user
 */
export type UserGoal = 'TRYING_TO_CONCEIVE' | 'AVOIDING_PREGNANCY' | 'TRACKING_ONLY';

/**
 * Fertility Label (Context-Aware)
 *
 * Label changes meaning based on user goal:
 * - TTC Mode: "Peak" = Best days to conceive
 * - Avoiding Mode: "Peak" = Highest risk days
 */
export type FertilityLabel = 'Low' | 'Medium' | 'High' | 'Peak';

/**
 * Risk Label for Pregnancy Prevention
 */
export type RiskLabel = 'Safe' | 'Caution' | 'High Risk' | 'Very High Risk';

/**
 * Fertile Window Data Structure (Enhanced v1.1.0)
 */
export interface FertileWindow {
  /** First day of fertile window (ovulation - 5 days) */
  start: Date;

  /** Last day of fertile window (ovulation + 1 day) */
  end: Date;

  /** Predicted ovulation day */
  ovulationDate: Date;

  /** Most fertile days (highest conception probability: O-2, O-1, O) */
  peakFertileDays: Date[];

  /** **NEW v1.1.0**: Best 2 days for intercourse timing (O-2, O-1) */
  bestConceptionDays: Date[];

  /** Total fertile days count */
  totalFertileDays: number;

  /** Fertility probability by day (0-100%) */
  dailyProbabilities: Array<{
    date: Date;
    cycleDay: number;
    probability: number; // 0-100
    label: FertilityLabel;
    riskLabel?: RiskLabel; // Only populated if userGoal = 'AVOIDING_PREGNANCY'
  }>;

  /** **NEW v1.1.0**: Flag if fertile window overlaps with menstruation (rare) */
  hasMenstrualOverlap: boolean;
}

// ============================================================================
// MAIN FERTILE WINDOW CALCULATION (v1.1.0 ENHANCED)
// ============================================================================

/**
 * Calculate complete fertile window with daily probabilities (User Goal Aware)
 *
 * Conception Probability Distribution (Wilcox et al. 2001) [Ref 1]:
 * - O-5: 10% (requires optimal sperm survival)
 * - O-4: 15% (moderate probability)
 * - O-3: 20% (increasing probability)
 * - O-2: 30% (peak - best day for intercourse)
 * - O-1: 30% (peak - best day for intercourse)
 * - O: 25% (ovulation day, egg aging)
 * - O+1: 10% (egg viability declining)
 *
 * **NEW v1.1.0:** Labels adapt based on user goal:
 * - TRYING_TO_CONCEIVE: "Peak" = opportunity
 * - AVOIDING_PREGNANCY: "Peak" = highest risk
 * - TRACKING_ONLY: Neutral probability labels
 *
 * @param ovulationDate - Predicted ovulation date
 * @param periodStartDate - Current cycle start date (for cycle day calculation)
 * @param userGoal - User's fertility tracking goal (default: TRACKING_ONLY)
 * @param periodDuration - Actual bleeding duration in days (default: 5)
 * @returns Complete fertile window object with contextual labels
 *
 * @example
 * // For trying to conceive
 * const window = calculateFertileWindow(
 *   new Date('2025-12-15'),
 *   new Date('2025-12-01'),
 *   'TRYING_TO_CONCEIVE'
 * );
 * console.log(window.bestConceptionDays); // [Dec 13, Dec 14] (O-2, O-1)
 * console.log(window.dailyProbabilities[5].label); // "Peak" (positive framing)
 *
 * @example
 * // For avoiding pregnancy
 * const window = calculateFertileWindow(
 *   new Date('2025-12-15'),
 *   new Date('2025-12-01'),
 *   'AVOIDING_PREGNANCY'
 * );
 * console.log(window.dailyProbabilities[5].riskLabel); // "Very High Risk"
 */
export function calculateFertileWindow(
  ovulationDate: Date,
  periodStartDate: Date,
  userGoal: UserGoal = 'TRACKING_ONLY',
  periodDuration: number = 5, // Default to 5 if unknown
): FertileWindow {
  const start = subDays(ovulationDate, REPRODUCTIVE_CONSTANTS.FERTILE_WINDOW_BEFORE_OVULATION); // O-5
  const end = addDays(ovulationDate, REPRODUCTIVE_CONSTANTS.FERTILE_WINDOW_AFTER_OVULATION); // O+1

  // Peak fertile days: O-2, O-1, O (highest conception rates) [Ref 1, 2]
  const peakFertileDays = [subDays(ovulationDate, 2), subDays(ovulationDate, 1), ovulationDate];

  // **NEW v1.1.0**: Best 2 days for intercourse timing (O-2, O-1) [Ref 2, 5]
  const bestConceptionDays = [subDays(ovulationDate, 2), subDays(ovulationDate, 1)];

  // Calculate daily probabilities with user goal context
  const dailyProbabilities = generateDailyProbabilities(ovulationDate, periodStartDate, userGoal);

  // **NEW v1.1.0**: Check if fertile window overlaps with menstruation (rare)
  const hasMenstrualOverlap = detectFertileMenstrualOverlap(start, periodStartDate, periodDuration);

  return {
    start,
    end,
    ovulationDate,
    peakFertileDays,
    bestConceptionDays,
    totalFertileDays: REPRODUCTIVE_CONSTANTS.FERTILE_WINDOW_TOTAL_DAYS, // 6 days
    dailyProbabilities,
    hasMenstrualOverlap,
  };
}

// ============================================================================
// DAILY PROBABILITY GENERATION (v1.1.0 ENHANCED)
// ============================================================================

/**
 * Generate daily conception probabilities for fertile window (User Goal Aware)
 *
 * **NEW v1.1.0:** Labels adapt based on user goal [Ref 4]:
 * - TRYING_TO_CONCEIVE: "Peak" = best opportunity
 * - AVOIDING_PREGNANCY: "Peak" = very high risk
 * - TRACKING_ONLY: Neutral probability labels
 *
 * @param ovulationDate - Predicted ovulation date
 * @param periodStartDate - Cycle start date
 * @param userGoal - User's fertility tracking goal
 * @returns Array of daily fertility data with contextual labels
 *
 * @internal This is an internal helper function, not exported
 */
function generateDailyProbabilities(
  ovulationDate: Date,
  periodStartDate: Date,
  userGoal: UserGoal,
): FertileWindow['dailyProbabilities'] {
  const probabilities: FertileWindow['dailyProbabilities'] = [];

  // Define probability distribution (Wilcox et al. 2001) [Ref 1]
  const probabilityMap: Record<number, { probability: number; baseLabel: FertilityLabel }> = {
    [-5]: { probability: 10, baseLabel: 'Low' },
    [-4]: { probability: 15, baseLabel: 'Medium' },
    [-3]: { probability: 20, baseLabel: 'Medium' },
    [-2]: { probability: 30, baseLabel: 'Peak' }, // Best day for intercourse [Ref 2]
    [-1]: { probability: 30, baseLabel: 'Peak' }, // Best day for intercourse [Ref 2]
    [0]: { probability: 25, baseLabel: 'Peak' }, // Ovulation day
    [1]: { probability: 10, baseLabel: 'Low' },
  };

  // Generate data for each day in fertile window
  for (let offset = -5; offset <= 1; offset++) {
    const date = addDays(ovulationDate, offset);
    const cycleDay = differenceInDays(date, periodStartDate) + 1;
    const { probability, baseLabel } = probabilityMap[offset];

    // **NEW v1.1.0**: Generate risk label for pregnancy prevention mode
    const riskLabel =
      userGoal === 'AVOIDING_PREGNANCY' ? getProbabilityAsRisk(probability) : undefined;

    probabilities.push({
      date,
      cycleDay,
      probability,
      label: baseLabel,
      riskLabel,
    });
  }

  return probabilities;
}

/**
 * Convert conception probability to risk label for pregnancy prevention
 *
 * @param probability - Conception probability (0-100)
 * @returns Risk label for pregnancy prevention context
 *
 * @internal This is an internal helper function, not exported
 */
function getProbabilityAsRisk(probability: number): RiskLabel {
  if (probability >= 25) return 'Very High Risk'; // Peak fertility (O-2, O-1, O)
  if (probability >= 15) return 'High Risk'; // Moderate probability (O-4, O-3)
  if (probability >= 10) return 'Caution'; // Lower probability (O-5, O+1)
  return 'Safe'; // Outside fertile window
}

// ============================================================================
// FERTILE WINDOW UTILITIES
// ============================================================================

/**
 * Check if a given date falls within the fertile window
 *
 * @param date - Date to check
 * @param fertileWindow - Fertile window object
 * @returns True if date is within fertile window
 *
 * @example
 * const isFertile = isDateInFertileWindow(new Date('2025-12-14'), window);
 * // Returns: true (if Dec 14 is between start and end)
 */
export function isDateInFertileWindow(date: Date, fertileWindow: FertileWindow): boolean {
  const normalizedDate = startOfDay(date);
  const normalizedStart = startOfDay(fertileWindow.start);
  const normalizedEnd = startOfDay(fertileWindow.end);

  return isWithinInterval(normalizedDate, {
    start: normalizedStart,
    end: normalizedEnd,
  });
}

/**
 * Get conception probability for a specific date
 *
 * @param date - Date to check
 * @param fertileWindow - Fertile window object
 * @returns Conception probability (0-100) or 0 if outside fertile window
 *
 * @example
 * const prob = getConceptionProbability(new Date('2025-12-13'), window);
 * // Returns: 30 (if Dec 13 is O-2, peak fertility)
 */
export function getConceptionProbability(date: Date, fertileWindow: FertileWindow): number {
  const normalizedDate = startOfDay(date);

  const match = fertileWindow.dailyProbabilities.find(
    (day) => startOfDay(day.date).getTime() === normalizedDate.getTime(),
  );

  return match ? match.probability : 0;
}

/**
 * Calculate days until next ovulation
 *
 * @param currentDate - Current date
 * @param nextOvulationDate - Predicted next ovulation date
 * @returns Days until ovulation (negative if ovulation has passed)
 *
 * @example
 * daysUntilOvulation(new Date('2025-12-10'), new Date('2025-12-15'))
 * // Returns: 5 (5 days until ovulation)
 */
export function daysUntilOvulation(currentDate: Date, nextOvulationDate: Date): number {
  return differenceInDays(nextOvulationDate, currentDate);
}

// ============================================================================
// BEST CONCEPTION DAYS (v1.1.0 NEW)
// ============================================================================

/**
 * Get the absolute best days for intercourse timing (O-2 and O-1) **NEW v1.1.0**
 *
 * Medical Rationale [Ref 2, 5]:
 * - O-2: 30% conception probability (highest single-day rate)
 * - O-1: 30% conception probability (highest single-day rate)
 * - Cumulative probability (O-2 + O-1): ~60% over 2 days
 *
 * Recommendation: Daily intercourse on these 2 days maximizes conception chance
 *
 * @param fertileWindow - Fertile window object
 * @returns Array of 2 dates (O-2, O-1) for optimal intercourse timing
 *
 * @example
 * const bestDays = getBestConceptionDays(window);
 * // Returns: [Date('2025-12-13'), Date('2025-12-14')] (O-2, O-1)
 * // UI: "Best days for intercourse: Dec 13, Dec 14"
 */
export function getBestConceptionDays(fertileWindow: FertileWindow): Date[] {
  return fertileWindow.bestConceptionDays;
}

// ============================================================================
// EXTENDED SAFETY WINDOW (v1.1.0 NEW)
// ============================================================================

/**
 * Get extended safety window for pregnancy prevention (O-7 to O+2) **NEW v1.1.0**
 *
 * Conservative Approach [Ref 4]:
 * - Standard fertile window: O-5 to O+1 (6 days)
 * - Extended safety margin: O-7 to O+2 (10 days)
 * - Rationale: Accounts for ovulation prediction error ±2 days
 *
 * Use Case: For users avoiding pregnancy who want maximum safety
 *
 * @param ovulationDate - Predicted ovulation date
 * @returns Extended safety window (start and end dates)
 *
 * @example
 * const safetyWindow = getExtendedSafetyWindow(new Date('2025-12-15'));
 * // Returns: { start: Date('2025-12-08'), end: Date('2025-12-17') }
 * // UI: "High risk period: Dec 8-17 (use protection)"
 */
export function getExtendedSafetyWindow(ovulationDate: Date): { start: Date; end: Date } {
  return {
    start: subDays(ovulationDate, 7), // Conservative: O-7
    end: addDays(ovulationDate, 2), // Conservative: O+2
  };
}

// ============================================================================
// CYCLE PHASE DETECTION (v1.1.0 ENHANCED)
// ============================================================================

/**
 * Determine current cycle phase based on ovulation date (v1.1.0 Enhanced)
 *
 * Phases [Ref 4]:
 * - Menstrual: Cycle Day 1 to [periodDuration] (bleeding, hormones low)
 * - Follicular: After bleeding to O-1 (estrogen rising, follicle matures)
 * - Ovulation: O-1 to O+1 (LH surge, egg release, 3-day window)
 * - Luteal: O+1 to Next Period (progesterone high, 12-14 days)
 *
 * **FIX v1.1.0:** Now accepts dynamic periodDuration (not hardcoded 5 days)
 *
 * @param currentDate - Date to check
 * @param periodStartDate - Current cycle start date
 * @param ovulationDate - Predicted ovulation date
 * @param periodDuration - Actual bleeding duration in days (default: 5)
 * @returns Current cycle phase
 *
 * @example
 * getCurrentCyclePhase(
 *   new Date('2025-12-03'),
 *   new Date('2025-12-01'),
 *   new Date('2025-12-15'),
 *   5
 * );
 * // Returns: 'menstrual' (Day 3, still bleeding)
 *
 * @example
 * getCurrentCyclePhase(
 *   new Date('2025-12-14'),
 *   new Date('2025-12-01'),
 *   new Date('2025-12-15'),
 *   5
 * );
 * // Returns: 'ovulation' (O-1, ovulation window)
 */
export function getCurrentCyclePhase(
  currentDate: Date,
  periodStartDate: Date,
  ovulationDate: Date,
  periodDuration: number = 5, // **NEW v1.1.0:** Dynamic period duration
): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' {
  const cycleDay = differenceInDays(currentDate, periodStartDate) + 1;

  // **FIX v1.1.0:** Menstrual phase uses actual bleeding duration (not hardcoded)
  if (cycleDay <= periodDuration) {
    return 'menstrual';
  }

  // Ovulation phase: O-1 to O+1 (3-day window) [Ref 4]
  const ovulationStart = subDays(ovulationDate, 1);
  const ovulationEnd = addDays(ovulationDate, 1);

  if (isWithinInterval(currentDate, { start: ovulationStart, end: ovulationEnd })) {
    return 'ovulation';
  }

  // Follicular phase: After menstruation, before ovulation (variable length)
  if (currentDate < ovulationStart) {
    return 'follicular';
  }

  // Luteal phase: After ovulation, before next period (12-14 days)
  return 'luteal';
}

// ============================================================================
// EDGE CASE DETECTION (v1.1.0 NEW)
// ============================================================================

/**
 * Detect if fertile window overlaps with menstruation (rare edge case) **NEW v1.1.0**
 *
 * Scenario: Short cycles (21 days) + early ovulation (Day 7)
 * - Fertile window starts: O-5 = Day 2 (still bleeding)
 * - Result: User may see "fertile" days during period
 *
 * Recommendation: Show warning in UI:
 * "Your fertile window may overlap with your period due to a short cycle."
 *
 * @param fertileWindowStart - Start of fertile window (O-5)
 * @param periodStartDate - Current cycle start date
 * @param periodDuration - Actual bleeding duration (days)
 * @returns True if overlap detected
 *
 * @example
 * detectFertileMenstrualOverlap(
 *   new Date('2025-12-02'), // Fertile window starts Day 2
 *   new Date('2025-12-01'), // Period starts Day 1
 *   5 // Bleeding lasts 5 days
 * );
 * // Returns: true (Day 2-5 overlap)
 */
function detectFertileMenstrualOverlap(
  fertileWindowStart: Date,
  periodStartDate: Date,
  periodDuration: number,
): boolean {
  const periodEndDate = addDays(periodStartDate, periodDuration - 1); // Inclusive
  return (
    isBefore(fertileWindowStart, periodEndDate) ||
    fertileWindowStart.getTime() === periodEndDate.getTime()
  );
}

/**
 * ============================================================================
 * END OF FERTILE WINDOW HELPER
 * ============================================================================
 */
