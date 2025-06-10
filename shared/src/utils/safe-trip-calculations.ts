import { z } from 'zod';

import { DATE_VALIDATION, TRIP_VALIDATION } from '@constants/validation-messages';
import { DateRangeError, err, ok, Result, TripValidationError } from '@errors/index';
import { TripDurationOptionsSchema } from '@schemas/calculation-helpers';
import { TripSchema } from '@schemas/trip';

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
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
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
  options?: unknown,
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDurationInputSchema.safeParse({ trip, options });

    if (!parseResult.success) {
      return err(
        new TripValidationError(TRIP_VALIDATION.INVALID_DURATION, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateTripDuration(validatedData.trip, validatedData.options);

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError(TRIP_VALIDATION.UNKNOWN_ERROR));
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
  options?: unknown,
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDaysInPeriodInputSchema.safeParse({
      trip,
      startDate,
      endDate,
      options,
    });

    if (!parseResult.success) {
      return err(
        new TripValidationError(TRIP_VALIDATION.INVALID_RANGE, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateTripDaysInPeriod(
      validatedData.trip,
      new Date(validatedData.startDate),
      new Date(validatedData.endDate),
      validatedData.options,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError(TRIP_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for calculateTripDaysInYear
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateTripDaysInYear(
  trip: unknown,
  year: unknown,
  options?: unknown,
): Result<number, TripValidationError | DateRangeError> {
  try {
    const parseResult = TripDaysInYearInputSchema.safeParse({
      trip,
      year,
      options,
    });

    if (!parseResult.success) {
      return err(
        new TripValidationError(TRIP_VALIDATION.INVALID_RANGE, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateTripDaysInYear(
      validatedData.trip,
      validatedData.year,
      validatedData.options,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new TripValidationError(error.message));
    }
    return err(new TripValidationError(TRIP_VALIDATION.UNKNOWN_ERROR));
  }
}
