import { z } from 'zod';

import { DATE_VALIDATION, PRESENCE_VALIDATION } from '@constants/validation-messages';
import {
  chainResult,
  DateRangeError,
  err,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError,
} from '@errors/index';
import { TripSchema } from '@schemas/trip';

import {
  calculateDaysOfPhysicalPresence,
  calculateEligibilityDates,
  calculatePresenceStatus,
  checkContinuousResidence,
  isEligibleForEarlyFiling,
} from './calculator';
import type {
  ContinuousResidenceWarningSimple,
  EligibilityDates,
  PresenceCalculationResult,
  PresenceStatusDetails,
} from '@schemas/presence';

const PresenceCalculationInputSchema = z.object({
  trips: z.array(TripSchema),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

const EligibilityDatesInputSchema = z.object({
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

const PresenceStatusInputSchema = z.object({
  totalDaysInUSA: z.number().int().nonnegative(),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
});

const ContinuousResidenceInputSchema = z.object({
  trips: z.array(TripSchema),
});

const EarlyFilingInputSchema = z.object({
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, DATE_VALIDATION.INVALID_FORMAT)
    .optional(),
});

export function safeCalculateDaysOfPhysicalPresence(
  trips: unknown,
  startDate: unknown,
  endDate?: unknown,
): Result<PresenceCalculationResult, DateRangeError | TripValidationError | USCISCalculationError> {
  try {
    const parseResult = PresenceCalculationInputSchema.safeParse({ trips, startDate, endDate });

    if (!parseResult.success) {
      return err(
        new TripValidationError(PRESENCE_VALIDATION.INVALID_INPUT, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateDaysOfPhysicalPresence(
      validatedData.trips,
      validatedData.startDate,
      validatedData.endDate || new Date().toISOString().split('T')[0],
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(PRESENCE_VALIDATION.UNKNOWN_ERROR));
  }
}

export function safeCalculateEligibilityDates(
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown,
): Result<EligibilityDates, DateRangeError | USCISCalculationError> {
  try {
    const parseResult = EligibilityDatesInputSchema.safeParse({
      greenCardDate,
      eligibilityCategory,
      targetDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(
          PRESENCE_VALIDATION.INVALID_ELIGIBILITY_DATES,
          parseResult.error.format(),
        ),
      );
    }

    const validatedData = parseResult.data;
    const result = calculateEligibilityDates(
      validatedData.greenCardDate,
      validatedData.eligibilityCategory,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(PRESENCE_VALIDATION.UNKNOWN_ERROR_ELIGIBILITY));
  }
}

export function safeCalculatePresenceStatus(
  totalDaysInUSA: unknown,
  eligibilityCategory: unknown,
): Result<PresenceStatusDetails, USCISCalculationError> {
  try {
    const parseResult = PresenceStatusInputSchema.safeParse({
      totalDaysInUSA,
      eligibilityCategory,
    });

    if (!parseResult.success) {
      return err(
        new USCISCalculationError(PRESENCE_VALIDATION.INVALID_STATUS, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = calculatePresenceStatus(
      validatedData.totalDaysInUSA,
      validatedData.eligibilityCategory,
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(PRESENCE_VALIDATION.UNKNOWN_ERROR_STATUS));
  }
}

export function safeCheckContinuousResidence(
  trips: unknown,
): Result<ContinuousResidenceWarningSimple[], TripValidationError | USCISCalculationError> {
  try {
    const parseResult = ContinuousResidenceInputSchema.safeParse({ trips });

    if (!parseResult.success) {
      return err(
        new TripValidationError(
          PRESENCE_VALIDATION.INVALID_CONTINUOUS_RESIDENCE,
          parseResult.error.format(),
        ),
      );
    }

    const validatedData = parseResult.data;
    const result = checkContinuousResidence(validatedData.trips);

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(PRESENCE_VALIDATION.UNKNOWN_ERROR_CONTINUOUS));
  }
}

export function safeIsEligibleForEarlyFiling(
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown,
): Result<boolean, DateRangeError | USCISCalculationError> {
  try {
    const parseResult = EarlyFilingInputSchema.safeParse({
      greenCardDate,
      eligibilityCategory,
      targetDate,
    });

    if (!parseResult.success) {
      return err(
        new DateRangeError(PRESENCE_VALIDATION.INVALID_EARLY_FILING, parseResult.error.format()),
      );
    }

    const validatedData = parseResult.data;
    const result = isEligibleForEarlyFiling(
      validatedData.greenCardDate,
      validatedData.eligibilityCategory,
      validatedData.targetDate || new Date().toISOString().split('T')[0],
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError(PRESENCE_VALIDATION.UNKNOWN_ERROR_EARLY_FILING));
  }
}

export function safeCalculateComprehensivePresence(
  trips: unknown,
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown,
): Result<
  {
    physicalPresence: PresenceCalculationResult;
    eligibilityDates: EligibilityDates;
    presenceStatus: PresenceStatusDetails;
    continuousResidenceWarnings: ContinuousResidenceWarningSimple[];
    isEligibleForEarlyFiling: boolean;
  },
  DateRangeError | TripValidationError | USCISCalculationError
> {
  const presenceResult = safeCalculateDaysOfPhysicalPresence(trips, greenCardDate, targetDate);

  return chainResult(presenceResult, (physicalPresence) => {
    const eligibilityResult = safeCalculateEligibilityDates(
      greenCardDate,
      eligibilityCategory,
      targetDate,
    );

    return chainResult(eligibilityResult, (eligibilityDates) => {
      const statusResult = safeCalculatePresenceStatus(
        physicalPresence.totalDaysInUSA,
        eligibilityCategory,
      );

      return chainResult(statusResult, (presenceStatus) => {
        const residenceResult = safeCheckContinuousResidence(trips);

        return chainResult(residenceResult, (continuousResidenceWarnings) => {
          const earlyFilingResult = safeIsEligibleForEarlyFiling(
            greenCardDate,
            eligibilityCategory,
            targetDate,
          );

          return chainResult(earlyFilingResult, (isEligibleForEarlyFiling) => {
            return ok({
              physicalPresence,
              eligibilityDates,
              presenceStatus,
              continuousResidenceWarnings,
              isEligibleForEarlyFiling,
            });
          });
        });
      });
    });
  });
}
