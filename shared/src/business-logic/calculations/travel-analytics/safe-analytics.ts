import { z } from 'zod';

import { ANALYTICS_VALIDATION, DATE_VALIDATION } from '@constants/validation-messages';
import {
  DateRangeError,
  err,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError,
} from '@errors/index';
import { TripSchema } from '@schemas/trip';

import {
  assessUpcomingTripRisk,
  calculateCountryStatistics,
  calculateDaysAbroadByYear,
  projectEligibilityDate,
} from './analytics';
import type {
  CountryStatistics,
  TravelProjection,
  TripRiskAssessment,
  YearlyDaysAbroad,
} from '@schemas/travel-analytics';

/**
 * Input validation schema for upcoming trip risk assessment
 */
const UpcomingTripRiskInputSchema = z.object({
  upcomingTrips: z.array(TripSchema),
  currentTotalDaysAbroad: z.number().int().nonnegative(),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for country statistics calculation
 */
const CountryStatisticsInputSchema = z.object({
  trips: z.array(TripSchema),
});

/**
 * Input validation schema for days abroad by year calculation
 */
const DaysAbroadByYearInputSchema = z.object({
  trips: z.array(TripSchema),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Input validation schema for eligibility date projection
 */
const ProjectEligibilityDateInputSchema = z.object({
  trips: z.array(TripSchema),
  totalDaysInUSA: z.number().int().nonnegative(),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  currentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

/**
 * Safe wrapper for assessUpcomingTripRisk
 * Validates inputs and handles errors gracefully
 */
export function safeAssessUpcomingTripRisk(
  upcomingTrips: unknown,
  currentTotalDaysAbroad: unknown,
  eligibilityCategory: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
): Result<TripRiskAssessment[], TripValidationError | USCISCalculationError> {
  try {
    const parseResult = UpcomingTripRiskInputSchema.safeParse({
      upcomingTrips,
      currentTotalDaysAbroad,
      eligibilityCategory,
      greenCardDate,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new TripValidationError(ANALYTICS_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = assessUpcomingTripRisk(
      validatedData.upcomingTrips,
      validatedData.currentTotalDaysAbroad,
      validatedData.eligibilityCategory,
      validatedData.greenCardDate,
      validatedData.currentDate,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(ANALYTICS_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for calculateCountryStatistics
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateCountryStatistics(
  trips: unknown,
): Result<CountryStatistics[], TripValidationError | USCISCalculationError> {
  try {
    const parseResult = CountryStatisticsInputSchema.safeParse({ trips });

    if (!parseResult.success) {
      return err(
        new TripValidationError(ANALYTICS_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateCountryStatistics(validatedData.trips);

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(ANALYTICS_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for calculateDaysAbroadByYear
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateDaysAbroadByYear(
  trips: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
): Result<YearlyDaysAbroad[], DateRangeError | TripValidationError | USCISCalculationError> {
  try {
    const parseResult = DaysAbroadByYearInputSchema.safeParse({
      trips,
      greenCardDate,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new TripValidationError(ANALYTICS_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateDaysAbroadByYear(
      validatedData.trips,
      validatedData.greenCardDate,
      validatedData.currentDate,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(ANALYTICS_VALIDATION.UNKNOWN_ERROR));
  }
}

/**
 * Safe wrapper for projectEligibilityDate
 * Validates inputs and handles errors gracefully
 */
export function safeProjectEligibilityDate(
  trips: unknown,
  totalDaysInUSA: unknown,
  eligibilityCategory: unknown,
  greenCardDate: unknown,
  currentDate?: unknown,
): Result<TravelProjection, DateRangeError | TripValidationError | USCISCalculationError> {
  try {
    const parseResult = ProjectEligibilityDateInputSchema.safeParse({
      trips,
      totalDaysInUSA,
      eligibilityCategory,
      greenCardDate,
      currentDate,
    });

    if (!parseResult.success) {
      return err(
        new TripValidationError(ANALYTICS_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = projectEligibilityDate(
      validatedData.trips,
      validatedData.totalDaysInUSA,
      validatedData.eligibilityCategory,
      validatedData.greenCardDate,
      validatedData.currentDate,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(ANALYTICS_VALIDATION.UNKNOWN_ERROR));
  }
}
