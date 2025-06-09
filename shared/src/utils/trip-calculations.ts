/**
 * Trip Duration Calculation Utilities
 *
 * Unified utilities for calculating trip durations with USCIS rule compliance.
 * These utilities consolidate various trip calculation methods used throughout
 * the application, ensuring consistent application of USCIS rules.
 *
 * USCIS Rule: Departure and return days count as days IN the USA
 */

// External dependencies
import { differenceInDays, max, min } from 'date-fns';

// Internal dependencies - Schemas
import { Trip } from '@schemas/trip';

// Internal dependencies - Utilities
import { parseUTCDate } from './utc-date-helpers';

/**
 * Options for trip duration calculations
 */
export interface TripDurationOptions {
  /**
   * Whether to include departure day as a day in USA
   * @default true (USCIS rule)
   */
  includeDepartureDay?: boolean;

  /**
   * Whether to include return day as a day in USA
   * @default true (USCIS rule)
   */
  includeReturnDay?: boolean;

  /**
   * Start boundary for period-specific calculations
   */
  startBoundary?: Date;

  /**
   * End boundary for period-specific calculations
   */
  endBoundary?: Date;
}

/**
 * Calculate total duration of a trip in days
 *
 * @param trip - The trip to calculate duration for
 * @param options - Options for calculation
 * @returns Number of days abroad
 */
export function calculateTripDuration(trip: Trip, options: TripDurationOptions = {}): number {
  const { includeDepartureDay = true, includeReturnDay = true } = options;

  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  // Same day trips always count as 0 days abroad
  if (differenceInDays(returnDate, departureDate) === 0) {
    return 0;
  }

  // Calculate total inclusive days (including both departure and return)
  const totalInclusiveDays = differenceInDays(returnDate, departureDate) + 1;

  // Start with all days as abroad
  let daysAbroad = totalInclusiveDays;

  // Apply USCIS rules:
  // If departure day counts as USA day, subtract 1 from abroad count
  if (includeDepartureDay) {
    daysAbroad -= 1;
  }

  // If return day counts as USA day, subtract 1 from abroad count
  if (includeReturnDay) {
    daysAbroad -= 1;
  }

  return Math.max(0, daysAbroad);
}

/**
 * Calculate days abroad for a trip within a specific period
 *
 * @param trip - The trip to calculate duration for
 * @param startDate - Start of the period
 * @param endDate - End of the period
 * @param options - Options for calculation
 * @returns Number of days abroad within the period
 */
export function calculateTripDaysInPeriod(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  options: TripDurationOptions = {},
): number {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  // Trip is completely outside the period
  if (returnDate < startDate || departureDate > endDate) {
    return 0;
  }

  // Calculate effective dates within the period
  const effectiveStart = max([departureDate, startDate]);
  const effectiveEnd = min([returnDate, endDate]);

  // Create a temporary trip with bounded dates
  const boundedTrip: Trip = {
    ...trip,
    departureDate: effectiveStart.toISOString().split('T')[0],
    returnDate: effectiveEnd.toISOString().split('T')[0],
  };

  return calculateTripDuration(boundedTrip, options);
}

/**
 * Calculate days abroad excluding travel days (departure and return)
 * This is useful for certain calculations that don't follow standard USCIS rules
 *
 * @param trip - The trip to calculate duration for
 * @returns Number of days abroad excluding travel days
 */
export function calculateTripDaysExcludingTravel(trip: Trip): number {
  return calculateTripDuration(trip, {
    includeDepartureDay: false,
    includeReturnDay: false,
  });
}

/**
 * Calculate trip days for a specific year
 *
 * @param trip - The trip to calculate duration for
 * @param year - The year to calculate for
 * @param options - Options for calculation
 * @returns Number of days abroad in the specified year
 */
export function calculateTripDaysInYear(
  trip: Trip,
  year: number,
  options: TripDurationOptions = {},
): number {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));

  return calculateTripDaysInPeriod(trip, yearStart, yearEnd, options);
}

/**
 * Get trip days for each day in a period (for detailed tracking)
 *
 * @param trip - The trip to process
 * @param startDate - Start of the period
 * @param endDate - End of the period
 * @param daysSet - Set to populate with days abroad
 * @returns The updated Set of days
 */
export function populateTripDaysSet(
  trip: Trip,
  startDate: Date,
  endDate: Date,
  daysSet: Set<string> = new Set(),
): Set<string> {
  const departureDate = parseUTCDate(trip.departureDate);
  const returnDate = parseUTCDate(trip.returnDate);

  // Skip if trip is outside period
  if (returnDate < startDate || departureDate > endDate) {
    return daysSet;
  }

  // Calculate effective dates
  const effectiveStart = max([departureDate, startDate]);
  const effectiveEnd = min([returnDate, endDate]);

  // Add each day to the set (excluding departure and return per USCIS rules)
  const current = new Date(effectiveStart);
  current.setUTCDate(current.getUTCDate() + 1); // Skip departure day

  while (current < effectiveEnd) {
    daysSet.add(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return daysSet;
}
