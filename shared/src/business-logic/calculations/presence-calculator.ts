import { differenceInDays, parseISO, addYears, subDays, isAfter, isEqual, isValid } from 'date-fns';
import { Trip } from '@schemas/trip';
import {
  validateAndParseDates,
  isValidTrip,
  calculateTripDaysAbroad,
  createResidenceWarning,
  isValidTripForResidenceCheck,
} from './presence-calculator-helpers';

interface PresenceCalculation {
  totalDaysInUSA: number;
  totalDaysAbroad: number;
}

interface PresenceStatus {
  requiredDays: number;
  percentageComplete: number;
  daysRemaining: number;
  status: 'on_track' | 'at_risk' | 'requirement_met';
}

interface ContinuousResidenceWarning {
  tripId: string;
  daysAbroad: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface EligibilityDates {
  eligibilityDate: string;
  earliestFilingDate: string;
}

export function calculateDaysOfPhysicalPresence(
  trips: Trip[],
  greenCardDate: string,
  asOfDate: string,
): PresenceCalculation {
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

export function calculatePresenceStatus(
  totalDaysInUSA: number,
  eligibilityCategory: 'three_year' | 'five_year',
): PresenceStatus {
  // Validate eligibility category
  if (
    !eligibilityCategory ||
    (eligibilityCategory !== 'three_year' && eligibilityCategory !== 'five_year')
  ) {
    throw new Error('Invalid eligibility category');
  }

  // Handle invalid input
  if (typeof totalDaysInUSA !== 'number' || isNaN(totalDaysInUSA)) {
    return {
      requiredDays: eligibilityCategory === 'five_year' ? 913 : 548,
      percentageComplete: 0,
      daysRemaining: eligibilityCategory === 'five_year' ? 913 : 548,
      status: 'on_track',
    };
  }

  // Handle negative days as zero
  const daysPresent = Math.max(0, totalDaysInUSA);

  // Calculate required days based on eligibility category
  const requiredDays =
    eligibilityCategory === 'five_year'
      ? 913 // 913 days for 5-year path (2.5 years)
      : 548; // 548 days for 3-year path (1.5 years)

  const percentageComplete = Math.min(
    100,
    Math.round((daysPresent / requiredDays) * 100 * 10) / 10,
  );
  const daysRemaining = Math.max(0, requiredDays - daysPresent);

  const status: PresenceStatus['status'] =
    daysPresent >= requiredDays ? 'requirement_met' : 'on_track';

  return {
    requiredDays,
    percentageComplete,
    daysRemaining,
    status,
  };
}

export function checkContinuousResidence(trips: Trip[]): ContinuousResidenceWarning[] {
  if (!trips || !Array.isArray(trips) || trips.length === 0) {
    return [];
  }

  const actualTrips = trips.filter(isValidTripForResidenceCheck);

  const warnings: ContinuousResidenceWarning[] = [];

  for (const trip of actualTrips) {
    const departureDate = parseISO(trip.departureDate);
    const returnDate = parseISO(trip.returnDate);

    // USCIS counts both departure and return days when determining if
    // continuous residence is broken (different from physical presence rules)
    const daysAbroad = differenceInDays(returnDate, departureDate);

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

  const greenCardParsedDate = parseISO(greenCardDate);

  if (!isValid(greenCardParsedDate)) {
    throw new Error('Invalid green card date format');
  }

  const yearsRequired = eligibilityCategory === 'five_year' ? 5 : 3;

  // USCIS handles leap year eligibility dates by using the last day of February
  // in non-leap years, avoiding the need to subtract an additional day
  const anniversaryDate = addYears(greenCardParsedDate, yearsRequired);
  const greenCardDayOfMonth = greenCardParsedDate.getDate();
  const anniversaryDayOfMonth = anniversaryDate.getDate();

  // Feb 29 -> Feb 28 adjustment already happened via addYears, no need to subtract another day
  const eligibilityDate =
    greenCardDayOfMonth !== anniversaryDayOfMonth ? anniversaryDate : subDays(anniversaryDate, 1);

  // USCIS allows filing up to 90 days before the eligibility date to account for processing time
  const earliestFilingDate = subDays(eligibilityDate, 90);

  return {
    eligibilityDate: eligibilityDate.toISOString().split('T')[0],
    earliestFilingDate: earliestFilingDate.toISOString().split('T')[0],
  };
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
    const currentDateParsed = parseISO(asOfDate);
    const earliestFilingDateParsed = parseISO(earliestFilingDate);

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
