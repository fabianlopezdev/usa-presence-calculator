// External dependencies
import { differenceInDays, max, min } from 'date-fns';

// Internal dependencies - Schemas
import { TripDurationOptions } from '@schemas/calculation-helpers';
import { Trip } from '@schemas/trip';

// Internal dependencies - Utilities
import { parseUTCDate } from './utc-date-helpers';

// Re-export types for backward compatibility
export type { TripDurationOptions } from '@schemas/calculation-helpers';

export function calculateTripDuration(trip: Trip, options: TripDurationOptions = {}): number {
  const { includeDepartureDay = true, includeReturnDay = true } = options;

  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  // Same day trips always count as 0 days abroad per USCIS
  if (differenceInDays(returnDate, departureDate) === 0) {
    return 0;
  }

  const totalInclusiveDays = differenceInDays(returnDate, departureDate) + 1;

  let daysAbroad = totalInclusiveDays;

  // USCIS rule: departure and return days count as days IN the USA
  if (includeDepartureDay) {
    daysAbroad -= 1;
  }
  if (includeReturnDay) {
    daysAbroad -= 1;
  }

  return Math.max(0, daysAbroad);
}

export function calculateTripDaysExcludingTravel(trip: Trip): number {
  return calculateTripDuration(trip, {
    includeDepartureDay: false,
    includeReturnDay: false,
  });
}

export function calculateTripDaysInPeriod(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  options: TripDurationOptions = {},
): number {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  if (returnDate < startDate || departureDate > endDate) {
    return 0;
  }

  const effectiveStart = max([departureDate, startDate]);
  const effectiveEnd = min([returnDate, endDate]);

  const boundedTrip: Trip = {
    ...trip,
    departureDate: effectiveStart.toISOString().split('T')[0],
    returnDate: effectiveEnd.toISOString().split('T')[0],
  };

  return calculateTripDuration(boundedTrip, options);
}

export function calculateTripDaysInYear(
  trip: Trip,
  year: number,
  options: TripDurationOptions = {},
): number {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  return calculateTripDaysInPeriod(trip, yearStart, yearEnd, options);
}

export function populateTripDaysSet(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  daysSet: Set<string>,
  options: TripDurationOptions = {},
): void {
  const { includeDepartureDay = true, includeReturnDay = true } = options;

  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  if (returnDate < startDate || departureDate > endDate) {
    return;
  }

  const effectiveStart = max([departureDate, startDate]);
  const effectiveEnd = min([returnDate, endDate]);

  const currentDate = new Date(effectiveStart);
  while (currentDate <= effectiveEnd) {
    if (
      shouldCountAsAbroad(
        currentDate,
        departureDate,
        returnDate,
        effectiveStart,
        includeDepartureDay,
        includeReturnDay,
        startDate,
        endDate,
      )
    ) {
      daysSet.add(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }
}

// Non-exported functions

function shouldCountAsAbroad(
  currentDate: Date,
  departureDate: Date,
  returnDate: Date,
  effectiveStart: Date,
  includeDepartureDay: boolean,
  includeReturnDay: boolean,
  startDate: Date,
  endDate: Date,
): boolean {
  if (currentDate < startDate || currentDate > endDate) {
    return false;
  }

  const currentTime = currentDate.getTime();
  const isDepartureDay =
    currentTime === departureDate.getTime() || currentTime === effectiveStart.getTime();
  const isReturnDay = currentTime === returnDate.getTime();

  // USCIS rule: only count as abroad if not a travel day that counts as USA
  if (isDepartureDay && includeDepartureDay) return false;
  if (isReturnDay && includeReturnDay) return false;

  return true;
}
