// External dependencies
import { isAfter, isValid } from 'date-fns';

// Internal dependencies - Schemas
import { TripValidationRequirements } from '@schemas/calculation-helpers';
import { Trip } from '@schemas/trip';

// Internal dependencies - Utilities
import { parseDate } from './date-helpers';

// Re-export types for backward compatibility
export type { TripValidationRequirements } from '@schemas/calculation-helpers';

// Exported functions (alphabetical)

export function filterValidTrips(
  trips: unknown[],
  requirements: TripValidationRequirements = {},
): Trip[] {
  if (!Array.isArray(trips)) return [];

  return trips.filter((trip): trip is Trip => {
    if (!trip || typeof trip !== 'object') return false;
    return validateTripForCalculation(trip as Trip, requirements);
  });
}

export function getActualValidTrips(trips: Trip[]): Trip[] {
  return filterValidTrips(trips, {
    allowSimulated: false,
    checkDates: true,
  });
}

export function getSimulatedValidTrips(trips: Trip[]): Trip[] {
  if (!Array.isArray(trips)) return [];

  return trips.filter(
    (trip) =>
      trip &&
      trip.isSimulated &&
      validateTripForCalculation(trip, {
        allowSimulated: true,
        checkDates: true,
      }),
  );
}

export function isValidTrip(trip: unknown): trip is Trip {
  if (!trip || typeof trip !== 'object') return false;

  const t = trip as Trip;

  if (!t.departureDate || !t.returnDate) return false;

  if (t.isSimulated) return false;

  const departure = parseDate(t.departureDate);
  const returnDate = parseDate(t.returnDate);

  return isValid(departure) && isValid(returnDate) && !isAfter(departure, returnDate);
}

export function isValidTripForResidenceCheck(trip: Trip): boolean {
  return validateTripForCalculation(trip, {
    needsId: true,
    allowSimulated: false,
    checkDates: true,
  });
}

export function isValidTripForRiskAssessment(trip: Trip): boolean {
  // Risk assessments require simulated trips
  if (!trip || !trip.isSimulated) return false;

  return validateTripForCalculation(trip, {
    needsId: true,
    allowSimulated: true,
    checkDates: true,
  });
}

export function isValidTripWithId(trip: unknown): trip is Trip & { id: string } {
  if (!isValidTrip(trip)) return false;

  const t = trip;
  return typeof t.id === 'string' && t.id.length > 0;
}

export function validateTripForCalculation(
  trip: Trip,
  requirements: TripValidationRequirements = {},
): boolean {
  if (!trip || typeof trip !== 'object') return false;

  return meetsAllRequirements(trip, requirements);
}

// Non-exported functions (alphabetical)

function hasValidDates(trip: Trip): boolean {
  if (!trip.departureDate || !trip.returnDate) return false;

  const departure = parseDate(trip.departureDate);
  const returnDate = parseDate(trip.returnDate);

  if (!isValid(departure) || !isValid(returnDate)) return false;
  if (isAfter(departure, returnDate)) return false;

  return true;
}

function hasValidId(trip: Trip, needsId: boolean): boolean {
  if (!needsId) return true;
  return typeof trip.id === 'string' && trip.id.length > 0;
}

function hasValidLocation(trip: Trip, needsLocation: boolean): boolean {
  if (!needsLocation) return true;
  return typeof trip.location === 'string' && trip.location.length > 0;
}

function meetsAllRequirements(trip: Trip, requirements: TripValidationRequirements): boolean {
  const {
    needsId = false,
    needsLocation = false,
    allowSimulated = false,
    checkDates = true,
  } = requirements;

  return (
    hasValidId(trip, needsId) &&
    hasValidLocation(trip, needsLocation) &&
    (allowSimulated || !trip.isSimulated) &&
    (!checkDates || hasValidDates(trip))
  );
}
