// External dependencies
import { addDays, isAfter, isBefore, isEqual, isValid } from 'date-fns';

// Internal dependencies - Schemas & Types
import {
  ContinuousResidenceWarningSimple,
  ValidatedDateRange as DateValidationResult,
} from '@schemas/presence';
import { Trip } from '@schemas/trip';

// Internal dependencies - Constants
import { CONTINUOUS_RESIDENCE_THRESHOLDS } from '@constants/index';

// Internal dependencies - Utilities
import { parseUTCDate, formatUTCDate } from '@utils/utc-date-helpers';

// Export functions in alphabetical order
// USCIS mandates that departure and return days count as present in the US,
// regardless of actual departure/arrival times during those days
export function calculateTripDaysAbroad(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  daysAbroadSet: Set<string>,
): void {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  // Skip trips outside our date range
  if (isBefore(returnDate, startDate) || isAfter(departureDate, endDate)) {
    return;
  }

  // Calculate the actual period to count
  const countStartDate = isAfter(departureDate, startDate) ? departureDate : startDate;
  const countEndDate = isBefore(returnDate, endDate) ? returnDate : endDate;

  // Handle same-day trips
  if (isEqual(countStartDate, countEndDate)) {
    return; // No days abroad for same-day trips
  }

  // When someone obtains their green card while already abroad, USCIS considers
  // them absent on the green card date itself, as they weren't physically present
  // in the US to receive it
  const startedBeforeGreenCard = isBefore(departureDate, startDate);
  let currentDate = startedBeforeGreenCard ? countStartDate : addDays(countStartDate, 1);

  // USCIS counts all days up to and including the date of application/calculation,
  // even if the person is still abroad on that date
  const tripExtendsBeyondAsOfDate = isAfter(returnDate, endDate);

  while (
    isBefore(currentDate, countEndDate) ||
    (tripExtendsBeyondAsOfDate && isEqual(currentDate, countEndDate))
  ) {
    const dateStr = formatUTCDate(currentDate);
    daysAbroadSet.add(dateStr);
    currentDate = addDays(currentDate, 1);
  }
}

export function createResidenceWarning(
  tripId: string,
  daysAbroad: number,
): ContinuousResidenceWarningSimple | null {
  if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.HIGH_RISK) {
    return {
      tripId,
      daysAbroad,
      message: `This trip of ${daysAbroad} days exceeds ${CONTINUOUS_RESIDENCE_THRESHOLDS.HIGH_RISK} days and may break continuous residence`,
      severity: 'high',
    };
  } else if (daysAbroad >= CONTINUOUS_RESIDENCE_THRESHOLDS.MEDIUM_RISK) {
    return {
      tripId,
      daysAbroad,
      message: `This trip of ${daysAbroad} days is approaching the ${CONTINUOUS_RESIDENCE_THRESHOLDS.HIGH_RISK}-day limit for continuous residence`,
      severity: 'medium',
    };
  }
  return null;
}

// Re-export validation functions from utility for backward compatibility
export { isValidTrip, isValidTripForResidenceCheck } from '@utils/validation';

export function validateAndParseDates(
  greenCardDate: string,
  asOfDate: string,
): DateValidationResult {
  if (!greenCardDate || !asOfDate) {
    return { startDate: new Date(), endDate: new Date(), isValid: false };
  }

  const greenCardParsedDate = parseUTCDate(greenCardDate);
  const asOfParsedDate = parseUTCDate(asOfDate);

  if (
    !isValid(greenCardParsedDate) ||
    !isValid(asOfParsedDate) ||
    isBefore(asOfParsedDate, greenCardParsedDate)
  ) {
    return { startDate: greenCardParsedDate, endDate: asOfParsedDate, isValid: false };
  }

  return { startDate: greenCardParsedDate, endDate: asOfParsedDate, isValid: true };
}
