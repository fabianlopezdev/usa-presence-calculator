// External dependencies (alphabetical)
// None needed

// Internal dependencies - Schemas & Types (alphabetical)
import {
  I751Status,
  LPRStatusInput,
  LPRStatusRiskFactors,
  PatternOfNonResidence,
  RebuttablePresumption,
  ReentryPermit,
} from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import {
  calculateRebuttablePresumption,
  calculateRiskFactors,
  determineCurrentStatus,
} from '@business-logic/calculations/lpr-status/advanced-helpers';
import { analyzePatternOfNonResidence } from '@business-logic/calculations/lpr-status/pattern-analysis';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
// None needed

export function analyzePatterns(
  trips: Trip[],
  input: LPRStatusInput,
  params: { currentDate: Date },
): {
  patternAnalysis: PatternOfNonResidence;
  rebuttablePresumption: RebuttablePresumption;
} {
  const patternAnalysis = analyzePatternOfNonResidence(
    trips,
    input.lprStartDate,
    input.currentDate,
  );

  const rebuttablePresumption = calculateRebuttablePresumption(trips, params.currentDate);

  return { patternAnalysis, rebuttablePresumption };
}

export function assessRiskAndStatus(
  trips: Trip[],
  params: {
    currentDate: Date;
    reentryPermit: ReentryPermit;
    i751Status: I751Status;
  },
  patternAnalysis: PatternOfNonResidence,
  rebuttablePresumption: RebuttablePresumption,
): {
  riskFactors: LPRStatusRiskFactors;
  currentStatus: string;
} {
  const riskFactors = calculateRiskFactors(
    trips,
    params.currentDate,
    patternAnalysis,
    rebuttablePresumption,
    params.reentryPermit,
    params.i751Status,
  );

  const currentStatus = determineCurrentStatus(
    riskFactors,
    rebuttablePresumption,
    params.reentryPermit,
  );

  return { riskFactors, currentStatus };
}
