// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import {
  I751Status,
  LPRStatusAssessment,
  LPRStatusAssessmentAdvanced,
  LPRStatusInput,
  LPRStatusRiskFactors,
  LPRStatusType,
  MaximumTripDurationResult,
  N470Exemption,
  PatternOfNonResidence,
  RebuttablePresumption,
  ReentryPermit,
  ReentryPermitInfo,
} from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import {
  analyzePatterns,
  assessRiskAndStatus,
} from '@business-logic/calculations/lpr-status/analysis-helpers';
import { generateSuggestions } from '@business-logic/calculations/lpr-status/advanced-helpers';
import { calculateMaximumTripDurationToMaintainAllStatuses } from '@business-logic/calculations/lpr-status/duration-calculator';
import {
  calculateTripMetrics,
  generateLPRStatusRecommendations,
} from '@business-logic/calculations/lpr-status/helpers';
import { calculateGreenCardAbandonmentRisk } from '@business-logic/calculations/travel-risk/helpers';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Comprehensive assessment of risk to Lawful Permanent Resident status
 * Analyzes trip patterns to identify abandonment risks
 */
export function assessRiskOfLosingPermanentResidentStatus(
  trips: Trip[],
  _greenCardDate: string,
): LPRStatusAssessment {
  const metrics = calculateTripMetrics(trips);
  const result = initializeLPRStatusAssessment(metrics, trips);

  if (!metrics.longestTrip) {
    return result;
  }

  const riskAssessment = calculateGreenCardAbandonmentRisk(metrics.maxDays);
  updateRiskLevels(result, riskAssessment);

  const { recommendations, requiresReentryPermit } = generateLPRStatusRecommendations(
    riskAssessment.riskLevel,
    metrics.totalDaysAbroadCurrentYear,
  );

  result.recommendations = recommendations;
  result.requiresReentryPermit = requiresReentryPermit;

  // Additional check for cumulative travel
  if (metrics.totalDaysAbroadCurrentYear > 180 && result.overallRisk === 'none') {
    result.overallRisk = 'warning';
  }

  return result;
}

function initializeLPRStatusAssessment(
  metrics: ReturnType<typeof calculateTripMetrics>,
  trips: Trip[],
): LPRStatusAssessment {
  return {
    overallRisk: 'none',
    longestTrip: {
      trip: metrics.longestTrip || trips[0],
      daysAbroad: metrics.maxDays,
      riskLevel: 'none',
    },
    currentYearTrips: metrics.currentYearTrips.length,
    totalDaysAbroadCurrentYear: metrics.totalDaysAbroadCurrentYear,
    recommendations: [],
    requiresReentryPermit: false,
  };
}

function updateRiskLevels(
  result: LPRStatusAssessment,
  riskAssessment: ReturnType<typeof calculateGreenCardAbandonmentRisk>,
): void {
  if (
    riskAssessment.riskLevel === 'protected_by_permit' ||
    riskAssessment.riskLevel === 'approaching_permit_limit'
  ) {
    result.longestTrip.riskLevel = 'none';
    result.overallRisk = 'none';
  } else {
    result.longestTrip.riskLevel = riskAssessment.riskLevel;
    result.overallRisk = riskAssessment.riskLevel;
  }
}

/**
 * Advanced LPR status assessment with pattern analysis and exemptions
 */
export function assessRiskOfLosingPermanentResidentStatusAdvanced(
  input: LPRStatusInput,
): LPRStatusAssessmentAdvanced {
  const params = extractAdvancedParams(input);
  const trips = mapInputToTrips(input);

  const analysis = performAdvancedAnalysis(trips, input, params);

  return buildAdvancedAssessmentResult(params, trips, analysis);
}

