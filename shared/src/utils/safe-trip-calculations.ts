import { z } from 'zod';

import { TripSchema } from '@schemas/trip';
import { TripDurationOptionsSchema } from '@schemas/calculation-helpers';
import { 
  DateRangeError,
  err,
  ok,
  Result,
  TripValidationError
} from '@errors/index';

import {
  calculateTripDaysInPeriod,
  calculateTripDaysInYear,
  calculateTripDuration,
} from './trip-calculations';

/**
 * Input validation schema for trip duration calculation
 */
const TripDurationInputSchema = z.object({
  trip: TripSchema,
  options: TripDurationOptionsSchema.optional(),
});

/**
 * Input validation schema for trip days in period calculation
 */
const TripDaysInPeriodInputSchema = z.object({
  trip: TripSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  options: TripDurationOptionsSchema.optional(),
});

/**
 * Input validation schema for trip days in year calculation
 */
const TripDaysInYearInputSchema = z.object({
  trip: TripSchema,
  year: z.number().int().min(1900).max(2100),
  options: TripDurationOptionsSchema.optional(),
});

/**
 * Safe wrapper for calculateTripDuration
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTripDuration(
  trip: unknown,
  options?: unknown
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDurationInputSchema.safeParse({ trip, options });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        'Invalid input for trip duration calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateTripDuration(
      validatedData.trip,
      validatedData.options
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError('Unknown error during trip duration calculation'));
  }
}

/**
 * Safe wrapper for calculateTripDaysInPeriod
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTripDaysInPeriod(
  trip: unknown,
  startDate: unknown,
  endDate: unknown,
  options?: unknown
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDaysInPeriodInputSchema.safeParse({
      trip,
      startDate,
      endDate,
      options,
    });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        'Invalid input for trip days in period calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateTripDaysInPeriod(
      validatedData.trip,
      new Date(validatedData.startDate),
      new Date(validatedData.endDate),
      validatedData.options
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError('Unknown error during trip days calculation'));
  }
}

/**
 * Safe wrapper for calculateTripDaysInYear
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTripDaysInYear(
  trip: unknown,
  year: unknown,
  options?: unknown
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDaysInYearInputSchema.safeParse({
      trip,
      year,
      options,
    });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        'Invalid input for trip days in year calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateTripDaysInYear(
      validatedData.trip,
      validatedData.year,
      validatedData.options
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError('Unknown error during trip year calculation'));
  }
}