/**
 * Unified Validation Utilities
 *
 * This module consolidates trip validation functions used throughout the application,
 * providing a single source of truth for validation logic.
 */

// External dependencies
import { isAfter, isValid } from 'date-fns';

// Internal dependencies - Schemas
import { Trip } from '@schemas/trip';

// Internal dependencies - Utilities
import { parseDate } from './date-helpers';

/**
 * Trip validation requirements interface
 */
export interface TripValidationRequirements {
  /** Whether the trip must have an ID */
  needsId?: boolean;
  /** Whether the trip must have a location */
  needsLocation?: boolean;
  /** Whether simulated trips are allowed */
  allowSimulated?: boolean;
  /** Whether to check date validity */
  checkDates?: boolean;
}

/**
 * Check if a value is a valid Trip object
 *
 * @param trip - The value to check
 * @returns True if valid Trip
 */
export function isValidTrip(trip: unknown): trip is Trip {
  if (!trip || typeof trip !== 'object') return false;

  const t = trip as Trip;

  // Check required fields exist
  if (!t.departureDate || !t.returnDate) return false;

  // Don't validate simulated trips by default
  if (t.isSimulated) return false;

  // Validate dates
  const departure = parseDate(t.departureDate);
  const returnDate = parseDate(t.returnDate);

  return isValid(departure) && isValid(returnDate) && !isAfter(departure, returnDate);
}

/**
 * Check if a trip has a valid ID
 *
 * @param trip - The trip to check
 * @returns True if trip has valid ID
 */
export function isValidTripWithId(trip: unknown): trip is Trip & { id: string } {
  if (!isValidTrip(trip)) return false;

  const t = trip;
  return typeof t.id === 'string' && t.id.length > 0;
}

/**
 * Validate a trip for specific calculation requirements
 *
 * @param trip - The trip to validate
 * @param requirements - Specific validation requirements
 * @returns True if trip meets all requirements
 */
/**
 * Helper to validate trip ID
 */
function hasValidId(trip: Trip, needsId: boolean): boolean {
  if (!needsId) return true;
  return typeof trip.id === 'string' && trip.id.length > 0;
}

/**
 * Helper to validate trip location
 */
function hasValidLocation(trip: Trip, needsLocation: boolean): boolean {
  if (!needsLocation) return true;
  return typeof trip.location === 'string' && trip.location.length > 0;
}

/**
 * Helper to validate trip dates
 */
function hasValidDates(trip: Trip): boolean {
  if (!trip.departureDate || !trip.returnDate) return false;

  const departure = parseDate(trip.departureDate);
  const returnDate = parseDate(trip.returnDate);

  if (!isValid(departure) || !isValid(returnDate)) return false;
  if (isAfter(departure, returnDate)) return false;

  return true;
}

/**
 * Helper to check all requirements
 */
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

export function validateTripForCalculation(
  trip: Trip,
  requirements: TripValidationRequirements = {},
): boolean {
  // Basic object validation
  if (!trip || typeof trip !== 'object') return false;

  return meetsAllRequirements(trip, requirements);
}

/**
 * Validate a trip for continuous residence checks
 * Requires: valid dates, trip ID, and non-simulated
 *
 * @param trip - The trip to validate
 * @returns True if valid for residence checks
 */
export function isValidTripForResidenceCheck(trip: Trip): boolean {
  return validateTripForCalculation(trip, {
    needsId: true,
    allowSimulated: false,
    checkDates: true,
  });
}

/**
 * Validate a trip for risk assessment
 * Requires: valid dates, trip ID, and MUST be simulated
 *
 * @param trip - The trip to validate
 * @returns True if valid for risk assessment
 */
export function isValidTripForRiskAssessment(trip: Trip): boolean {
  // Risk assessments are specifically for simulated trips
  if (!trip || !trip.isSimulated) return false;

  return validateTripForCalculation(trip, {
    needsId: true,
    allowSimulated: true,
    checkDates: true,
  });
}

/**
 * Filter an array to only valid trips
 *
 * @param trips - Array of potential trips
 * @param requirements - Validation requirements
 * @returns Array of valid trips
 */
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

/**
 * Get actual (non-simulated) valid trips
 *
 * @param trips - Array of trips
 * @returns Array of actual valid trips
 */
export function getActualValidTrips(trips: Trip[]): Trip[] {
  return filterValidTrips(trips, {
    allowSimulated: false,
    checkDates: true,
  });
}

/**
 * Get simulated valid trips
 *
 * @param trips - Array of trips
 * @returns Array of simulated valid trips
 */
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
