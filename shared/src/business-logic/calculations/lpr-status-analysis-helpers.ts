import {
  I751Status,
  PatternOfNonResidence,
  RebuttablePresumption,
  LPRStatusRiskFactors,
  ReentryPermit,
  LPRStatusInput,
} from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

import {
  calculateRebuttablePresumption,
  calculateRiskFactors,
  determineCurrentStatus,
} from './lpr-status-advanced-helpers';
import { analyzePatternOfNonResidence } from './lpr-status-pattern-analysis';

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
