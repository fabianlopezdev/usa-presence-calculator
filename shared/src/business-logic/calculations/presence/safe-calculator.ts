import { z } from 'zod';

import { TripSchema } from '@schemas/trip';
import { 
  chainResult,
  DateRangeError,
  err,
  ok,
  Result,
  TripValidationError,
  USCISCalculationError
} from '@errors/index';

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

/**
 * Input validation schema for presence calculations
 */
const PresenceCalculationInputSchema = z.object({
  trips: z.array(TripSchema),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for eligibility dates
 */
const EligibilityDatesInputSchema = z.object({
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Input validation schema for presence status
 */
const PresenceStatusInputSchema = z.object({
  totalDaysInUSA: z.number().int().nonnegative(),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
});

/**
 * Input validation schema for continuous residence check
 */
const ContinuousResidenceInputSchema = z.object({
  trips: z.array(TripSchema),
});

/**
 * Input validation schema for early filing eligibility
 */
const EarlyFilingInputSchema = z.object({
  greenCardDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  eligibilityCategory: z.enum(['three_year', 'five_year']),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

/**
 * Safe wrapper for calculateDaysOfPhysicalPresence
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateDaysOfPhysicalPresence(
  trips: unknown,
  startDate: unknown,
  endDate?: unknown
): Result<PresenceCalculationResult, DateRangeError | TripValidationError | USCISCalculationError> {
  try {
    const parseResult = PresenceCalculationInputSchema.safeParse({ trips, startDate, endDate });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        'Invalid input for presence calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateDaysOfPhysicalPresence(
      validatedData.trips,
      validatedData.startDate,
      validatedData.endDate || new Date().toISOString().split('T')[0]
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('date')) {
        return err(new DateRangeError(error.message));
      }
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError('Unknown error during presence calculation'));
  }
}

/**
 * Safe wrapper for calculateEligibilityDates
 * Validates inputs and handles errors gracefully
 */
export function safeCalculateEligibilityDates(
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown
): Result<EligibilityDates, DateRangeError | USCISCalculationError> {
  try {
    const parseResult = EligibilityDatesInputSchema.safeParse({
      greenCardDate,
      eligibilityCategory,
      targetDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for eligibility dates calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculateEligibilityDates(
      validatedData.greenCardDate,
      validatedData.eligibilityCategory
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError('Unknown error during eligibility dates calculation'));
  }
}

/**
 * Safe wrapper for calculatePresenceStatus
 * Validates inputs and handles errors gracefully
 */
export function safeCalculatePresenceStatus(
  totalDaysInUSA: unknown,
  eligibilityCategory: unknown
): Result<PresenceStatusDetails, USCISCalculationError> {
  try {
    const parseResult = PresenceStatusInputSchema.safeParse({ totalDaysInUSA, eligibilityCategory });
    
    if (!parseResult.success) {
      return err(new USCISCalculationError(
        'Invalid input for presence status calculation',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = calculatePresenceStatus(
      validatedData.totalDaysInUSA,
      validatedData.eligibilityCategory
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError('Unknown error during presence status calculation'));
  }
}

/**
 * Safe wrapper for checkContinuousResidence
 * Validates inputs and handles errors gracefully
 */
export function safeCheckContinuousResidence(
  trips: unknown
): Result<ContinuousResidenceWarningSimple[], TripValidationError | USCISCalculationError> {
  try {
    const parseResult = ContinuousResidenceInputSchema.safeParse({ trips });
    
    if (!parseResult.success) {
      return err(new TripValidationError(
        'Invalid input for continuous residence check',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = checkContinuousResidence(validatedData.trips);

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError('Unknown error during continuous residence check'));
  }
}

/**
 * Safe wrapper for isEligibleForEarlyFiling
 * Validates inputs and handles errors gracefully
 */
export function safeIsEligibleForEarlyFiling(
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown
): Result<boolean, DateRangeError | USCISCalculationError> {
  try {
    const parseResult = EarlyFilingInputSchema.safeParse({
      greenCardDate,
      eligibilityCategory,
      targetDate,
    });
    
    if (!parseResult.success) {
      return err(new DateRangeError(
        'Invalid input for early filing eligibility check',
        parseResult.error.format()
      ));
    }

    const validatedData = parseResult.data;
    const result = isEligibleForEarlyFiling(
      validatedData.greenCardDate,
      validatedData.eligibilityCategory,
      validatedData.targetDate || new Date().toISOString().split('T')[0]
    );

    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      return err(new USCISCalculationError(error.message));
    }
    return err(new USCISCalculationError('Unknown error during early filing eligibility check'));
  }
}

/**
 * Comprehensive safe presence calculation that chains multiple operations
 * Returns all presence-related data or appropriate errors
 */
export function safeCalculateComprehensivePresence(
  trips: unknown,
  greenCardDate: unknown,
  eligibilityCategory: unknown,
  targetDate?: unknown
): Result<{
  physicalPresence: PresenceCalculationResult;
  eligibilityDates: EligibilityDates;
  presenceStatus: PresenceStatusDetails;
  continuousResidenceWarnings: ContinuousResidenceWarningSimple[];
  isEligibleForEarlyFiling: boolean;
}, DateRangeError | TripValidationError | USCISCalculationError> {
  // First calculate physical presence
  const presenceResult = safeCalculateDaysOfPhysicalPresence(trips, greenCardDate, targetDate);
  
  return chainResult(presenceResult, (physicalPresence) => {
    // Then calculate eligibility dates
    const eligibilityResult = safeCalculateEligibilityDates(
      greenCardDate,
      eligibilityCategory,
      targetDate
    );
    
    return chainResult(eligibilityResult, (eligibilityDates) => {
      // Calculate presence status
      const statusResult = safeCalculatePresenceStatus(
        physicalPresence.totalDaysInUSA,
        eligibilityCategory
      );
      
      return chainResult(statusResult, (presenceStatus) => {
        // Check continuous residence
        const residenceResult = safeCheckContinuousResidence(trips);
        
        return chainResult(residenceResult, (continuousResidenceWarnings) => {
          // Check early filing eligibility
          const earlyFilingResult = safeIsEligibleForEarlyFiling(
            greenCardDate,
            eligibilityCategory,
            targetDate
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