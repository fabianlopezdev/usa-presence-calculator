import { parseISO, isAfter, isBefore, isEqual, addDays, isValid } from 'date-fns';
import { Trip } from '@schemas/trip';

interface DateValidationResult {
  startDate: Date;
  endDate: Date;
  isValid: boolean;
}

interface ContinuousResidenceWarning {
  tripId: string;
  daysAbroad: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export function validateAndParseDates(
  greenCardDate: string,
  asOfDate: string,
): DateValidationResult {
  if (!greenCardDate || !asOfDate) {
    return { startDate: new Date(), endDate: new Date(), isValid: false };
  }

  const greenCardParsedDate = parseISO(greenCardDate);
  const asOfParsedDate = parseISO(asOfDate);

  if (
    !isValid(greenCardParsedDate) ||
    !isValid(asOfParsedDate) ||
    isBefore(asOfParsedDate, greenCardParsedDate)
  ) {
    return { startDate: greenCardParsedDate, endDate: asOfParsedDate, isValid: false };
  }

  return { startDate: greenCardParsedDate, endDate: asOfParsedDate, isValid: true };
}

export function isValidTrip(trip: Trip): boolean {
  if (!trip || trip.isSimulated) return false;
  if (!trip.departureDate || !trip.returnDate) return false;

  const departure = parseISO(trip.departureDate);
  const returnDate = parseISO(trip.returnDate);

  return isValid(departure) && isValid(returnDate) && !isAfter(departure, returnDate);
}

// USCIS mandates that departure and return days count as present in the US,
// regardless of actual departure/arrival times during those days
export function calculateTripDaysAbroad(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  daysAbroadSet: Set<string>,
): void {
  const departureDate = parseISO(trip.departureDate);
  const returnDate = parseISO(trip.returnDate);

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
    const dateStr = currentDate.toISOString().split('T')[0];
    daysAbroadSet.add(dateStr);
    currentDate = addDays(currentDate, 1);
  }
}

export function createResidenceWarning(
  tripId: string,
  daysAbroad: number,
): ContinuousResidenceWarning | null {
  if (daysAbroad >= 180) {
    return {
      tripId,
      daysAbroad,
      message: `This trip of ${daysAbroad} days exceeds 180 days and may break continuous residence`,
      severity: 'high',
    };
  } else if (daysAbroad >= 150) {
    return {
      tripId,
      daysAbroad,
      message: `This trip of ${daysAbroad} days is approaching the 180-day limit for continuous residence`,
      severity: 'medium',
    };
  }
  return null;
}

// Trip ID is required for continuous residence warnings to allow users
// to identify which specific trip triggered the warning
export function isValidTripForResidenceCheck(trip: Trip): boolean {
  if (!trip || trip.isSimulated) return false;
  if (!trip.id || !trip.departureDate || !trip.returnDate) return false;

  const departure = parseISO(trip.departureDate);
  const returnDate = parseISO(trip.returnDate);

  return isValid(departure) && isValid(returnDate) && !isAfter(departure, returnDate);
}
