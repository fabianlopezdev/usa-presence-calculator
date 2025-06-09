// External dependencies
import { differenceInDays, isAfter, isBefore, isEqual, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Internal dependencies - Schemas & Types
import { TravelStreak } from '@schemas/travel-analytics';
import { CountryData, TripDateRange, YearBoundaries } from '@schemas/travel-analytics-helpers';
import { Trip } from '@schemas/trip';

// Internal dependencies - Business Logic
// None needed

// Internal dependencies - Constants
import {
  CONTINUOUS_RESIDENCE_REQUIREMENTS,
  PHYSICAL_PRESENCE_REQUIREMENTS,
} from '@constants/index';

// Internal dependencies - Utilities
import { parseUTCDate, formatUTCDate } from '@utils/utc-date-helpers';
import { isValidTrip } from '@utils/validation';

// Export functions in alphabetical order
export function calculateAnniversaryDate(greenCardDate: Date, yearsRequired: number): Date {
  // Use UTC methods to avoid timezone issues
  const year = greenCardDate.getUTCFullYear() + yearsRequired;
  const month = greenCardDate.getUTCMonth();
  const day = greenCardDate.getUTCDate();

  // Handle leap year edge case: if green card was issued on Feb 29,
  // and the anniversary year is not a leap year, use Feb 28
  if (month === 1 && day === 29) {
    // February is month 1 (0-indexed)
    // Check if the target year is a leap year
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!isLeapYear) {
      // For non-leap years, use Feb 28 in UTC
      return new Date(Date.UTC(year, 1, 28));
    }
  }

  // Create date in UTC to ensure consistent calculations
  return new Date(Date.UTC(year, month, day));
}

export function calculateDaysAbroadInYear(trip: Trip, yearBoundaries: YearBoundaries): number {
  const dates = parseTripDates(trip);
  if (!dates) return 0;

  const { departure, returnDate } = dates;
  const { yearStart, yearEnd } = yearBoundaries;

  if (!isWithinYearBoundaries(departure, returnDate, yearStart, yearEnd)) {
    return 0;
  }

  const effectiveDates = getEffectiveTripDates(departure, returnDate, yearStart, yearEnd);
  if (!effectiveDates) return 0;

  const { effectiveStart, effectiveEnd } = effectiveDates;
  const adjustment = calculateBoundaryAdjustment(
    effectiveStart,
    effectiveEnd,
    departure,
    returnDate,
    yearStart,
    yearEnd,
  );

  if (adjustment === -1) return 0;

  const totalDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
  return Math.max(0, totalDays - adjustment);
}

export function calculateTotalInclusiveDays(departureDate: Date, returnDate: Date): number {
  return differenceInDays(returnDate, departureDate) + 1;
}

// USCIS mandates that departure and return days count as present in the USA,
// so we must exclude both days from the abroad count
export function calculateTripDaysAbroadExcludingTravelDays(
  departureDate: Date,
  returnDate: Date,
): number {
  if (differenceInDays(returnDate, departureDate) === 0) {
    return 0;
  }

  const totalInclusiveDays = differenceInDays(returnDate, departureDate) + 1;
  return Math.max(0, totalInclusiveDays - 2);
}

export function createPresenceStreak(
  startDate: Date | string,
  endDate: Date | string,
  description: string,
  type: 'in_usa' | 'traveling' | 'travel_free_months' = 'in_usa',
): TravelStreak {
  const start = typeof startDate === 'string' ? startDate : formatUTCDate(startDate);
  const end = typeof endDate === 'string' ? endDate : formatUTCDate(endDate);
  const startParsed = typeof startDate === 'string' ? parseUTCDate(startDate) : startDate;
  const endParsed = typeof endDate === 'string' ? parseUTCDate(endDate) : endDate;

  // Calculate days using millisecond math to avoid timezone conversions
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(endParsed.getTime() - startParsed.getTime());
  const days = Math.round(diffTime / millisecondsPerDay) + 1;

  return {
    type,
    startDate: start,
    endDate: end,
    duration: days,
    description: description.replace('{days}', days.toString()),
  };
}

