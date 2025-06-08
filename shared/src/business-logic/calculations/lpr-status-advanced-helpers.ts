// External dependencies (alphabetical)
import { differenceInDays, isAfter, isBefore } from 'date-fns';

// Internal dependencies - Schemas & Types (alphabetical)
import {
  I751Status,
  LPRStatusRiskFactors,
  LPRStatusType,
  N470Exemption,
  PatternOfNonResidence,
  RebuttablePresumption,
  ReentryPermit,
} from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import {
  handleAbandonmentRiskSuggestions,
  handleConditionalResidentSuggestions,
  handleGeneralRiskSuggestions,
  handleN470ExemptionSuggestions,
  handleReentryPermitSuggestions,
} from '@business-logic/calculations/lpr-status-suggestion-helpers';

// Internal dependencies - Constants (alphabetical)
// None needed

// Internal dependencies - Utilities (alphabetical)
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Calculate rebuttable presumption based on trip duration
 */
export function calculateRebuttablePresumption(
  trips: Trip[],
  currentDate: Date,
): RebuttablePresumption {
  let maxDaysAbroad = 0;
  let daysSinceLastReturn = 0;

  trips.forEach((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);
    // USCIS rule: departure and return days count as days IN the USA
    const totalDays = differenceInDays(returnDate, departure);
    const daysAbroad = Math.max(0, totalDays - 1);

    if (daysAbroad > maxDaysAbroad) {
      maxDaysAbroad = daysAbroad;
    }

    if (isAfter(returnDate, currentDate)) {
      daysSinceLastReturn = 0;
    } else {
      const daysSince = differenceInDays(currentDate, returnDate);
      if (daysSinceLastReturn === 0 || daysSince < daysSinceLastReturn) {
        daysSinceLastReturn = daysSince;
      }
    }
  });

  const applies = maxDaysAbroad >= 180 && maxDaysAbroad < 365;

  return {
    applies,
    daysSinceLastReturn: daysSinceLastReturn > 0 ? daysSinceLastReturn : undefined,
    evidenceProvided: false,
    maxDaysAbroad: maxDaysAbroad > 0 ? maxDaysAbroad : undefined,
    reason: applies
      ? `Absence of ${maxDaysAbroad} days creates rebuttable presumption of abandonment`
      : maxDaysAbroad >= 365
        ? `Absence of ${maxDaysAbroad} days likely results in automatic loss of LPR status`
        : undefined,
  };
}

/**
 * Calculate risk factors for LPR status
 */
export function calculateRiskFactors(
  trips: Trip[],
  currentDate: Date,
  patternAnalysis: PatternOfNonResidence,
  rebuttablePresumption: RebuttablePresumption,
  reentryPermit: ReentryPermit,
  i751Status: I751Status,
): LPRStatusRiskFactors {
  const lastTrip = getLastTripFromList(trips);
  const currentlyAbroad = isCurrentlyAbroad(lastTrip, currentDate);
  const hasExpiredReentryPermit = checkIfReentryPermitExpired(reentryPermit, currentDate);
  const hasPendingI751 = i751Status === 'pending';

  const totalRiskScore = calculateTotalRiskScore({
    hasPattern: patternAnalysis.hasPattern,
    hasRebuttablePresumption: rebuttablePresumption.applies,
    currentlyAbroad,
    hasExpiredReentryPermit,
    hasPendingI751,
  });

  return {
    abandonedTaxResidency: false,
    currentlyAbroad,
    hasExpiredReentryPermit,
    hasPatternOfNonResidence: patternAnalysis.hasPattern,
    hasPendingI751,
    hasRebuttablePresumption: rebuttablePresumption.applies,
    movedPermanentResidence: false,
    totalRiskScore,
  };
}

function getLastTripFromList(trips: Trip[]): Trip | null {
  if (trips.length === 0) return null;

  return [...trips].sort(
    (a, b) => parseUTCDate(b.returnDate).getTime() - parseUTCDate(a.returnDate).getTime(),
  )[0];
}

function isCurrentlyAbroad(lastTrip: Trip | null, currentDate: Date): boolean {
  if (!lastTrip) return false;

  return (
    isAfter(currentDate, parseUTCDate(lastTrip.departureDate)) &&
    isBefore(currentDate, parseUTCDate(lastTrip.returnDate))
  );
}

function checkIfReentryPermitExpired(reentryPermit: ReentryPermit, currentDate: Date): boolean {
  if (reentryPermit.status === 'expired') return true;

  if (
    reentryPermit.status === 'approved' &&
    reentryPermit.expirationDate &&
    isBefore(parseUTCDate(reentryPermit.expirationDate), currentDate)
  ) {
    return true;
  }

  return false;
}

function calculateTotalRiskScore(factors: {
  hasPattern: boolean;
  hasRebuttablePresumption: boolean;
  currentlyAbroad: boolean;
  hasExpiredReentryPermit: boolean;
  hasPendingI751: boolean;
}): number {
  let score = 0;

  if (factors.hasPattern) score += 3;
  if (factors.hasRebuttablePresumption) score += 4;
  if (factors.currentlyAbroad) score += 2;
  if (factors.hasExpiredReentryPermit) score += 2;
  if (factors.hasPendingI751) score += 1;

  return score;
}

/**
 * Determine current LPR status based on risk factors
 */
export function determineCurrentStatus(
  riskFactors: LPRStatusRiskFactors,
  rebuttablePresumption: RebuttablePresumption,
  reentryPermit: ReentryPermit,
): 'maintained' | 'at_risk' | 'presumed_abandoned' | 'abandoned' {
  // Check for trips over 365 days first
  if (rebuttablePresumption.maxDaysAbroad && rebuttablePresumption.maxDaysAbroad >= 365) {
    return 'abandoned';
  }

  if (riskFactors.totalRiskScore >= 8) {
    return 'abandoned';
  }

  if (
    rebuttablePresumption.applies &&
    !rebuttablePresumption.evidenceProvided &&
    reentryPermit.status !== 'approved'
  ) {
    return 'presumed_abandoned';
  }

  if (riskFactors.totalRiskScore >= 4) {
    return 'at_risk';
  }

  return 'maintained';
}

/**
 * Generate suggestions based on current status and risk factors
 */
export function generateSuggestions(
  currentStatus: string,
  riskFactors: LPRStatusRiskFactors,
  lprType: LPRStatusType,
  i751Status: I751Status,
  n470Exemption: N470Exemption,
  reentryPermit: ReentryPermit,
  currentDate: Date,
  lprStartDate: string,
): string[] {
  const suggestions: string[] = [];

  handleConditionalResidentSuggestions(suggestions, lprType, i751Status, lprStartDate, currentDate);

  handleN470ExemptionSuggestions(suggestions, n470Exemption);

  if (currentStatus === 'abandoned' && n470Exemption.status !== 'approved') {
    suggestions.push(
      'Your LPR status appears to be abandoned',
      'Apply for SB-1 Returning Resident Visa before attempting to return',
      'Consult with an immigration attorney immediately',
    );
    return suggestions;
  }

  handleAbandonmentRiskSuggestions(suggestions, currentStatus, riskFactors);

  handleReentryPermitSuggestions(suggestions, reentryPermit, riskFactors, currentDate);

  handleGeneralRiskSuggestions(suggestions, n470Exemption, riskFactors, currentStatus);

  return suggestions;
}