function performAdvancedAnalysis(
  trips: Trip[],
  input: LPRStatusInput,
  params: ReturnType<typeof extractAdvancedParams>,
): {
  patternAnalysis: PatternOfNonResidence;
  rebuttablePresumption: RebuttablePresumption;
  riskFactors: LPRStatusRiskFactors;
  currentStatus: string;
  suggestions: string[];
} {
  const { patternAnalysis, rebuttablePresumption } = analyzePatterns(trips, input, params);

  const { riskFactors, currentStatus } = assessRiskAndStatus(
    trips,
    params,
    patternAnalysis,
    rebuttablePresumption,
  );

  const suggestions = generateSuggestions(
    currentStatus,
    riskFactors,
    params.lprType,
    params.i751Status,
    params.n470Exemption,
    params.reentryPermit,
    params.currentDate,
    input.lprStartDate,
  );

  return {
    patternAnalysis,
    rebuttablePresumption,
    riskFactors,
    currentStatus,
    suggestions,
  };
}

function buildAdvancedAssessmentResult(
  params: ReturnType<typeof extractAdvancedParams>,
  trips: Trip[],
  analysis: ReturnType<typeof performAdvancedAnalysis>,
): LPRStatusAssessmentAdvanced {
  const lastTrip = getLastTrip(trips);

  return {
    currentStatus: analysis.currentStatus as
      | 'maintained'
      | 'at_risk'
      | 'presumed_abandoned'
      | 'abandoned',
    i751Status: params.i751Status,
    lastEntryDate: lastTrip?.returnDate,
    lprType: params.lprType,
    n470Exemption: params.n470Exemption,
    patternAnalysis: analysis.patternAnalysis,
    rebuttablePresumption: analysis.rebuttablePresumption,
    reentryPermit: params.reentryPermit,
    riskFactors: analysis.riskFactors,
    suggestions: analysis.suggestions,
  };
}

function extractAdvancedParams(input: LPRStatusInput): {
  currentDate: Date;
  lprType: LPRStatusType;
  i751Status: I751Status;
  n470Exemption: N470Exemption;
  reentryPermit: ReentryPermit;
} {
  return {
    currentDate: parseUTCDate(input.currentDate),
    lprType: input.lprType || 'permanent',
    i751Status: input.i751Status || 'not_applicable',
    n470Exemption: input.n470Exemption || { status: 'none' },
    reentryPermit: input.reentryPermit || { status: 'none' },
  };
}

function mapInputToTrips(input: LPRStatusInput): Trip[] {
  return input.trips.map((t) => ({
    id: Math.random().toString(36).substr(2, 9),
    departureDate: t.departureDate,
    returnDate: t.arrivalDate || input.currentDate,
    userId: 'user1',
    isSimulated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

function getLastTrip(trips: Trip[]): Trip | null {
  return trips.length > 0
    ? trips.sort(
        (a, b) => parseUTCDate(b.returnDate).getTime() - parseUTCDate(a.returnDate).getTime(),
      )[0]
    : null;
}

/**
 * Calculate the maximum safe trip duration considering N-470 exemptions
 */
export function calculateMaximumTripDurationWithExemptions(
  existingTrips: Trip[],
  greenCardDate: string,
  eligibilityCategory: 'three_year' | 'five_year',
  currentDate: Date,
  reentryPermitInfo?: ReentryPermitInfo,
  n470Exemption?: N470Exemption,
): MaximumTripDurationResult {
  const baseResult = calculateMaximumTripDurationToMaintainAllStatuses(
    existingTrips,
    greenCardDate,
    eligibilityCategory,
    currentDate,
    reentryPermitInfo,
  );

  if (n470Exemption?.status === 'approved') {
    baseResult.continuousResidenceSafetyDays = 730;
    baseResult.warnings.push(
      'N-470 exemption protects continuous residence but not physical presence',
      'You must still meet physical presence requirements for naturalization',
    );

    if (baseResult.limitingFactor === 'continuous_residence_approaching') {
      baseResult.limitingFactor = 'physical_presence';
      baseResult.maximumDays = baseResult.physicalPresenceSafetyDays;
    }
  }

  return baseResult;
}