export function formatDateRange(departureDate: string, returnDate: string): string {
  const departure = parseUTCDate(departureDate);
  const returnParsed = parseUTCDate(returnDate);

  // Define the UTC time zone
  const timeZone = 'Etc/UTC';

  // Format both dates using the UTC time zone
  const departureFormatted = formatInTimeZone(departure, timeZone, 'MMM d');
  const returnFormatted = formatInTimeZone(returnParsed, timeZone, 'MMM d, yyyy');

  return `${departureFormatted} - ${returnFormatted}`;
}

// Filters trips to only include actual (non-simulated) trips that pass validation
export function getActualValidTrips(trips: Trip[]): Trip[] {
  if (!trips || !Array.isArray(trips)) {
    return [];
  }
  return trips.filter((trip) => !trip.isSimulated && isValidTrip(trip));
}

export function getDefaultCountryData(): CountryData {
  return {
    totalDays: 0,
    tripCount: 0,
    lastVisited: null,
  };
}

export function getRequiredDays(eligibilityCategory: 'three_year' | 'five_year'): number {
  return eligibilityCategory === 'five_year'
    ? PHYSICAL_PRESENCE_REQUIREMENTS.FIVE_YEAR_PATH
    : PHYSICAL_PRESENCE_REQUIREMENTS.THREE_YEAR_PATH;
}

export function getRequiredYears(eligibilityCategory: 'three_year' | 'five_year'): number {
  return eligibilityCategory === 'five_year'
    ? CONTINUOUS_RESIDENCE_REQUIREMENTS.FIVE_YEAR_PATH
    : CONTINUOUS_RESIDENCE_REQUIREMENTS.THREE_YEAR_PATH;
}

export function getYearBoundaries(
  year: number,
  startYear: number,
  endYear: number,
  startDate: Date,
  endDate: Date,
): YearBoundaries {
  const yearStart = year === startYear ? startDate : new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const yearEnd = year === endYear ? endDate : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  return { yearStart, yearEnd };
}

// Re-export from validation utility for backward compatibility
export { isValidTripForRiskAssessment } from '@utils/validation';

export function parseTripDates(trip: Trip): TripDateRange | null {
  const departure = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  if (!isValid(departure) || !isValid(returnDate)) {
    return null;
  }

  return { departure, returnDate };
}

export function updateCountryData(
  existingData: CountryData,
  daysAbroad: number,
  returnDate: Date,
): CountryData {
  return {
    totalDays: existingData.totalDays + daysAbroad,
    tripCount: existingData.tripCount + 1,
    lastVisited:
      !existingData.lastVisited || isAfter(returnDate, existingData.lastVisited)
        ? returnDate
        : existingData.lastVisited,
  };
}

// Helper functions
function isWithinYearBoundaries(
  departure: Date,
  returnDate: Date,
  yearStart: Date,
  yearEnd: Date,
): boolean {
  return isAfter(returnDate, yearStart) && isBefore(departure, yearEnd);
}

function getEffectiveTripDates(
  departure: Date,
  returnDate: Date,
  yearStart: Date,
  yearEnd: Date,
): { effectiveStart: Date; effectiveEnd: Date } | null {
  const effectiveStart = isAfter(departure, yearStart) ? departure : yearStart;
  const effectiveEnd = isBefore(returnDate, yearEnd) ? returnDate : yearEnd;

  if (!isAfter(effectiveEnd, effectiveStart) && !isEqual(effectiveEnd, effectiveStart)) {
    return null;
  }

  return { effectiveStart, effectiveEnd };
}

function calculateBoundaryAdjustment(
  effectiveStart: Date,
  effectiveEnd: Date,
  departure: Date,
  returnDate: Date,
  yearStart: Date,
  yearEnd: Date,
): number {
  const isStartAtBoundary = isEqual(effectiveStart, yearStart) && isBefore(departure, yearStart);
  const isEndAtBoundary = isEqual(effectiveEnd, yearEnd) && isAfter(returnDate, yearEnd);

  if (isEqual(effectiveStart, effectiveEnd)) {
    return isStartAtBoundary || isEndAtBoundary ? 0 : -1;
  }

  let adjustmentDays = 0;
  if (!isStartAtBoundary && isEqual(effectiveStart, departure)) {
    adjustmentDays++;
  }
  if (!isEndAtBoundary && isEqual(effectiveEnd, returnDate)) {
    adjustmentDays++;
  }

  return adjustmentDays;
}
