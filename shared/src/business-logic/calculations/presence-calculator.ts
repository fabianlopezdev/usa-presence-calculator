// External dependencies
import { differenceInDays, isAfter, isEqual, isValid } from 'date-fns';

// Internal dependencies - Schemas & Types
import {
  ContinuousResidenceWarningSimple,
  EligibilityDates,
  PresenceCalculationResult,
  PresenceStatusDetails,
} from '@schemas/presence';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
import {
  calculateTripDaysAbroad,
  createResidenceWarning,
  isValidTrip,
  isValidTripForResidenceCheck,
  validateAndParseDates,
} from '@business-logic/calculations/presence-calculator-helpers';
import { calculateAnniversaryDate } from '@business-logic/calculations/travel-analytics-helpers';

// Internal dependencies - Constants
import { EARLY_FILING_WINDOW_DAYS, PHYSICAL_PRESENCE_REQUIREMENTS } from '@constants/index';

// Internal dependencies - Utilities
import { formatUTCDate, parseUTCDate, subUTCDays } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
export function calculateDaysOfPhysicalPresence(
  trips: Trip[],
  greenCardDate: string,
  asOfDate: string,
): PresenceCalculationResult {
  // Validate and parse dates
  const {
    startDate,
    endDate,
    isValid: datesValid,
  } = validateAndParseDates(greenCardDate, asOfDate);

  if (!datesValid) {
    return { totalDaysInUSA: 0, totalDaysAbroad: 0 };
  }

  // USCIS counts both the first and last day of the period when calculating
  // physical presence, matching how they count trip durations
  // Use date-fns differenceInDays which is DST-aware
  const totalDays = differenceInDays(endDate, startDate) + 1;

  if (!trips || trips.length === 0) {
    return { totalDaysInUSA: totalDays, totalDaysAbroad: 0 };
  }

  const actualTrips = trips.filter(isValidTrip);

  if (actualTrips.length === 0) {
    return { totalDaysInUSA: totalDays, totalDaysAbroad: 0 };
  }

  // Using a Set prevents double-counting days when trips overlap,
  // which is critical for accurate USCIS compliance
  const daysAbroadSet = new Set<string>();

  for (const trip of actualTrips) {
    calculateTripDaysAbroad(trip, startDate, endDate, daysAbroadSet);
  }

  const totalDaysAbroad = daysAbroadSet.size;
  const totalDaysInUSA = Math.max(0, totalDays - totalDaysAbroad);

  return {
    totalDaysInUSA,
    totalDaysAbroad,
  };
}

export function calculateEligibilityDates(
  greenCardDate: string,
  eligibilityCategory: 'three_year' | 'five_year',
): EligibilityDates {
  // Validate inputs
  if (!greenCardDate) {
    throw new Error('Green card date is required');
  }

  if (
    !eligibilityCategory ||
    (eligibilityCategory !== 'three_year' && eligibilityCategory !== 'five_year')
  ) {
    throw new Error('Invalid eligibility category');
  }

  const greenCardParsedDate = parseUTCDate(greenCardDate);

  if (!isValid(greenCardParsedDate)) {
    throw new Error('Invalid green card date format');
  }

  const yearsRequired = eligibilityCategory === 'five_year' ? 5 : 3;

  // Use our UTC-safe anniversary calculation that properly handles leap years
  const anniversaryDate = calculateAnniversaryDate(greenCardParsedDate, yearsRequired);
  // CORRECT: Eligibility date IS the anniversary date (not 1 day before)
  const eligibilityDate = anniversaryDate; // <-- REMOVE the subDays here
  const earliestFilingDate = subUTCDays(anniversaryDate, EARLY_FILING_WINDOW_DAYS);

  return {
    eligibilityDate: formatUTCDate(eligibilityDate),
    earliestFilingDate: formatUTCDate(earliestFilingDate),
  };
}

export function calculatePresenceStatus(
  totalDaysInUSA: number,
  eligibilityCategory: 'three_year' | 'five_year',
): PresenceStatusDetails {
  validateEligibilityCategory(eligibilityCategory);

  const requiredDays = getRequiredDaysForCategory(eligibilityCategory);

  // Handle invalid input
  if (typeof totalDaysInUSA !== 'number' || isNaN(totalDaysInUSA)) {
    return {
      requiredDays,
      percentageComplete: 0,
      daysRemaining: requiredDays,
      status: 'on_track',
    };
  }

  const daysPresent = Math.max(0, totalDaysInUSA);
  const percentageComplete = Math.min(
    100,
    Math.round((daysPresent / requiredDays) * 100 * 10) / 10,
  );
  const daysRemaining = Math.max(0, requiredDays - daysPresent);
  const status: PresenceStatusDetails['status'] =
    daysPresent >= requiredDays ? 'requirement_met' : 'on_track';

  return {
    requiredDays,
    percentageComplete,
    daysRemaining,
    status,
  };
}

export function checkContinuousResidence(trips: Trip[]): ContinuousResidenceWarningSimple[] {
  if (!trips || !Array.isArray(trips) || trips.length === 0) {
    return [];
  }

  const actualTrips = trips.filter(isValidTripForResidenceCheck);

  const warnings: ContinuousResidenceWarningSimple[] = [];

  for (const trip of actualTrips) {
    const departureDate = parseUTCDate(trip.departureDate);
    const returnDate = parseUTCDate(trip.returnDate);

    // USCIS uses the same rule for continuous residence as physical presence:
    // departure and return days count as days present in the USA
    const daysAbroad = differenceInDays(returnDate, departureDate) - 1;

    if (isNaN(daysAbroad) || daysAbroad < 0) {
      continue;
    }

    const warning = createResidenceWarning(trip.id, daysAbroad);
    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}

export function isEligibleForEarlyFiling(
  greenCardDate: string,
  eligibilityCategory: 'three_year' | 'five_year',
  asOfDate: string,
): boolean {
  if (!greenCardDate || !asOfDate) {
    return false;
  }

  if (
    !eligibilityCategory ||
    (eligibilityCategory !== 'three_year' && eligibilityCategory !== 'five_year')
  ) {
    return false;
  }

  try {
    const { earliestFilingDate } = calculateEligibilityDates(greenCardDate, eligibilityCategory);
    const currentDateParsed = parseUTCDate(asOfDate);
    const earliestFilingDateParsed = parseUTCDate(earliestFilingDate);

    if (!isValid(currentDateParsed) || !isValid(earliestFilingDateParsed)) {
      return false;
    }

    return (
      isAfter(currentDateParsed, earliestFilingDateParsed) ||
      isEqual(currentDateParsed, earliestFilingDateParsed)
    );
  } catch {
    // USCIS requires strict date validation - any malformed data should
    // prevent filing rather than risk an invalid application
    return false;
  }
}

// Helper functions
function getRequiredDaysForCategory(eligibilityCategory: 'three_year' | 'five_year'): number {
  return eligibilityCategory === 'five_year'
    ? PHYSICAL_PRESENCE_REQUIREMENTS.FIVE_YEAR_PATH
    : PHYSICAL_PRESENCE_REQUIREMENTS.THREE_YEAR_PATH;
}

function validateEligibilityCategory(eligibilityCategory: unknown): void {
  if (
    !eligibilityCategory ||
    (eligibilityCategory !== 'three_year' && eligibilityCategory !== 'five_year')
  ) {
    throw new Error('Invalid eligibility category');
  }
}
