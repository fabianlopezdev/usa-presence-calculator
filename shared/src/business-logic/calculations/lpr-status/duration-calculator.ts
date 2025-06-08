// External dependencies (alphabetical)
import { differenceInDays, isAfter } from 'date-fns';

// Internal dependencies - Schemas & Types (alphabetical)
import { MaximumTripDurationResult, ReentryPermitInfo } from '@schemas/lpr-status';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic (alphabetical)
import { hasRiskyTrips } from '@business-logic/calculations/lpr-status/helpers';

// Internal dependencies - Constants (alphabetical)
import {
  CONTINUOUS_RESIDENCE_THRESHOLDS,
  LPR_ABANDONMENT_THRESHOLDS,
  PHYSICAL_PRESENCE_REQUIREMENTS,
  REENTRY_PERMIT_RULES,
} from '@constants/uscis-rules';

// Internal dependencies - Utilities (alphabetical)
import { parseUTCDate } from '@utils/utc-date-helpers';

/**
 * Calculate the maximum safe trip duration to maintain all statuses
 * Considers physical presence, continuous residence, and LPR status requirements
 */
export function calculateMaximumTripDurationToMaintainAllStatuses(
  existingTrips: Trip[],
  greenCardDate: string,
  eligibilityCategory: 'three_year' | 'five_year',
  _currentDate: Date,
  reentryPermitInfo?: ReentryPermitInfo,
): MaximumTripDurationResult {
  const result = initializeMaxTripResult();

  // Check if already at risk
  if (hasRiskyTrips(existingTrips)) {
    return createAlreadyAtRiskResult(result);
  }

  const eligibilityStartDate = parseUTCDate(greenCardDate);
  const totalDaysAbroad = calculateTotalDaysAbroadInPeriod(existingTrips, eligibilityStartDate);

  // Calculate safety days for each requirement
  const safetyDays = calculateSafetyDays(
    totalDaysAbroad,
    eligibilityCategory,
    reentryPermitInfo,
    existingTrips,
  );

  result.physicalPresenceSafetyDays = safetyDays.physicalPresenceSafetyDays;
  result.continuousResidenceSafetyDays = safetyDays.continuousResidenceSafetyDays;
  result.lprStatusSafetyDays = safetyDays.lprStatusSafetyDays;

  if (reentryPermitInfo?.hasReentryPermit) {
    result.warnings.push(
      'Reentry permit protects LPR status but does not protect continuous residence for naturalization',
    );
  }

  // Determine limiting factor and maximum days
  determineLimitingFactor(result, reentryPermitInfo);

  return result;
}

function initializeMaxTripResult(): MaximumTripDurationResult {
  return {
    maximumDays: 0,
    limitingFactor: 'physical_presence',
    physicalPresenceSafetyDays: 0,
    continuousResidenceSafetyDays: 0,
    lprStatusSafetyDays: 0,
    warnings: [],
  };
}

function createAlreadyAtRiskResult(result: MaximumTripDurationResult): MaximumTripDurationResult {
  result.maximumDays = 0;
  result.limitingFactor = 'already_at_risk';
  result.warnings.push(
    'You already have trips that put your continuous residence at risk',
    'Consult with an immigration attorney before any additional travel',
  );
  return result;
}

// Helper function to calculate total days abroad in eligibility period
function calculateTotalDaysAbroadInPeriod(trips: Trip[], eligibilityStartDate: Date): number {
  let totalDaysAbroad = 0;
  trips.forEach((trip) => {
    const departure = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);

    // Only count trips within eligibility period
    if (isAfter(returnDate, eligibilityStartDate)) {
      // USCIS rule: departure and return days count as days IN the USA
      const daysAbroad = Math.max(0, differenceInDays(returnDate, departure) - 1);
      totalDaysAbroad += daysAbroad;
    }
  });
  return totalDaysAbroad;
}

// Helper function to calculate safety days for each requirement
function calculateSafetyDays(
  totalDaysAbroad: number,
  eligibilityCategory: 'three_year' | 'five_year',
  reentryPermitInfo?: ReentryPermitInfo,
  _existingTrips: Trip[] = [],
): {
  physicalPresenceSafetyDays: number;
  continuousResidenceSafetyDays: number;
  lprStatusSafetyDays: number;
} {
  const eligibilityYears = eligibilityCategory === 'five_year' ? 5 : 3;
  const daysInPeriod = eligibilityYears * 365;

  const requiredPresenceDays =
    eligibilityCategory === 'five_year'
      ? PHYSICAL_PRESENCE_REQUIREMENTS.FIVE_YEAR_PATH
      : PHYSICAL_PRESENCE_REQUIREMENTS.THREE_YEAR_PATH;

  const maxAllowableAbsenceDays = daysInPeriod - requiredPresenceDays;
  const remainingAllowableDays = maxAllowableAbsenceDays - totalDaysAbroad;

  const physicalPresenceSafetyDays = Math.max(0, remainingAllowableDays - 30); // 30-day buffer
  const continuousResidenceSafetyDays = CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK - 1; // 149 days

  let lprStatusSafetyDays: number;
  if (reentryPermitInfo?.hasReentryPermit) {
    lprStatusSafetyDays = REENTRY_PERMIT_RULES.APPROACHING_LIMIT_DAYS - 1;
  } else {
    lprStatusSafetyDays = LPR_ABANDONMENT_THRESHOLDS.WARNING - 1;
  }

  return {
    physicalPresenceSafetyDays,
    continuousResidenceSafetyDays,
    lprStatusSafetyDays,
  };
}

function determineLimitingFactor(
  result: MaximumTripDurationResult,
  reentryPermitInfo?: ReentryPermitInfo,
): void {
  if (
    result.physicalPresenceSafetyDays <= result.continuousResidenceSafetyDays &&
    result.physicalPresenceSafetyDays <= result.lprStatusSafetyDays
  ) {
    result.maximumDays = result.physicalPresenceSafetyDays;
    result.limitingFactor = 'physical_presence';
    if (result.physicalPresenceSafetyDays < 90) {
      result.warnings.push('You are approaching your physical presence limit for naturalization');
    }
  } else if (reentryPermitInfo?.hasReentryPermit) {
    // With reentry permit, LPR status is protected longer
    if (result.continuousResidenceSafetyDays <= result.lprStatusSafetyDays) {
      result.maximumDays = result.continuousResidenceSafetyDays;
      result.limitingFactor = 'continuous_residence_approaching';
    } else {
      result.maximumDays = result.lprStatusSafetyDays;
      result.limitingFactor = 'reentry_permit_approaching_limit';
      if (result.lprStatusSafetyDays < 60) {
        result.warnings.push('You are approaching the maximum reentry permit protection period');
      }
    }
  } else {
    // Without reentry permit
    if (result.continuousResidenceSafetyDays <= result.lprStatusSafetyDays) {
      result.maximumDays = result.continuousResidenceSafetyDays;
      result.limitingFactor = 'continuous_residence_approaching';
    } else {
      result.maximumDays = result.lprStatusSafetyDays;
      result.limitingFactor = 'lpr_status_warning';
      if (result.lprStatusSafetyDays < 30) {
        result.warnings.push(
          'Extended absence may raise questions about permanent resident intent',
        );
      }
    }
  }
}
